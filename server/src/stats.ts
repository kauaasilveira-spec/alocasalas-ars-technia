import type { DB } from './db.js';
import { addDays, operatingMinutes, startOfWeek, toMin } from './schedule.js';

interface Row {
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
}

function approvedBetween(db: DB, from: string, to: string): Row[] {
  return db
    .prepare(
      `SELECT room_id, date, start_time, end_time, type FROM bookings
       WHERE status = 'aprovada' AND date >= ? AND date <= ?`,
    )
    .all(from, to) as Row[];
}

function availableMinutes(from: string, to: string): number {
  let total = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) total += operatingMinutes(d);
  return total;
}

/** Taxa de ocupação (0–1) de cada sala no intervalo [from, to]. */
export function roomUtilization(db: DB, from: string, to: string): Map<number, number> {
  const avail = availableMinutes(from, to) || 1;
  const used = new Map<number, number>();
  for (const b of approvedBetween(db, from, to)) {
    used.set(b.room_id, (used.get(b.room_id) ?? 0) + toMin(b.end_time) - toMin(b.start_time));
  }
  return new Map([...used].map(([id, min]) => [id, Math.min(1, min / avail)]));
}

export function usageReport(db: DB, from: string, to: string) {
  const rows = approvedBetween(db, from, to);
  const avail = availableMinutes(from, to) || 1;
  const rooms = db.prepare('SELECT id, name, type, capacity FROM rooms ORDER BY name').all() as {
    id: number;
    name: string;
    type: string;
    capacity: number;
  }[];

  const byRoom = new Map<number, { minutes: number; count: number }>();
  const byType = new Map<string, number>();
  const byHour = new Map<number, number>();
  const byWeekday = new Map<number, number>();
  for (const r of rows) {
    const minutes = toMin(r.end_time) - toMin(r.start_time);
    const e = byRoom.get(r.room_id) ?? { minutes: 0, count: 0 };
    e.minutes += minutes;
    e.count += 1;
    byRoom.set(r.room_id, e);
    byType.set(r.type, (byType.get(r.type) ?? 0) + 1);
    for (let h = Math.floor(toMin(r.start_time) / 60); h * 60 < toMin(r.end_time); h++) {
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    const wd = new Date(`${r.date}T00:00:00Z`).getUTCDay();
    byWeekday.set(wd, (byWeekday.get(wd) ?? 0) + 1);
  }

  const roomStats = rooms.map((room) => {
    const e = byRoom.get(room.id) ?? { minutes: 0, count: 0 };
    return {
      room_id: room.id,
      room_name: room.name,
      type: room.type,
      capacity: room.capacity,
      bookings: e.count,
      hours: Math.round((e.minutes / 60) * 10) / 10,
      utilization: Math.round(Math.min(1, e.minutes / avail) * 1000) / 10,
    };
  });

  const totalMinutes = [...byRoom.values()].reduce((a, b) => a + b.minutes, 0);
  return {
    from,
    to,
    total_bookings: rows.length,
    total_hours: Math.round(totalMinutes / 6) / 10,
    average_utilization:
      rooms.length > 0 ? Math.round((totalMinutes / (avail * rooms.length)) * 1000) / 10 : 0,
    rooms: roomStats.sort((a, b) => b.utilization - a.utilization),
    by_type: [...byType].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    by_hour: [...Array(16)].map((_, i) => ({ hour: i + 7, count: byHour.get(i + 7) ?? 0 })),
    by_weekday: [1, 2, 3, 4, 5, 6].map((wd) => ({ weekday: wd, count: byWeekday.get(wd) ?? 0 })),
  };
}

/** Evolução semanal de uso (horas reservadas e taxa de ocupação), geral ou de uma sala. */
export function weeklyHistory(db: DB, until: string, weeks: number, roomId?: number) {
  const out: { week_start: string; hours: number; bookings: number; utilization: number }[] = [];
  const last = startOfWeek(until);
  const roomCount = roomId
    ? 1
    : ((db.prepare('SELECT COUNT(*) AS n FROM rooms').get() as { n: number }).n || 1);
  for (let i = weeks - 1; i >= 0; i--) {
    const from = addDays(last, -7 * i);
    const to = addDays(from, 6);
    const rows = approvedBetween(db, from, to).filter((r) => roomId === undefined || r.room_id === roomId);
    const minutes = rows.reduce((a, r) => a + toMin(r.end_time) - toMin(r.start_time), 0);
    const avail = availableMinutes(from, to) * roomCount || 1;
    out.push({
      week_start: from,
      hours: Math.round(minutes / 6) / 10,
      bookings: rows.length,
      utilization: Math.round(Math.min(1, minutes / avail) * 1000) / 10,
    });
  }
  return out;
}
