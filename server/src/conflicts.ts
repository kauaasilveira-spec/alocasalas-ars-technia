import type { DB } from './db.js';
import { getRoom, getRooms, linkedRoomIds } from './rooms.js';
import { checkOperatingHours, isDate, isTime, nowLocal, overlaps, toMin } from './schedule.js';
import type { Booking } from './types.js';

export interface BookingDraft {
  room_id: number;
  user_id: number;
  class_id?: number | null;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  attendees: number;
}

export interface ConflictItem {
  kind: 'sala' | 'ambiente_vinculado' | 'turma' | 'professor';
  blocking: boolean;
  message: string;
  booking: Pick<Booking, 'id' | 'title' | 'date' | 'start_time' | 'end_time' | 'status' | 'room_id'> & {
    room_name: string;
    user_name: string;
  };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ConflictItem[];
}

type BookingRow = Booking & { room_name: string; user_name: string };

const ACTIVE = "('pendente','aprovada')";

export function findConflicts(db: DB, draft: BookingDraft, excludeId?: number): ConflictItem[] {
  const room = getRoom(db, draft.room_id);
  if (!room) return [];
  const linked = linkedRoomIds(room, getRooms(db));
  const sameDay = db
    .prepare(
      `SELECT b.*, r.name AS room_name, u.name AS user_name
       FROM bookings b JOIN rooms r ON r.id = b.room_id JOIN users u ON u.id = b.user_id
       WHERE b.date = ? AND b.status IN ${ACTIVE} AND b.id != ?`,
    )
    .all(draft.date, excludeId ?? -1) as BookingRow[];

  const out: ConflictItem[] = [];
  for (const b of sameDay) {
    if (!overlaps(draft.start_time, draft.end_time, b.start_time, b.end_time)) continue;
    const summary = {
      id: b.id,
      title: b.title,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      room_id: b.room_id,
      room_name: b.room_name,
      user_name: b.user_name,
    };
    const when = `${b.start_time}–${b.end_time}`;
    const state = b.status === 'pendente' ? ' (aguardando aprovação)' : '';
    if (b.room_id === draft.room_id) {
      out.push({
        kind: 'sala',
        blocking: true,
        message: `${b.room_name} já está reservada das ${when} para "${b.title}"${state}.`,
        booking: summary,
      });
    } else if (linked.includes(b.room_id)) {
      out.push({
        kind: 'ambiente_vinculado',
        blocking: true,
        message: `${b.room_name} compartilha o mesmo espaço físico e está reservada das ${when}${state}.`,
        booking: summary,
      });
    } else if (draft.class_id && b.class_id === draft.class_id) {
      out.push({
        kind: 'turma',
        blocking: true,
        message: `Reserva duplicada: esta turma já tem "${b.title}" em ${b.room_name} das ${when}${state}.`,
        booking: summary,
      });
    } else if (b.user_id === draft.user_id) {
      out.push({
        kind: 'professor',
        blocking: false,
        message: `Você já tem "${b.title}" em ${b.room_name} das ${when}${state}.`,
        booking: summary,
      });
    }
  }
  return out;
}

export function validateBooking(
  db: DB,
  draft: BookingDraft,
  opts: { role: 'professor' | 'gestao'; excludeId?: number; skipPastCheck?: boolean },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isDate(draft.date)) errors.push('Data inválida.');
  if (!isTime(draft.start_time) || !isTime(draft.end_time)) errors.push('Horário inválido.');
  if (errors.length) return { ok: false, errors, warnings, conflicts: [] };

  if (toMin(draft.end_time) <= toMin(draft.start_time)) errors.push('O horário de término deve ser após o início.');
  const hours = checkOperatingHours(draft.date, draft.start_time, draft.end_time);
  if (hours) errors.push(hours);

  if (!opts.skipPastCheck) {
    const now = nowLocal();
    if (draft.date < now.date || (draft.date === now.date && draft.end_time <= now.time)) {
      errors.push('Não é possível reservar um horário que já passou.');
    }
  }

  const room = getRoom(db, draft.room_id);
  if (!room) {
    errors.push('Sala não encontrada.');
    return { ok: false, errors, warnings, conflicts: [] };
  }
  const isMaintenanceBooking = draft.type === 'manutencao' || draft.type === 'tecnico';
  if (room.status === 'inativa') errors.push(`${room.name} está desativada.`);
  if (room.status === 'manutencao' && !(isMaintenanceBooking && opts.role === 'gestao')) {
    errors.push(`${room.name} está em manutenção${room.status_note ? `: ${room.status_note}` : '.'}`);
  }
  if (draft.attendees > room.capacity) {
    errors.push(`${room.name} comporta ${room.capacity} pessoas, mas a reserva é para ${draft.attendees}.`);
  } else if (draft.attendees < room.capacity * 0.3 && room.capacity > 20) {
    warnings.push(`Baixo aproveitamento: ${draft.attendees} pessoas em uma sala para ${room.capacity}.`);
  }

  const conflicts = findConflicts(db, draft, opts.excludeId);
  for (const c of conflicts) if (!c.blocking) warnings.push(c.message);

  return { ok: errors.length === 0 && !conflicts.some((c) => c.blocking), errors, warnings, conflicts };
}
