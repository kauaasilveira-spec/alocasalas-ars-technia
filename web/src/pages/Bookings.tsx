import { CalendarPlus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookingPill, Empty, ErrorBox, Loading, PageHeader, useToast } from '../components/ui';
import { api, qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import { addDays, fmtDate, fmtDateLong, toMin } from '../lib/format';
import type { Booking, BookingStatus, Room } from '../lib/types';
import { useFetch } from '../lib/useFetch';

export function Bookings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'lista' | 'mapa'>('lista');
  return (
    <div>
      <PageHeader
        title="Reservas"
        subtitle={user?.role === 'gestao' ? 'Todas as reservas da unidade e o mapa de ocupação diário.' : 'Suas reservas e solicitações, e o mapa de ocupação das salas.'}
        action={
          <Link to="/agendar" className="btn-primary">
            <CalendarPlus className="size-4" /> Nova reserva
          </Link>
        }
      />
      <div className="mb-4 inline-flex rounded-xl bg-peach/60 p-1">
        {(['lista', 'mapa'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>
            {t === 'lista' ? 'Lista' : 'Mapa de ocupação'}
          </button>
        ))}
      </div>
      {tab === 'lista' ? <BookingList /> : <OccupancyMap />}
    </div>
  );
}

function BookingList() {
  const { user, meta } = useAuth();
  const toast = useToast();
  const today = meta?.now.date ?? '';
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [when, setWhen] = useState<'futuras' | 'passadas'>('futuras');
  const path = `/bookings${qs({
    status,
    ...(when === 'futuras' ? { from: today } : { to: addDays(today, -1), order: 'desc' }),
  })}`;
  const { data, error, loading, reload } = useFetch<Booking[]>(today ? path : null);

  const cancel = async (b: Booking) => {
    if (!confirm(`Cancelar "${b.title}" em ${fmtDate(b.date)}?`)) return;
    try {
      await api(`/bookings/${b.id}/cancel`, { body: {} });
      toast('Reserva cancelada.');
      reload();
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['futuras', 'passadas'] as const).map((w) => (
          <button key={w} onClick={() => setWhen(w)} className={`chip ${when === w ? 'chip-active' : ''}`}>
            {w === 'futuras' ? 'Próximas' : 'Histórico'}
          </button>
        ))}
        <span className="mx-1 w-px bg-peach" />
        {(['', 'aprovada', 'pendente', 'recusada', 'cancelada'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {s === '' ? 'Todos' : s[0].toUpperCase() + s.slice(1) + 's'}
          </button>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Empty title="Nenhuma reserva encontrada" text="Ajuste os filtros ou crie uma nova reserva." />
      ) : (
        <div className="card divide-y divide-peach overflow-hidden">
          {data?.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="w-20 shrink-0 text-center">
                <p className="text-xs font-bold text-primary">{fmtDate(b.date, { weekday: true })}</p>
                <p className="text-[11px] text-muted">
                  {b.start_time}–{b.end_time}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/salas/${b.room_id}`} className="text-sm font-bold text-primary hover:underline">
                  {b.room_name}
                </Link>
                <p className="truncate text-xs text-muted">
                  {b.title} · {b.attendees} pessoas{user?.role === 'gestao' ? ` · ${b.user_name}` : ''}
                  {b.series_id ? ' · recorrente' : ''}
                </p>
                {b.review_note && <p className="text-[11px] text-red-700">Obs.: {b.review_note}</p>}
              </div>
              <BookingPill status={b.status} />
              {(b.status === 'pendente' || b.status === 'aprovada') && b.date >= (meta?.now.date ?? '') && (user?.role === 'gestao' || b.user_id === user?.id) && (
                <button onClick={() => cancel(b)} className="btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50" title="Cancelar">
                  <X className="size-4" /> Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Occupancy {
  date: string;
  hours: { start: string; end: string } | null;
  rooms: Room[];
  bookings: Booking[];
  conflicts: { a: number; b: number }[];
}

function OccupancyMap() {
  const { meta } = useAuth();
  const [date, setDate] = useState(meta?.now.date ?? new Date().toISOString().slice(0, 10));
  const { data, loading } = useFetch<Occupancy>(`/occupancy?date=${date}`);
  const startH = 7;
  const endH = 23;
  const span = (endH - startH) * 60;
  const pct = (t: string) => ((toMin(t) - startH * 60) / span) * 100;
  const conflictIds = new Set(data?.conflicts.flatMap((c) => [c.a, c.b]));

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-2 py-1" onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior">
            <ChevronLeft className="size-4" />
          </button>
          <input type="date" className="input w-auto py-1.5" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button className="btn-ghost px-2 py-1" onClick={() => setDate(addDays(date, 1))} aria-label="Próximo dia">
            <ChevronRight className="size-4" />
          </button>
          <span className="ml-2 hidden text-sm font-semibold text-primary sm:inline">{fmtDateLong(date)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-primary" /> Aprovada</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded border border-dashed border-amber-500 bg-amber-100" /> Pendente</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-red-500" /> Conflito</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-mist/40" /> Fora do expediente</span>
        </div>
      </div>
      {!data || loading ? (
        <Loading />
      ) : !data.hours ? (
        <Empty title="Unidade fechada neste dia" text="Não há funcionamento aos domingos." />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="relative ml-44 h-5 text-[10px] text-muted">
              {[...Array(endH - startH + 1)].map((_, i) => (
                <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(i / (endH - startH)) * 100}%` }}>
                  {String(startH + i).padStart(2, '0')}h
                </span>
              ))}
            </div>
            {data.rooms.map((room) => {
              const items = data.bookings.filter((b) => b.room_id === room.id);
              return (
                <div key={room.id} className="flex items-center border-t border-peach/70 py-1">
                  <Link to={`/salas/${room.id}`} className="w-44 shrink-0 truncate pr-2 text-xs font-semibold text-primary hover:underline" title={room.name}>
                    {room.name}
                    <span className="block text-[10px] font-normal text-muted">{room.capacity} lugares</span>
                  </Link>
                  <div className="relative h-9 flex-1 rounded-lg bg-white">
                    <div className="absolute inset-y-0 left-0 rounded-l-lg bg-mist/40" style={{ width: `${pct(data.hours!.start)}%` }} />
                    <div className="absolute inset-y-0 right-0 rounded-r-lg bg-mist/40" style={{ left: `${pct(data.hours!.end)}%` }} />
                    {room.status === 'manutencao' && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-orange-100/80 text-[10px] font-semibold text-orange-800">Em manutenção</div>
                    )}
                    {items.map((b) => (
                      <div
                        key={b.id}
                        title={`${b.title} · ${b.user_name} · ${b.start_time}–${b.end_time} (${b.status})`}
                        className={`absolute inset-y-1 overflow-hidden rounded-md px-1.5 text-[10px] leading-tight ${
                          conflictIds.has(b.id)
                            ? 'bg-red-500 text-white'
                            : b.status === 'pendente'
                              ? 'border border-dashed border-amber-500 bg-amber-100 text-amber-900'
                              : 'bg-primary text-white'
                        }`}
                        style={{ left: `${pct(b.start_time)}%`, width: `${pct(b.end_time) - pct(b.start_time)}%` }}
                      >
                        <p className="truncate pt-0.5 font-semibold">{b.title}</p>
                        <p className="truncate opacity-80">{b.start_time}–{b.end_time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
