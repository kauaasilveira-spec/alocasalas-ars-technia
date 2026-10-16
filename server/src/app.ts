import bcrypt from 'bcryptjs';
import express, { type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { aiEnabled, explainRecommendation, parseNaturalRequest } from './ai.js';
import { requireAuth, requireGestao, signToken } from './auth.js';
import { findConflicts, validateBooking, type BookingDraft } from './conflicts.js';
import { logAction, type DB } from './db.js';
import { recommendRooms, WEIGHTS } from './recommend.js';
import { getRoom, getRooms, linkedRoomIds, ROOM_TYPES, SIZE_LABEL, sizeCategory } from './rooms.js';
import {
  addDays,
  BOOKING_TYPES,
  isDate,
  nowLocal,
  OPERATING_HOURS,
  overlaps,
  PERIODS,
  startOfWeek,
} from './schedule.js';
import { roomUtilization, usageReport, weeklyHistory } from './stats.js';
import type { Booking, Room, SchoolClass, User } from './types.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido');
const date = z.string().refine(isDate, 'Data inválida');
const bool01 = z.union([z.boolean(), z.number()]).transform((v) => (v ? 1 : 0));

const registerSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.email('E-mail inválido').transform((e) => e.toLowerCase()),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

const roomSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da sala'),
  type: z.string().trim().min(1),
  setor: z.string().trim().default(''),
  floor: z.string().trim().default(''),
  description: z.string().trim().default(''),
  capacity: z.coerce.number().int().min(1, 'Capacidade deve ser maior que zero'),
  computers: z.coerce.number().int().min(0).default(0),
  has_projector: bool01.default(0),
  has_ac: bool01.default(1),
  has_tv: bool01.default(0),
  accessible: bool01.default(1),
  status: z.enum(['ativa', 'manutencao', 'inativa']).default('ativa'),
  status_note: z.string().trim().default(''),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  image: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, 'Imagem inválida')
    .max(3_000_000, 'Imagem muito grande (máx. ~2 MB)')
    .nullable()
    .optional(),
});

const classSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da turma'),
  course: z.string().trim().default(''),
  student_count: z.coerce.number().int().min(1, 'Quantidade de alunos inválida'),
  needs_computers: bool01.default(0),
  needs_projector: bool01.default(0),
  needs_accessibility: bool01.default(0),
});

const bookingSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  class_id: z.coerce.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1, 'Informe o título/descrição curta'),
  type: z.enum(Object.keys(BOOKING_TYPES) as [string, ...string[]]),
  date,
  start_time: time,
  end_time: time,
  attendees: z.coerce.number().int().min(1, 'Quantidade de pessoas inválida'),
  description: z.string().trim().default(''),
  repeat_weeks: z.coerce.number().int().min(1).max(20).default(1),
  recommendation: z.string().nullable().optional(),
});

const recommendSchema = z.object({
  attendees: z.coerce.number().int().min(1),
  date,
  start_time: time,
  end_time: time,
  class_id: z.coerce.number().int().positive().nullable().optional(),
  needs_computers: z.boolean().optional(),
  needs_projector: z.boolean().optional(),
  needs_accessibility: z.boolean().optional(),
  preferred_type: z.string().optional(),
  explain: z.boolean().default(true),
});

function parse<T extends z.ZodType>(schema: T, data: unknown, res: Response): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? 'Dados inválidos', issues: result.error.issues });
    return null;
  }
  return result.data;
}

const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  last_access: u.last_access,
  created_at: u.created_at,
});

const roomOut = (r: Room) => {
  const { image, ...rest } = r;
  return {
    ...rest,
    has_image: Boolean(image),
    size_category: sizeCategory(r.capacity),
    size_label: SIZE_LABEL[sizeCategory(r.capacity)],
  };
};

type BookingRow = Booking & { room_name: string; user_name: string; class_name: string | null; reviewer_name: string | null };

const BOOKING_SELECT = `
  SELECT b.*, r.name AS room_name, u.name AS user_name, c.name AS class_name, rv.name AS reviewer_name
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN users u ON u.id = b.user_id
  LEFT JOIN classes c ON c.id = b.class_id
  LEFT JOIN users rv ON rv.id = b.reviewed_by`;

type LiveStatus = 'aberta' | 'reservada' | 'fechada' | 'manutencao';

