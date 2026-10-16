import { config } from './config.js';

export const PERIODS = {
  manha: { label: 'Manhã', start: '07:45', end: '12:00' },
  tarde: { label: 'Tarde', start: '13:00', end: '17:30' },
  noite: { label: 'Noite', start: '18:00', end: '22:30' },
  integral: { label: 'Integral (SEDUC)', start: '08:00', end: '17:00' },
} as const;

/** Horário de funcionamento por dia da semana (0 = domingo). */
export const OPERATING_HOURS: Record<number, { start: string; end: string } | null> = {
  0: null,
  1: { start: '07:45', end: '22:30' },
  2: { start: '07:45', end: '22:30' },
  3: { start: '07:45', end: '22:30' },
  4: { start: '07:45', end: '22:30' },
  5: { start: '07:45', end: '22:30' },
  6: { start: '09:00', end: '18:00' },
};

export const BOOKING_TYPES = {
  aula: 'Aula',
  curso: 'Curso',
  evento: 'Evento',
  reuniao: 'Reunião',
  manutencao: 'Manutenção',
  tecnico: 'Uso técnico',
} as const;
export type BookingType = keyof typeof BOOKING_TYPES;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isTime = (t: string) => TIME_RE.test(t);
export const isDate = (d: string) => DATE_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(date: string): string {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
}

export function operatingMinutes(date: string): number {
  const h = OPERATING_HOURS[weekday(date)];
  return h ? toMin(h.end) - toMin(h.start) : 0;
}

export function checkOperatingHours(date: string, start: string, end: string): string | null {
  const h = OPERATING_HOURS[weekday(date)];
  if (!h) return 'A unidade não funciona aos domingos.';
  if (toMin(start) < toMin(h.start) || toMin(end) > toMin(h.end)) {
    const day = weekday(date) === 6 ? 'aos sábados' : 'de segunda a sexta';
    return `Fora do horário de funcionamento (${h.start} às ${h.end} ${day}).`;
  }
  return null;
}

export function periodOf(start: string): keyof typeof PERIODS {
  const m = toMin(start);
  if (m < toMin('12:30')) return 'manha';
  if (m < toMin('18:00')) return 'tarde';
  return 'noite';
}

/** Data e hora atuais no fuso da unidade. */
export function nowLocal(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}
