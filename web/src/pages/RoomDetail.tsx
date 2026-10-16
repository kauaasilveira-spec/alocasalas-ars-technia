import { CalendarPlus, ChevronLeft, ChevronRight, ImageOff, Megaphone, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookingPill, ErrorBox, Loading, PageHeader, RoomFeatures, StatCard, StatusPill } from '../components/ui';
import { qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import { addDays, fmtDate, fmtDateTime, ROOM_STATUS_LABEL, startOfWeek } from '../lib/format';
import type { Booking, HistoryPoint, Room } from '../lib/types';
import { useFetch } from '../lib/useFetch';

type Detail = Room & {
  parent: Room | null;
  children: Room[];
  schedule: Booking[];
  history: HistoryPoint[];
  utilization_30d: number;
  total_bookings: number;
};

export function RoomDetail() {
  const { id } = useParams();
  const { user, meta } = useAuth();
  const today = meta?.now.date ?? new Date().toISOString().slice(0, 10);
  const [week, setWeek] = useState(() => startOfWeek(today));
  const { data: room, error, loading } = useFetch<Detail>(`/rooms/${id}${qs({ from: week, to: addDays(week, 6) })}`);

  if (loading && !room) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!room) return null;

  const days = [...Array(6)].map((_, i) => addDays(week, i));
  const gestao = user?.role === 'gestao';

  return (
    <div>
      <PageHeader
        back
        title="Detalhes do local"
        action={
          <div className="flex gap-2">
            {gestao && (
              <Link to={`/salas/${room.id}/editar`} className="btn-outline">
                <Pencil className="size-4" /> Editar
              </Link>
            )}
            {room.status === 'ativa' && (
              <Link to={`/agendar?room_id=${room.id}`} className="btn-primary">
                <CalendarPlus className="size-4" /> Enviar solicitação
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              {room.live_status && <StatusPill status={room.live_status} />}
              <span className="rounded-full bg-peach px-2.5 py-0.5 text-[11px] font-semibold text-primary">{room.size_label}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-primary">{room.name}</h2>
            <p className="text-sm text-muted">
              {room.type} · {room.setor}
              {room.floor ? `, ${room.floor}` : ''}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-peach/70">
                {room.has_image ? (
                  <img src={`/api/rooms/${room.id}/image?v=${encodeURIComponent(room.updated_at)}`} alt={room.name} className="size-full object-cover" />
                ) : (
                  <ImageOff className="size-8 text-primary/40" />
                )}
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-ink/80">{room.description || 'Sem descrição.'}</p>
                <RoomFeatures room={room} />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-muted">Capacidade máxima</dt>
                  <dd className="font-semibold">{room.capacity} pessoas</dd>
                  <dt className="text-muted">Situação cadastral</dt>
                  <dd className="font-semibold">{ROOM_STATUS_LABEL[room.status]}</dd>
                  {room.parent && (
                    <>
                      <dt className="text-muted">Faz parte de</dt>
                      <dd className="font-semibold">
                        <Link to={`/salas/${room.parent.id}`} className="text-secondary hover:underline">{room.parent.name}</Link>
                      </dd>
                    </>
                  )}
                  {room.children.length > 0 && (
                    <>
                      <dt className="text-muted">Pode ser dividida em</dt>
                      <dd className="font-semibold">
                        {room.children.map((c, i) => (
                          <span key={c.id}>
                            {i > 0 && ', '}
                            <Link to={`/salas/${c.id}`} className="text-secondary hover:underline">{c.name}</Link>
                          </span>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-primary">Agenda da semana</h3>
              <div className="flex items-center gap-1">
                <button className="btn-ghost px-2 py-1" onClick={() => setWeek(addDays(week, -7))} aria-label="Semana anterior">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-semibold text-muted">
                  {fmtDate(week)} – {fmtDate(addDays(week, 5))}
                </span>
                <button className="btn-ghost px-2 py-1" onClick={() => setWeek(addDays(week, 7))} aria-label="Próxima semana">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            {(room.parent || room.children.length > 0) && (
              <p className="mb-2 text-[11px] text-muted">Inclui reservas dos ambientes vinculados (mesmo espaço físico).</p>
            )}
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {days.map((d) => {
                const items = room.schedule.filter((b) => b.date === d);
                return (
                  <div key={d} className={`rounded-xl border p-2 ${d === today ? 'border-secondary bg-secondary/5' : 'border-peach bg-cream/60'}`}>
                    <p className="mb-1.5 text-[11px] font-bold text-primary">{fmtDate(d, { weekday: true })}</p>
                    {items.length === 0 ? (
                      <p className="text-[11px] text-emerald-700">Livre</p>
                    ) : (
                      <div className="space-y-1.5">
                        {items.map((b) => (
                          <div key={b.id} className={`rounded-lg px-2 py-1 text-[11px] ${b.status === 'pendente' ? 'border border-dashed border-amber-400 bg-amber-50' : 'bg-primary text-white'}`}>
                            <p className="font-semibold">{b.start_time}–{b.end_time}</p>
                            <p className="truncate opacity-90">{b.title}</p>
                            {b.room_id !== room.id && <p className="truncate opacity-75">{b.room_name}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-secondary p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Megaphone className="size-4" /> Comunicação
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Atualizado {fmtDateTime(room.updated_at)}</span>
            </div>
            <p className="mt-2 text-sm text-white/90">
              {room.status === 'manutencao'
                ? `Sala em manutenção. ${room.status_note}`
                : room.status_note ||
                  (room.current_booking
                    ? `Em uso agora: ${room.current_booking.title} (${room.current_booking.user_name}) até ${room.current_booking.end_time}.`
                    : room.next_booking
                      ? `Livre agora. Próxima reserva às ${room.next_booking.start_time}: ${room.next_booking.title}.`
                      : 'Sem avisos. Sala livre pelo restante do dia.')}
            </p>
          </section>

          <section className="card p-4">
            <h3 className="font-bold text-primary">Histórico de utilização</h3>
            <p className="text-xs text-muted">Horas reservadas por semana (últimas 12)</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatCard label="Ocupação (30 dias)" value={`${room.utilization_30d}%`} />
              <StatCard label="Reservas aprovadas" value={room.total_bookings} />
            </div>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={room.history} margin={{ left: -24, right: 4, top: 4 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#357dbf" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#357dbf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f7dcba" />
                  <XAxis dataKey="week_start" tickFormatter={(d: string) => fmtDate(d)} fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip labelFormatter={(d) => `Semana de ${fmtDate(String(d))}`} formatter={(v) => [`${v} h`, 'Horas']} />
                  <Area type="monotone" dataKey="hours" stroke="#3e4bcc" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {room.schedule.some((b) => b.date >= today) && (
            <section className="card p-4">
              <h3 className="mb-2 font-bold text-primary">Próximas reservas</h3>
              <ul className="space-y-2">
                {room.schedule
                  .filter((b) => b.date >= today)
                  .slice(0, 5)
                  .map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-semibold">{b.title}</p>
                        <p className="text-muted">
                          {fmtDate(b.date, { weekday: true })} · {b.start_time}–{b.end_time} · {b.user_name}
                        </p>
                      </div>
                      <BookingPill status={b.status} />
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
