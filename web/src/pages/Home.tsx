import { AlertTriangle, Bell, CalendarPlus, Search, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RoomCard } from '../components/RoomCard';
import { BookingPill, ErrorBox, Loading, StatCard } from '../components/ui';
import { useAuth } from '../lib/auth';
import { fmtDate, fmtDateLong, fmtDateTime } from '../lib/format';
import type { Booking, LiveStatus, Room } from '../lib/types';
import { useFetch } from '../lib/useFetch';

interface Dashboard {
  now: { date: string; time: string };
  summary: Record<'abertas' | 'reservadas' | 'fechadas' | 'manutencao', number>;
  week: { aprovadas: number | null; pendentes: number | null; total: number };
  week_utilization: number;
  pending_requests: number;
  maintenance_notices: { room_id: number; room_name: string; status: string; note: string; updated_at: string }[];
  rooms: Room[];
  upcoming: Booking[];
}

const FILTERS: { key: 'todas' | LiveStatus; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'aberta', label: 'Abertas' },
  { key: 'reservada', label: 'Reservadas' },
  { key: 'fechada', label: 'Fechadas' },
  { key: 'manutencao', label: 'Em manutenção' },
];

export function Home() {
  const { user } = useAuth();
  const { data, error, loading } = useFetch<Dashboard>('/dashboard');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('todas');
  const gestao = user?.role === 'gestao';

  const rooms = useMemo(
    () => (data?.rooms ?? []).filter((r) => filter === 'todas' || r.live_status === filter),
    [data, filter],
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Olá, {user?.name.split(' ')[0]}</p>
          <h1 className="page-title">Minhas salas</h1>
          <p className="text-xs text-muted">
            {fmtDateLong(data.now.date)} · {data.now.time}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/salas" className="btn-outline">
            <Search className="size-4" /> Buscar salas
          </Link>
          <Link to="/agendar" className="btn-primary">
            <CalendarPlus className="size-4" /> Nova reserva
          </Link>
        </div>
      </div>

      {data.maintenance_notices.length > 0 && (
        <div className="space-y-2">
          {data.maintenance_notices.map((n) => (
            <Link
              key={n.room_id}
              to={`/salas/${n.room_id}`}
              className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 hover:bg-orange-100"
            >
              <Wrench className="mt-0.5 size-4 shrink-0" />
              <div>
                <span className="font-semibold">Aviso: {n.room_name}</span> {n.status === 'manutencao' ? 'está em manutenção.' : ''} {n.note}
                <span className="block text-[11px] text-orange-700">Atualizado em {fmtDateTime(n.updated_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card-peach p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-primary">Situação agora</h2>
              <p className="text-xs text-muted">Acompanhe as salas abertas, reservadas, fechadas e em manutenção.</p>
            </div>
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-white">Hoje</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Abertas" value={data.summary.abertas} tone="white" />
            <StatCard label="Reservadas" value={data.summary.reservadas} tone="primary" />
            <StatCard label="Fechadas" value={data.summary.fechadas} tone="white" />
            <StatCard label="Manutenção" value={data.summary.manutencao} tone="white" />
          </div>
        </section>
        <section className="card p-4">
          <h2 className="font-bold text-primary">Resumo da semana</h2>
          <p className="text-xs text-muted">{gestao ? 'Todas as reservas da unidade' : 'Suas reservas'}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatCard label="Aprovadas" value={data.week.aprovadas ?? 0} />
            <StatCard label="Pendentes" value={data.week.pendentes ?? 0} />
          </div>
          {gestao ? (
            <Link to="/solicitacoes" className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
              <span className="flex items-center gap-2">
                <Bell className="size-4" /> {data.pending_requests} solicitação(ões) aguardando
              </span>
              <span>→</span>
            </Link>
          ) : (
            <p className="mt-3 text-xs text-muted">Ocupação média das salas nesta semana: <b className="text-primary">{data.week_utilization}%</b></p>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-primary">{gestao ? 'Próximas reservas da unidade' : 'Minhas próximas reservas'}</h2>
          <Link to="/reservas" className="text-xs font-semibold text-secondary hover:underline">
            Ver todas
          </Link>
        </div>
        {data.upcoming.length === 0 ? (
          <div className="card flex items-center gap-3 p-4 text-sm text-muted">
            <AlertTriangle className="size-4 text-mist" /> Nenhuma reserva futura.{' '}
            <Link to="/agendar" className="font-semibold text-primary hover:underline">
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming.map((b) => (
              <Link key={b.id} to={`/salas/${b.room_id}`} className="card p-3.5 hover:border-secondary/50">
                <div className="flex items-center justify-between">
                  <BookingPill status={b.status} />
                  <span className="text-[11px] font-semibold text-muted">
                    {fmtDate(b.date, { weekday: true })} · {b.start_time}–{b.end_time}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-primary">{b.room_name}</h3>
                <p className="text-[11px] text-muted">
                  {b.title} · {gestao ? b.user_name : `${b.attendees} pessoas`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-primary">Salas</h2>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`chip ${filter === f.key ? 'chip-active' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
        {rooms.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhuma sala nesta situação agora.</p>}
      </section>
    </div>
  );
}
