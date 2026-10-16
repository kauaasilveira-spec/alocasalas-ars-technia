import { beforeEach, describe, expect, it } from 'vitest';
import { validateBooking } from './conflicts.js';
import { openDb, type DB } from './db.js';
import { hardFilter, recommendRooms, scoreRoom } from './recommend.js';
import { linkedRoomIds } from './rooms.js';
import { checkOperatingHours, overlaps } from './schedule.js';
import type { Room } from './types.js';

const FUTURE_MONDAY = '2099-01-05';
const FUTURE_SATURDAY = '2099-01-10';
const FUTURE_SUNDAY = '2099-01-11';

let db: DB;
let uid: number;

function room(name: string, capacity: number, extra: Partial<Room> = {}): number {
  return Number(
    db
      .prepare(
        `INSERT INTO rooms (name, type, capacity, computers, has_projector, status, parent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(name, extra.type ?? 'Sala de aula', capacity, extra.computers ?? 0, extra.has_projector ?? 0, extra.status ?? 'ativa', extra.parent_id ?? null)
      .lastInsertRowid,
  );
}

function book(roomId: number, start: string, end: string, status = 'aprovada', classId: number | null = null) {
  db.prepare(
    `INSERT INTO bookings (room_id, user_id, class_id, title, type, date, start_time, end_time, attendees, status)
     VALUES (?, ?, ?, 'Aula', 'aula', ?, ?, ?, 10, ?)`,
  ).run(roomId, uid, classId, FUTURE_MONDAY, start, end, status);
}

const draft = (roomId: number, start: string, end: string, attendees = 10) => ({
  room_id: roomId,
  user_id: uid,
  type: 'aula',
  date: FUTURE_MONDAY,
  start_time: start,
  end_time: end,
  attendees,
});

beforeEach(() => {
  db = openDb(':memory:');
  uid = Number(
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('P', 'p@x.com', 'x', 'professor')").run().lastInsertRowid,
  );
});

describe('horário de funcionamento', () => {
  it('aceita dentro do expediente e recusa fora', () => {
    expect(checkOperatingHours(FUTURE_MONDAY, '07:45', '22:30')).toBeNull();
    expect(checkOperatingHours(FUTURE_MONDAY, '07:00', '09:00')).toMatch(/Fora do horário/);
    expect(checkOperatingHours(FUTURE_SATURDAY, '09:00', '18:00')).toBeNull();
    expect(checkOperatingHours(FUTURE_SATURDAY, '18:00', '19:00')).toMatch(/sábados/);
    expect(checkOperatingHours(FUTURE_SUNDAY, '10:00', '11:00')).toMatch(/domingos/);
  });

  it('detecta sobreposição sem considerar horários encostados', () => {
    expect(overlaps('08:00', '10:00', '09:00', '11:00')).toBe(true);
    expect(overlaps('08:00', '10:00', '10:00', '11:00')).toBe(false);
  });
});

describe('trava anti-conflito', () => {
  it('bloqueia sobreposição na mesma sala, inclusive com solicitação pendente', () => {
    const r = room('Sala 1', 30);
    book(r, '08:00', '10:00', 'pendente');
    const v = validateBooking(db, draft(r, '09:00', '11:00'), { role: 'professor' });
    expect(v.ok).toBe(false);
    expect(v.conflicts[0].kind).toBe('sala');
    expect(validateBooking(db, draft(r, '10:00', '11:00'), { role: 'professor' }).ok).toBe(true);
  });

  it('ignora reservas recusadas ou canceladas', () => {
    const r = room('Sala 1', 30);
    book(r, '08:00', '10:00', 'recusada');
    book(r, '08:00', '10:00', 'cancelada');
    expect(validateBooking(db, draft(r, '08:00', '10:00'), { role: 'professor' }).ok).toBe(true);
  });

  it('bloqueia ambiente inteiro quando uma divisão está reservada (e vice-versa)', () => {
    const cyber = room('Cyber', 40);
    const amb1 = room('Cyber 1', 20, { parent_id: cyber });
    const amb2 = room('Cyber 2', 20, { parent_id: cyber });
    book(amb1, '08:00', '10:00');
    expect(validateBooking(db, draft(cyber, '08:00', '10:00'), { role: 'professor' }).conflicts[0].kind).toBe('ambiente_vinculado');
    expect(validateBooking(db, draft(amb2, '08:00', '10:00'), { role: 'professor' }).ok).toBe(true);
    expect(linkedRoomIds({ id: cyber, parent_id: null }, [{ id: amb1, parent_id: cyber }, { id: amb2, parent_id: cyber }])).toEqual([cyber, amb1, amb2]);
  });

  it('impede reserva duplicada da mesma turma em outra sala', () => {
    const a = room('A', 30);
    const b = room('B', 30);
    const classId = Number(
      db.prepare("INSERT INTO classes (professor_id, name, student_count) VALUES (?, 'T1', 20)").run(uid).lastInsertRowid,
    );
    book(a, '08:00', '10:00', 'aprovada', classId);
    const v = validateBooking(db, { ...draft(b, '08:00', '10:00'), class_id: classId }, { role: 'professor' });
    expect(v.conflicts.some((c) => c.kind === 'turma' && c.blocking)).toBe(true);
  });

  it('valida capacidade, manutenção e datas passadas', () => {
    const small = room('Pequena', 10);
    expect(validateBooking(db, draft(small, '08:00', '10:00', 20), { role: 'professor' }).errors[0]).toMatch(/comporta 10/);
    const m = room('Manut', 30, { status: 'manutencao' });
    expect(validateBooking(db, draft(m, '08:00', '10:00'), { role: 'professor' }).ok).toBe(false);
    expect(validateBooking(db, { ...draft(m, '08:00', '10:00'), type: 'manutencao' }, { role: 'gestao' }).ok).toBe(true);
    expect(validateBooking(db, { ...draft(small, '08:00', '10:00'), date: '2000-01-03' }, { role: 'professor' }).ok).toBe(false);
  });
});

describe('recomendação', () => {
  it('descarta salas inelegíveis com motivo', () => {
    const r = { id: 1, capacity: 20, computers: 0, has_projector: 0, has_tv: 0, accessible: 1, status: 'ativa', status_note: '' } as Room;
    const req = { attendees: 25, date: FUTURE_MONDAY, start_time: '08:00', end_time: '10:00', user_id: 1 };
    expect(hardFilter(r, req)).toMatch(/capacidade insuficiente/);
    expect(hardFilter({ ...r, capacity: 30 }, { ...req, needs_computers: true })).toMatch(/computadores/);
  });

  it('prefere a sala com melhor encaixe de capacidade e explica o motivo', () => {
    const big = room('Auditório', 120);
    room('Sala 30', 30);
    const res = recommendRooms(db, { attendees: 28, date: FUTURE_MONDAY, start_time: '08:00', end_time: '10:00', user_id: uid });
    expect(res.recommendations[0].room.name).toBe('Sala 30');
    expect(res.recommendations[0].reasons[0]).toMatch(/93% de ocupação/);
    expect(res.recommendations.find((r) => r.room.id === big)!.score).toBeLessThan(res.recommendations[0].score);
  });

  it('não recomenda salas ocupadas e preserva laboratórios para quem precisa de computadores', () => {
    const lab = room('Lab', 30, { computers: 30 });
    const sala = room('Sala', 30);
    const ctx = { utilization: 0, adjacentOwnBooking: false };
    const req = { attendees: 28, date: FUTURE_MONDAY, start_time: '08:00', end_time: '10:00', user_id: uid };
    const labRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(lab) as Room;
    const salaRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(sala) as Room;
    expect(scoreRoom(salaRoom, req, ctx).score).toBeGreaterThan(scoreRoom(labRoom, req, ctx).score);

    book(sala, '07:45', '12:00');
    const res = recommendRooms(db, req);
    expect(res.recommendations.map((r) => r.room.id)).toEqual([lab]);
    expect(res.discarded.find((d) => d.room_id === sala)?.reason).toMatch(/ocupada/);
  });
});