/** Situação de cada sala em um instante (padrão: agora). */
function liveStatuses(db: DB, at = nowLocal()) {
  const rooms = getRooms(db);
  const hours = OPERATING_HOURS[new Date(`${at.date}T00:00:00Z`).getUTCDay()];
  const isOpenHours = Boolean(hours && at.time >= hours.start && at.time < hours.end);
  const today = db
    .prepare(`${BOOKING_SELECT} WHERE b.date = ? AND b.status = 'aprovada' ORDER BY b.start_time`)
    .all(at.date) as BookingRow[];

  return rooms.map((room) => {
    const linked = linkedRoomIds(room, rooms);
    const mine = today.filter((b) => linked.includes(b.room_id));
    const current = mine.find((b) => b.start_time <= at.time && at.time < b.end_time) ?? null;
    const next = mine.find((b) => b.start_time > at.time) ?? null;
    let live: LiveStatus = 'aberta';
    if (room.status === 'manutencao') live = 'manutencao';
    else if (room.status === 'inativa' || !isOpenHours) live = 'fechada';
    else if (current) live = 'reservada';
    return { ...roomOut(room), live_status: live, current_booking: current, next_booking: next };
  });
}

export function createApp(db: DB) {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  api.get('/meta', (_req, res) => {
    res.json({
      periods: PERIODS,
      operating_hours: OPERATING_HOURS,
      booking_types: BOOKING_TYPES,
      room_types: ROOM_TYPES,
      size_labels: SIZE_LABEL,
      weights: WEIGHTS,
      ai_enabled: aiEnabled(),
      now: nowLocal(),
    });
  });

  // ---------- Autenticação ----------
  api.post('/auth/register', (req, res) => {
    const data = parse(registerSchema, req.body, res);
    if (!data) return;
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) {
      res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
      return;
    }
    const hash = bcrypt.hashSync(data.password, 10);
    const info = db
      .prepare("INSERT INTO users (name, email, password_hash, role, last_access) VALUES (?, ?, ?, 'professor', datetime('now'))")
      .run(data.name, data.email, hash);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as User;
    logAction(db, user.id, 'cadastro', 'usuario', user.id, `Nova conta de ${user.name}`);
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  api.post('/auth/login', (req, res) => {
    const email = String(req.body?.email ?? '').toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    if (!user || !bcrypt.compareSync(String(req.body?.password ?? ''), user.password_hash)) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }
    db.prepare("UPDATE users SET last_access = datetime('now') WHERE id = ?").run(user.id);
    res.json({ token: signToken(user), user: publicUser({ ...user, last_access: new Date().toISOString() }) });
  });

  api.use(requireAuth);

  api.get('/me', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as User | undefined;
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }
    const counts = db
      .prepare(
        `SELECT
           SUM(status = 'aprovada') AS aprovadas,
           SUM(status = 'pendente') AS pendentes,
           SUM(status = 'recusada') AS recusadas,
           COUNT(*) AS total
         FROM bookings WHERE user_id = ?`,
      )
      .get(user.id);
    res.json({ user: publicUser(user), stats: counts });
  });

  api.put('/me', (req, res) => {
    const data = parse(
      z.object({
        name: z.string().trim().min(3, 'Informe o nome completo'),
        email: z.email('E-mail inválido').transform((e) => e.toLowerCase()),
        password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres').optional().or(z.literal('')),
      }),
      req.body,
      res,
    );
    if (!data) return;
    const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(data.email, req.user!.id);
    if (taken) {
      res.status(409).json({ error: 'Este e-mail já está em uso.' });
      return;
    }
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(data.name, data.email, req.user!.id);
    if (data.password) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(data.password, 10), req.user!.id);
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as User;
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  // ---------- Painel ----------
  api.get('/dashboard', (req, res) => {
    const now = nowLocal();
    const rooms = liveStatuses(db, now);
    const count = (s: LiveStatus) => rooms.filter((r) => r.live_status === s).length;
    const weekStart = startOfWeek(now.date);
    const weekEnd = addDays(weekStart, 6);
    const scope = req.user!.role === 'gestao' ? '' : 'AND b.user_id = @uid';
    const upcoming = db
      .prepare(
        `${BOOKING_SELECT} WHERE b.status IN ('pendente','aprovada') AND (b.date > @d OR (b.date = @d AND b.end_time > @t)) ${scope}
         ORDER BY b.date, b.start_time LIMIT 6`,
      )
      .all({ d: now.date, t: now.time, uid: req.user!.id }) as BookingRow[];
    const week = db
      .prepare(
        `SELECT
           SUM(status = 'aprovada') AS aprovadas,
           SUM(status = 'pendente') AS pendentes,
           COUNT(*) AS total
         FROM bookings b WHERE date BETWEEN @from AND @to AND status IN ('aprovada','pendente') ${scope}`,
      )
      .get({ from: weekStart, to: weekEnd, uid: req.user!.id });
    const pending = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = 'pendente'").get() as { n: number }).n;
    const utilization = roomUtilization(db, weekStart, weekEnd);
    const avgUtil =
      rooms.length > 0 ? [...utilization.values()].reduce((a, b) => a + b, 0) / rooms.length : 0;

    res.json({
      now,
      summary: {
        abertas: count('aberta'),
        reservadas: count('reservada'),
        fechadas: count('fechada'),
        manutencao: count('manutencao'),
      },
      week,
      week_utilization: Math.round(avgUtil * 1000) / 10,
      pending_requests: pending,
      maintenance_notices: rooms
        .filter((r) => r.status === 'manutencao' || r.status_note)
        .map((r) => ({ room_id: r.id, room_name: r.name, status: r.status, note: r.status_note, updated_at: r.updated_at })),
      rooms,
      upcoming,
    });
  });

  // ---------- Salas ----------
  api.get('/rooms', (req, res) => {
    const q = String(req.query.q ?? '').toLowerCase().trim();
    const minCap = Number(req.query.min_capacity ?? 0);
    const flags = (k: string) => req.query[k] === '1' || req.query[k] === 'true';
    const { date: d, start_time: s, end_time: e } = req.query as Record<string, string | undefined>;
    let rooms: (ReturnType<typeof liveStatuses>[number] & { available?: boolean })[] = liveStatuses(db);
    rooms = rooms.filter((r) => {
      if (q && !`${r.name} ${r.type} ${r.setor} ${r.description}`.toLowerCase().includes(q)) return false;
      if (minCap && r.capacity < minCap) return false;
      if (flags('accessible') && !r.accessible) return false;
      if (flags('has_ac') && !r.has_ac) return false;
      if (flags('has_projector') && !r.has_projector) return false;
      if (flags('computers') && r.computers === 0) return false;
      if (req.query.type && r.type !== req.query.type) return false;
      if (req.query.size && r.size_category !== req.query.size) return false;
      if (req.query.status && r.live_status !== req.query.status) return false;
      return true;
    });
    if (d && s && e && isDate(d)) {
      rooms = rooms.map((r) => {
        const conflicts = findConflicts(db, {
          room_id: r.id,
          user_id: req.user!.id,
          type: 'aula',
          date: d,
          start_time: s,
          end_time: e,
          attendees: 1,
        }).filter((c) => c.blocking && c.kind !== 'turma');
        return { ...r, available: r.status === 'ativa' && conflicts.length === 0 };
      });
      if (flags('only_available')) rooms = rooms.filter((r) => r.available);
    }
    res.json(rooms);
  });

  api.get('/rooms/:id', (req, res) => {
    const room = getRoom(db, Number(req.params.id));
    if (!room) {
      res.status(404).json({ error: 'Sala não encontrada.' });
      return;
    }
    const all = getRooms(db);
    const now = nowLocal();
    const from = String(req.query.from ?? startOfWeek(now.date));
    const to = String(req.query.to ?? addDays(from, 6));
    const linked = linkedRoomIds(room, all);
    const schedule = db
      .prepare(
        `${BOOKING_SELECT} WHERE b.room_id IN (${linked.map(() => '?').join(',')}) AND b.date BETWEEN ? AND ?
         AND b.status IN ('pendente','aprovada') ORDER BY b.date, b.start_time`,
      )
      .all(...linked, from, to) as BookingRow[];
    const live = liveStatuses(db, now).find((r) => r.id === room.id);
    const monthFrom = addDays(now.date, -29);
    res.json({
      ...live,
      parent: room.parent_id ? roomOut(all.find((r) => r.id === room.parent_id)!) : null,
      children: all.filter((r) => r.parent_id === room.id).map(roomOut),
      schedule,
      history: weeklyHistory(db, now.date, 12, room.id),
      utilization_30d: Math.round((roomUtilization(db, monthFrom, now.date).get(room.id) ?? 0) * 1000) / 10,
      total_bookings: (
        db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE room_id = ? AND status = 'aprovada'").get(room.id) as { n: number }
      ).n,
    });
  });

  api.get('/rooms/:id/image', (req, res) => {
    const row = db.prepare('SELECT image FROM rooms WHERE id = ?').get(Number(req.params.id)) as { image: string | null } | undefined;
    const match = row?.image?.match(/^data:(image\/[a-z+]+);base64,(.*)$/);
    if (!match) {
      res.status(404).end();
      return;
    }
    res.type(match[1]).send(Buffer.from(match[2], 'base64'));
  });

  const saveRoom = (req: Request, res: Response, id?: number) => {
    const data = parse(roomSchema, req.body, res);
    if (!data) return;
    if (data.parent_id) {
      const parent = getRoom(db, data.parent_id);
      if (!parent || parent.id === id || parent.parent_id) {
        res.status(400).json({ error: 'Ambiente principal inválido.' });
        return;
      }
    }
    const fields = {
      ...data,
      parent_id: data.parent_id ?? null,
      image: data.image ?? null,
    };
    if (id) {
      const existing = getRoom(db, id);
      if (!existing) {
        res.status(404).json({ error: 'Sala não encontrada.' });
        return;
      }
      const keepImage = req.body.image === undefined;
      db.prepare(
        `UPDATE rooms SET name=@name, type=@type, setor=@setor, floor=@floor, description=@description, capacity=@capacity,
         computers=@computers, has_projector=@has_projector, has_ac=@has_ac, has_tv=@has_tv, accessible=@accessible,
         status=@status, status_note=@status_note, parent_id=@parent_id, ${keepImage ? '' : 'image=@image,'} updated_at=datetime('now')
         WHERE id=@id`,
      ).run({ ...fields, id });
      if (existing.status !== data.status) {
        logAction(db, req.user!.id, 'status_sala', 'sala', id, `${data.name}: ${existing.status} → ${data.status}${data.status_note ? ` (${data.status_note})` : ''}`);
      } else {
        logAction(db, req.user!.id, 'editar', 'sala', id, `Sala ${data.name} atualizada`);
      }
      res.json(roomOut(getRoom(db, id)!));
    } else {
      const info = db
        .prepare(
          `INSERT INTO rooms (name, type, setor, floor, description, capacity, computers, has_projector, has_ac, has_tv, accessible, status, status_note, parent_id, image)
           VALUES (@name, @type, @setor, @floor, @description, @capacity, @computers, @has_projector, @has_ac, @has_tv, @accessible, @status, @status_note, @parent_id, @image)`,
        )
        .run(fields);
      logAction(db, req.user!.id, 'criar', 'sala', Number(info.lastInsertRowid), `Sala ${data.name} cadastrada`);
      res.status(201).json(roomOut(getRoom(db, Number(info.lastInsertRowid))!));
    }
  };

  api.post('/rooms', requireGestao, (req, res) => saveRoom(req, res));
  api.put('/rooms/:id', requireGestao, (req, res) => saveRoom(req, res, Number(req.params.id)));
  api.delete('/rooms/:id', requireGestao, (req, res) => {
    const room = getRoom(db, Number(req.params.id));
    if (!room) {
      res.status(404).json({ error: 'Sala não encontrada.' });
      return;
    }
    const now = nowLocal();
    const future = db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE room_id = ? AND status IN ('pendente','aprovada') AND date >= ?")
      .get(room.id, now.date) as { n: number };
    if (future.n > 0) {
      res.status(409).json({ error: `Não é possível excluir: há ${future.n} reserva(s) futura(s). Desative a sala ou cancele as reservas.` });
      return;
    }
    db.prepare('DELETE FROM rooms WHERE id = ?').run(room.id);
    logAction(db, req.user!.id, 'excluir', 'sala', room.id, `Sala ${room.name} excluída`);
    res.status(204).end();
  });

  // ---------- Turmas ----------
  api.get('/classes', (req, res) => {
    const rows =
      req.user!.role === 'gestao' && req.query.all === '1'
        ? db.prepare('SELECT c.*, u.name AS professor_name FROM classes c JOIN users u ON u.id = c.professor_id ORDER BY c.name').all()
        : db.prepare('SELECT * FROM classes WHERE professor_id = ? ORDER BY name').all(req.user!.id);
    res.json(rows);
  });

  api.post('/classes', (req, res) => {
    const data = parse(classSchema, req.body, res);
    if (!data) return;
    const info = db
      .prepare(
        `INSERT INTO classes (professor_id, name, course, student_count, needs_computers, needs_projector, needs_accessibility)
         VALUES (@professor_id, @name, @course, @student_count, @needs_computers, @needs_projector, @needs_accessibility)`,
      )
      .run({ ...data, professor_id: req.user!.id });
    logAction(db, req.user!.id, 'criar', 'turma', Number(info.lastInsertRowid), `Turma ${data.name} (${data.student_count} alunos)`);
    res.status(201).json(db.prepare('SELECT * FROM classes WHERE id = ?').get(info.lastInsertRowid));
  });

  const ownClass = (req: Request, res: Response) => {
    const c = db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(req.params.id)) as SchoolClass | undefined;
    if (!c || (c.professor_id !== req.user!.id && req.user!.role !== 'gestao')) {
      res.status(404).json({ error: 'Turma não encontrada.' });
      return null;
    }
    return c;
  };

  api.put('/classes/:id', (req, res) => {
    const c = ownClass(req, res);
    if (!c) return;
    const data = parse(classSchema, req.body, res);
    if (!data) return;
    db.prepare(
      `UPDATE classes SET name=@name, course=@course, student_count=@student_count, needs_computers=@needs_computers,
       needs_projector=@needs_projector, needs_accessibility=@needs_accessibility WHERE id=@id`,
    ).run({ ...data, id: c.id });
    res.json(db.prepare('SELECT * FROM classes WHERE id = ?').get(c.id));
  });

  api.delete('/classes/:id', (req, res) => {
    const c = ownClass(req, res);
    if (!c) return;
    db.prepare('DELETE FROM classes WHERE id = ?').run(c.id);
    res.status(204).end();
  });

  // ---------- Recomendação / IA ----------
  api.post('/recommend', async (req, res) => {
    const data = parse(recommendSchema, req.body, res);
    if (!data) return;
    const request = { ...data, user_id: req.user!.id };
    const result = recommendRooms(db, request);
    const explanation = data.explain
      ? await explainRecommendation(request, result.recommendations, result.discarded)
      : null;
    res.json({
      ...result,
      recommendations: result.recommendations.map((r) => ({ ...r, room: roomOut(r.room) })),
      explanation,
      weights: WEIGHTS,
    });
  });

  api.post('/ai/parse', async (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    if (!text) {
      res.status(400).json({ error: 'Descreva o que você precisa.' });
      return;
    }
    if (!aiEnabled()) {
      res.status(503).json({ error: 'Assistente de IA indisponível: configure GEMINI_API_KEY no servidor.' });
      return;
    }
    try {
      res.json(await parseNaturalRequest(text, nowLocal().date));
    } catch (err) {
      res.status(502).json({ error: `Falha ao consultar o Gemini: ${(err as Error).message}` });
    }
  });

  // ---------- Reservas ----------
  api.get('/bookings', (req, res) => {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    const mine = req.user!.role !== 'gestao' || req.query.mine === '1';
    if (mine) {
      where.push('b.user_id = @uid');
      params.uid = req.user!.id;
    }
    if (req.query.status) {
      where.push('b.status = @status');
      params.status = req.query.status;
    }
    if (req.query.room_id) {
      where.push('b.room_id = @room');
      params.room = Number(req.query.room_id);
    }
    if (req.query.from) {
      where.push('b.date >= @from');
      params.from = req.query.from;
    }
    if (req.query.to) {
      where.push('b.date <= @to');
      params.to = req.query.to;
    }
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const rows = db
      .prepare(
        `${BOOKING_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY b.date ${order}, b.start_time ${order} LIMIT 500`,
      )
      .all(params);
    res.json(rows);
  });

  api.get('/bookings/:id', (req, res) => {
    const b = db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(Number(req.params.id)) as BookingRow | undefined;
    if (!b || (req.user!.role !== 'gestao' && b.user_id !== req.user!.id)) {
      res.status(404).json({ error: 'Reserva não encontrada.' });
      return;
    }
    const validation =
      b.status === 'pendente'
        ? validateBooking(db, b, { role: 'gestao', excludeId: b.id })
        : null;
    const alternatives =
      validation && !validation.ok
        ? recommendRooms(db, { ...b, user_id: b.user_id }, 3).recommendations.map((r) => ({ ...r, room: roomOut(r.room) }))
        : [];
    res.json({ ...b, validation, alternatives });
  });

  const occurrences = (data: z.infer<typeof bookingSchema>) =>
    [...Array(data.repeat_weeks)].map((_, i) => addDays(data.date, i * 7));

  api.post('/bookings/check', (req, res) => {
    const data = parse(bookingSchema.partial({ title: true }), req.body, res);
    if (!data) return;
    const results = occurrences({ ...data, title: data.title ?? '' }).map((d) => ({
      date: d,
      ...validateBooking(db, { ...data, date: d, user_id: req.user!.id }, { role: req.user!.role }),
    }));
    res.json({ ok: results.every((r) => r.ok), results });
  });

  api.post('/bookings', (req, res) => {
    const data = parse(bookingSchema, req.body, res);
    if (!data) return;
    if (data.class_id) {
      const c = db.prepare('SELECT * FROM classes WHERE id = ?').get(data.class_id) as SchoolClass | undefined;
      if (!c || (c.professor_id !== req.user!.id && req.user!.role !== 'gestao')) {
        res.status(400).json({ error: 'Turma inválida.' });
        return;
      }
    }
    const dates = occurrences(data);
    const status = req.user!.role === 'gestao' ? 'aprovada' : 'pendente';
    const seriesId = dates.length > 1 ? randomUUID() : null;

    const tx = db.transaction(() => {
      const failures: { date: string; errors: string[]; conflicts: unknown[] }[] = [];
      for (const d of dates) {
        const draft: BookingDraft = { ...data, date: d, user_id: req.user!.id };
        const v = validateBooking(db, draft, { role: req.user!.role });
        if (!v.ok) failures.push({ date: d, errors: v.errors, conflicts: v.conflicts.filter((c) => c.blocking) });
      }
      if (failures.length) return { failures, ids: [] as number[] };
      const insert = db.prepare(
        `INSERT INTO bookings (room_id, user_id, class_id, title, type, date, start_time, end_time, attendees, description, status, recommendation, series_id, reviewed_by, reviewed_at)
         VALUES (@room_id, @user_id, @class_id, @title, @type, @date, @start_time, @end_time, @attendees, @description, @status, @recommendation, @series_id, @reviewed_by, @reviewed_at)`,
      );
      const ids = dates.map(
        (d) =>
          Number(
            insert.run({
              ...data,
              class_id: data.class_id ?? null,
              recommendation: data.recommendation ?? null,
              date: d,
              user_id: req.user!.id,
              status,
              series_id: seriesId,
              reviewed_by: status === 'aprovada' ? req.user!.id : null,
              reviewed_at: status === 'aprovada' ? new Date().toISOString() : null,
            }).lastInsertRowid,
          ),
      );
      return { failures, ids };
    });

    const result = tx();
    if (result.failures.length) {
      const first = result.failures[0];
      res.status(409).json({
        error:
          first.errors[0] ??
          (first.conflicts[0] as { message?: string })?.message ??
          'Conflito de horário.',
        failures: result.failures,
      });
      return;
    }
    const room = getRoom(db, data.room_id)!;
    logAction(
      db,
      req.user!.id,
      status === 'aprovada' ? 'reserva_direta' : 'solicitacao',
      'reserva',
      result.ids[0],
      `${data.title} em ${room.name} — ${data.date} ${data.start_time}–${data.end_time}${dates.length > 1 ? ` (${dates.length} semanas)` : ''}`,
    );
    const created = db
      .prepare(`${BOOKING_SELECT} WHERE b.id IN (${result.ids.map(() => '?').join(',')}) ORDER BY b.date`)
      .all(...result.ids);
    res.status(201).json(created);
  });

  const review = (decision: 'aprovada' | 'recusada') => (req: Request, res: Response) => {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.id)) as Booking | undefined;
    if (!b) {
      res.status(404).json({ error: 'Solicitação não encontrada.' });
      return;
    }
    if (b.status !== 'pendente') {
      res.status(409).json({ error: `Esta solicitação já foi ${b.status}.` });
      return;
    }
    const note = String(req.body?.note ?? '').trim();
    const applyToSeries = Boolean(req.body?.series) && b.series_id;
    const targets = applyToSeries
      ? (db.prepare("SELECT * FROM bookings WHERE series_id = ? AND status = 'pendente'").all(b.series_id) as Booking[])
      : [b];

    if (decision === 'aprovada') {
      for (const t of targets) {
        const v = validateBooking(db, t, { role: 'gestao', excludeId: t.id, skipPastCheck: true });
        if (!v.ok) {
          res.status(409).json({
            error: `Não é possível aprovar (${t.date}): ${v.errors[0] ?? v.conflicts.find((c) => c.blocking)?.message}`,
            validation: v,
          });
          return;
        }
      }
    } else if (!note) {
      res.status(400).json({ error: 'Informe o motivo da recusa.' });
      return;
    }
    const update = db.prepare(
      "UPDATE bookings SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?",
    );
    db.transaction(() => targets.forEach((t) => update.run(decision, note, req.user!.id, t.id)))();
    logAction(
      db,
      req.user!.id,
      decision === 'aprovada' ? 'aprovar' : 'recusar',
      'reserva',
      b.id,
      `${b.title} (${b.date} ${b.start_time}–${b.end_time})${targets.length > 1 ? ` + ${targets.length - 1} ocorrência(s)` : ''}${note ? ` — ${note}` : ''}`,
    );
    res.json(db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(b.id));
  };

  api.post('/bookings/:id/approve', requireGestao, review('aprovada'));
  api.post('/bookings/:id/reject', requireGestao, review('recusada'));

  api.post('/bookings/:id/cancel', (req, res) => {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.id)) as Booking | undefined;
    if (!b || (b.user_id !== req.user!.id && req.user!.role !== 'gestao')) {
      res.status(404).json({ error: 'Reserva não encontrada.' });
      return;
    }
    if (b.status === 'cancelada' || b.status === 'recusada') {
      res.status(409).json({ error: 'Esta reserva já não está ativa.' });
      return;
    }
    db.prepare("UPDATE bookings SET status = 'cancelada', review_note = ? WHERE id = ?").run(
      String(req.body?.note ?? ''),
      b.id,
    );
    logAction(db, req.user!.id, 'cancelar', 'reserva', b.id, `${b.title} (${b.date} ${b.start_time}–${b.end_time})`);
    res.json({ ok: true });
  });

  // ---------- Ocupação / Histórico ----------
  api.get('/occupancy', (req, res) => {
    const d = isDate(String(req.query.date)) ? String(req.query.date) : nowLocal().date;
    const bookings = db
      .prepare(`${BOOKING_SELECT} WHERE b.date = ? AND b.status IN ('pendente','aprovada') ORDER BY b.start_time`)
      .all(d) as BookingRow[];
    const rooms = getRooms(db).map(roomOut);
    const conflicts: { a: number; b: number }[] = [];
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const a = bookings[i];
        const b = bookings[j];
        const linked = linkedRoomIds(
          rooms.find((r) => r.id === a.room_id)!,
          rooms,
        );
        if (linked.includes(b.room_id) && overlaps(a.start_time, a.end_time, b.start_time, b.end_time)) {
          conflicts.push({ a: a.id, b: b.id });
        }
      }
    }
    res.json({ date: d, hours: OPERATING_HOURS[new Date(`${d}T00:00:00Z`).getUTCDay()], rooms, bookings, conflicts });
  });

  api.get('/stats/usage', requireGestao, (req, res) => {
    const now = nowLocal();
    const to = isDate(String(req.query.to)) ? String(req.query.to) : now.date;
    const from = isDate(String(req.query.from)) ? String(req.query.from) : addDays(to, -29);
    res.json(usageReport(db, from, to));
  });

  api.get('/stats/history', (req, res) => {
    const weeks = Math.min(52, Math.max(2, Number(req.query.weeks ?? 12)));
    const roomId = req.query.room_id ? Number(req.query.room_id) : undefined;
    res.json(weeklyHistory(db, nowLocal().date, weeks, roomId));
  });

  api.get('/audit', requireGestao, (req, res) => {
    const limit = Math.min(500, Number(req.query.limit ?? 100));
    res.json(
      db
        .prepare(
          `SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
           ORDER BY a.id DESC LIMIT ?`,
        )
        .all(limit),
    );
  });

  app.use('/api', api);
  return app;
}
