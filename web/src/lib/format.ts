import type { BookingStatus, LiveStatus } from './types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function parseDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function fmtDate(d: string, opts: { weekday?: boolean } = {}) {
  const dt = parseDate(d);
  const base = `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
  return opts.weekday ? `${WEEKDAYS[dt.getUTCDay()]}, ${base}` : base;
}

export function fmtDateLong(d: string) {
  const dt = parseDate(d);
  return `${WEEKDAYS[dt.getUTCDay()]}, ${dt.getUTCDate()} de ${MONTHS[dt.getUTCMonth()]}`;
}

export function fmtDateTime(iso: string) {
  const dt = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : `${iso.replace(' ', 'T')}Z`);
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function addDays(d: string, n: number) {
  const dt = parseDate(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function startOfWeek(d: string) {
  const wd = parseDate(d).getUTCDay();
  return addDays(d, wd === 0 ? -6 : 1 - wd);
}

export const weekdayShort = (wd: number) => WEEKDAYS[wd];

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const LIVE_STATUS: Record<LiveStatus, { label: string; cls: string }> = {
  aberta: { label: 'Aberta', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  reservada: { label: 'Reservada', cls: 'bg-primary text-white border-primary' },
  fechada: { label: 'Fechada', cls: 'bg-mist/40 text-ink border-mist' },
  manutencao: { label: 'Em manutenção', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovada: { label: 'Aprovada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  recusada: { label: 'Recusada', cls: 'bg-red-100 text-red-700 border-red-200' },
  cancelada: { label: 'Cancelada', cls: 'bg-mist/30 text-muted border-mist' },
};

export const ROOM_STATUS_LABEL = { ativa: 'Ativa', manutencao: 'Em manutenção', inativa: 'Desativada' } as const;

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
