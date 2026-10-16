import type { DB } from './db.js';
import { findConflicts } from './conflicts.js';
import { getRooms } from './rooms.js';
import { roomUtilization } from './stats.js';
import { addDays, startOfWeek } from './schedule.js';
import type { Room } from './types.js';

export interface RecommendRequest {
  attendees: number;
  date: string;
  start_time: string;
  end_time: string;
  user_id: number;
  class_id?: number | null;
  needs_computers?: boolean;
  needs_projector?: boolean;
  needs_accessibility?: boolean;
  preferred_type?: string;
}

export interface ScoreBreakdown {
  capacidade: number;
  recursos: number;
  equilibrio: number;
  continuidade: number;
  conforto: number;
}

export interface Recommendation {
  room: Room;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
}

export interface Discarded {
  room_id: number;
  room_name: string;
  reason: string;
}

export interface RecommendResult {
  recommendations: Recommendation[];
  discarded: Discarded[];
}

/** Pesos dos critérios (somam 100). */
export const WEIGHTS: ScoreBreakdown = {
  capacidade: 45,
  recursos: 25,
  equilibrio: 15,
  continuidade: 10,
  conforto: 5,
};

export interface ScoreContext {
  /** Taxa de ocupação da sala na semana (0–1). */
  utilization: number;
  /** Existe reserva do mesmo solicitante na sala, imediatamente antes ou depois. */
  adjacentOwnBooking: boolean;
}

/** Hard constraints: retorna o motivo de descarte ou null se a sala é elegível. */
export function hardFilter(room: Room, req: RecommendRequest): string | null {
  if (room.status === 'manutencao') return `em manutenção${room.status_note ? ` (${room.status_note})` : ''}`;
  if (room.status === 'inativa') return 'desativada';
  if (room.capacity < req.attendees) return `capacidade insuficiente (${room.capacity} lugares para ${req.attendees})`;
  if (req.needs_computers && room.computers < req.attendees) {
    return room.computers === 0
      ? 'não possui computadores'
      : `computadores insuficientes (${room.computers} para ${req.attendees} alunos)`;
  }
  if (req.needs_projector && !room.has_projector && !room.has_tv) return 'sem projetor ou TV';
  if (req.needs_accessibility && !room.accessible) return 'sem acessibilidade';
  return null;
}

export function scoreRoom(room: Room, req: RecommendRequest, ctx: ScoreContext): Recommendation {
  const reasons: string[] = [];
  const ratio = req.attendees / room.capacity;

  // Melhor encaixe a partir de 85% de ocupação; salas grandes demais perdem pontos proporcionalmente.
  const capacidade = WEIGHTS.capacidade * Math.min(1, ratio / 0.85);
  if (ratio >= 0.85) {
    reasons.push(`Comporta ${req.attendees} pessoas com ${Math.round(ratio * 100)}% de ocupação (${room.capacity} lugares), sem desperdício de espaço.`);
  } else {
    reasons.push(`Comporta o grupo com ${Math.round(ratio * 100)}% de ocupação (${room.capacity} lugares); uma sala menor aproveitaria melhor o espaço.`);
  }

  let recursos = WEIGHTS.recursos * 0.8;
  if (req.needs_computers) {
    recursos = WEIGHTS.recursos;
    reasons.push(`Possui ${room.computers} computadores para ${req.attendees} alunos.`);
  } else if (room.computers > 0) {
    recursos = WEIGHTS.recursos * 0.4;
    reasons.push('Laboratório com computadores: preferível deixá-lo livre para turmas que precisam de máquinas.');
  }
  if (req.preferred_type && room.type === req.preferred_type) {
    recursos = Math.min(WEIGHTS.recursos, recursos + WEIGHTS.recursos * 0.2);
    reasons.push(`É do tipo solicitado (${room.type}).`);
  }
  if (req.needs_projector) reasons.push(room.has_projector ? 'Tem projetor.' : 'Tem TV para apresentação.');

  const equilibrio = WEIGHTS.equilibrio * (1 - Math.min(1, ctx.utilization));
  if (ctx.utilization < 0.3) reasons.push(`Pouco utilizada nesta semana (${Math.round(ctx.utilization * 100)}%), ajuda a equilibrar o uso dos espaços.`);
  else if (ctx.utilization > 0.7) reasons.push(`Já está bastante utilizada nesta semana (${Math.round(ctx.utilization * 100)}%).`);

  const continuidade = ctx.adjacentOwnBooking ? WEIGHTS.continuidade : 0;
  if (ctx.adjacentOwnBooking) reasons.push('Você já tem reserva nesta sala no horário imediatamente anterior/posterior, evitando deslocamentos.');

  const conforto = (room.has_ac ? 3 : 0) + (room.accessible ? 2 : 0);
  if (!room.has_ac) reasons.push('Atenção: sala sem ar-condicionado.');

  const breakdown = { capacidade, recursos, equilibrio, continuidade, conforto };
  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  return {
    room,
    score,
    breakdown: Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [k, Math.round(v)])) as unknown as ScoreBreakdown,
    reasons,
  };
}

export function recommendRooms(db: DB, req: RecommendRequest, limit = 5): RecommendResult {
  const rooms = getRooms(db);
  const weekStart = startOfWeek(req.date);
  const utilization = roomUtilization(db, weekStart, addDays(weekStart, 5));

  const adjacent = db
    .prepare(
      `SELECT DISTINCT room_id FROM bookings
       WHERE user_id = ? AND date = ? AND status IN ('pendente','aprovada') AND (end_time = ? OR start_time = ?)`,
    )
    .all(req.user_id, req.date, req.start_time, req.end_time) as { room_id: number }[];
  const adjacentIds = new Set(adjacent.map((a) => a.room_id));

  const recommendations: Recommendation[] = [];
  const discarded: Discarded[] = [];
  for (const room of rooms) {
    const reason = hardFilter(room, req);
    if (reason) {
      discarded.push({ room_id: room.id, room_name: room.name, reason });
      continue;
    }
    const conflicts = findConflicts(db, { ...req, room_id: room.id, type: 'aula' }).filter((c) => c.blocking);
    if (conflicts.length) {
      const c = conflicts[0];
      discarded.push({
        room_id: room.id,
        room_name: room.name,
        reason:
          c.kind === 'turma'
            ? 'a turma já tem reserva neste horário'
            : `ocupada das ${c.booking.start_time} às ${c.booking.end_time}${c.kind === 'ambiente_vinculado' ? ` (${c.booking.room_name})` : ''}`,
      });
      continue;
    }
    recommendations.push(
      scoreRoom(room, req, {
        utilization: utilization.get(room.id) ?? 0,
        adjacentOwnBooking: adjacentIds.has(room.id),
      }),
    );
  }
  recommendations.sort((a, b) => b.score - a.score || a.room.capacity - b.room.capacity);
  return { recommendations: recommendations.slice(0, limit), discarded };
}
