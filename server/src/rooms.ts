import type { DB } from './db.js';
import type { Room } from './types.js';

export const ROOM_TYPES = [
  'Sala de aula',
  'Laboratório de informática',
  'Laboratório técnico',
  'Sala Cyber',
  'Sala de reunião',
  'Auditório',
  'Estúdio',
] as const;

export type SizeCategory = 'poucos' | 'medios' | 'muitos';

export function sizeCategory(capacity: number): SizeCategory {
  if (capacity <= 20) return 'poucos';
  if (capacity <= 35) return 'medios';
  return 'muitos';
}

export const SIZE_LABEL: Record<SizeCategory, string> = {
  poucos: 'Poucos alunos (até 20)',
  medios: 'Médio porte (21 a 35)',
  muitos: 'Muitos alunos (36+)',
};

/**
 * Ambientes que compartilham espaço físico: a própria sala, o ambiente "pai"
 * (quando a sala é uma divisão) e as divisões (quando a sala é o ambiente inteiro).
 * Reservar qualquer um deles bloqueia os demais no mesmo horário.
 */
export function linkedRoomIds(room: Pick<Room, 'id' | 'parent_id'>, all: Pick<Room, 'id' | 'parent_id'>[]): number[] {
  const ids = new Set<number>([room.id]);
  if (room.parent_id) ids.add(room.parent_id);
  for (const r of all) if (r.parent_id === room.id) ids.add(r.id);
  return [...ids];
}

export function getRooms(db: DB): Room[] {
  return db.prepare('SELECT * FROM rooms ORDER BY name').all() as Room[];
}

export function getRoom(db: DB, id: number): Room | undefined {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as Room | undefined;
}
