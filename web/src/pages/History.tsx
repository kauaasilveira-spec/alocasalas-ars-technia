import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorBox, Loading, PageHeader, StatCard } from '../components/ui';
import { qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import { addDays, fmtDate, fmtDateTime, weekdayShort } from '../lib/format';
import type { HistoryPoint } from '../lib/types';
import { useFetch } from '../lib/useFetch';

interface Usage {
  total_bookings: number;
  total_hours: number;
  average_utilization: number;
  rooms: { room_id: number; room_name: string; type: string; capacity: number; bookings: number; hours: number; utilization: number }[];
  by_type: { type: string; count: number }[];
  by_hour: { hour: number; count: number }[];
  by_weekday: { weekday: number; count: number }[];
}

interface Audit {
  id: number;
  user_name: string | null;
  action: string;
  entity: string;
  details: string;
  created_at: string;
}

const COLORS = ['#3e4bcc', '#357dbf', '#a6bcc9', '#f7dcba', '#e8a87c', '#6b6f8f'];
const ACTION_LABEL: Record<string, string> = {
  aprovar: 'Aprovou',
  recusar: 'Recusou',
  cancelar: 'Cancelou',
  solicitacao: 'Solicitou',
  reserva_direta: 'Reservou',
  criar: 'Cadastrou',
  editar: 'Editou',
  excluir: 'Excluiu',
  status_sala: 'Alterou status',
  cadastro: 'Criou conta',
};

export function History() {
  const { meta } = useAuth();
  const today = meta?.now.date ?? new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState(30);
  const [roomId, setRoomId] = useState('');
  const { data: usage, error } = useFetch<Usage>(`/stats/usage${qs({ from: addDays(today, -(range - 1)), to: today })}`);
  const { data: history } = useFetch<HistoryPoint[]>(`/stats/history${qs({ weeks: 12, room_id: roomId })}`);
  const { data: audit } = useFetch<Audit[]>('/audit?limit=40');

  if (error) return <ErrorBox message={error} />;
  if (!usage) return <Loading />;

  const idle = usage.rooms.filter((r) => r.utilization < 10);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Histórico e ocupação"
        subtitle="Quanto cada sala está sendo utilizada, a evolução ao longo das semanas e o registro de alterações."
        action={
          <div className="inline-flex rounded-xl bg-peach/60 p-1">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setRange(d)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${range === d ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>
                {d} dias
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Reservas aprovadas" value={usage.total_bookings} tone="primary" />
        <StatCard label="Horas utilizadas" value={usage.total_hours} />
        <StatCard label="Ocupação média" value={`${usage.average_utilization}%`} />
        <StatCard label="Salas subutilizadas (<10%)" value={idle.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-primary">Crescimento histórico</h2>
              <p className="text-xs text-muted">Horas reservadas por semana (12 semanas)</p>
            </div>
            <select className="input w-auto py-1.5 text-xs" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">Todas as salas</option>
              {usage.rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history ?? []} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f7dcba" />
                <XAxis dataKey="week_start" tickFormatter={(d: string) => fmtDate(d)} fontSize={11} />
                <YAxis yAxisId="h" fontSize={11} />
                <YAxis yAxisId="u" orientation="right" fontSize={11} unit="%" />
                <Tooltip labelFormatter={(d) => `Semana de ${fmtDate(String(d))}`} />
                <Line yAxisId="h" type="monotone" dataKey="hours" name="Horas" stroke="#3e4bcc" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="u" type="monotone" dataKey="utilization" name="Ocupação (%)" stroke="#357dbf" strokeDasharray="5 4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="font-bold text-primary">Tipos de agendamento</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={usage.by_type.map((t) => ({ ...t, name: meta?.booking_types[t.type] ?? t.type }))} dataKey="count" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {usage.by_type.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {usage.by_type.map((t, i) => (
              <span key={t.type} className="flex items-center gap-1">
                <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {meta?.booking_types[t.type] ?? t.type} ({t.count})
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="font-bold text-primary">Ocupação por sala</h2>
        <p className="mb-3 text-xs text-muted">Percentual do horário de funcionamento com reservas aprovadas nos últimos {range} dias</p>
        <div className="space-y-2">
          {usage.rooms.map((r) => (
            <div key={r.room_id} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-xs">
              <span className="truncate font-semibold text-ink" title={r.room_name}>{r.room_name}</span>
              <div className="h-3 overflow-hidden rounded-full bg-peach/60">
                <div
                  className={`h-full rounded-full ${r.utilization >= 60 ? 'bg-primary' : r.utilization >= 25 ? 'bg-secondary' : 'bg-mist'}`}
                  style={{ width: `${Math.max(r.utilization, 1)}%` }}
                />
              </div>
              <span className="w-28 text-right text-muted">
                <b className="text-ink">{r.utilization}%</b> · {r.hours} h · {r.bookings}x
              </span>
            </div>
          ))}
        </div>
        {idle.length > 0 && (
          <p className="mt-3 rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary">
            Oportunidade: {idle.map((r) => r.room_name).join(', ')} estão com menos de 10% de uso. O motor de recomendação favorece salas pouco usadas para equilibrar a ocupação.
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-bold text-primary">Horários de pico</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usage.by_hour} margin={{ left: -20, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f7dcba" vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`} fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip labelFormatter={(h) => `${h}h`} formatter={(v) => [v, 'Reservas ativas']} />
                <Bar dataKey="count" fill="#357dbf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="font-bold text-primary">Uso por dia da semana</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usage.by_weekday.map((w) => ({ ...w, label: weekdayShort(w.weekday) }))} margin={{ left: -20, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f7dcba" vertical={false} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => [v, 'Reservas']} />
                <Bar dataKey="count" fill="#3e4bcc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-primary">Registro de alterações</h2>
        <ul className="divide-y divide-peach text-xs">
          {audit?.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 py-2">
              <span className="w-24 shrink-0 text-muted">{fmtDateTime(a.created_at)}</span>
              <b className="text-primary">{a.user_name ?? 'Sistema'}</b>
              <span className="rounded bg-peach/70 px-1.5 py-0.5 text-[10px] font-semibold">{ACTION_LABEL[a.action] ?? a.action}</span>
              <span className="text-ink/80">{a.details}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
