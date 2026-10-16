import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RoomCard } from '../components/RoomCard';
import { Check, ErrorBox, Field, Loading, PageHeader } from '../components/ui';
import { qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Room } from '../lib/types';
import { useFetch } from '../lib/useFetch';

export function Rooms() {
  const { user, meta } = useAuth();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [f, setF] = useState({
    min_capacity: '',
    type: '',
    size: '',
    accessible: false,
    has_ac: false,
    has_projector: false,
    computers: false,
    date: '',
    start_time: '',
    end_time: '',
    only_available: false,
  });
  const slot = Boolean(f.date && f.start_time && f.end_time);
  const { data, error, loading } = useFetch<Room[]>(`/rooms${qs({ q, ...f, only_available: slot && f.only_available })}`);
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      <PageHeader
        title="Salas"
        subtitle="Pesquise por nome, tipo, recursos, capacidade ou disponibilidade em um horário."
        action={
          user?.role === 'gestao' && (
            <Link to="/salas/nova" className="btn-primary">
              <Plus className="size-4" /> Cadastrar sala
            </Link>
          )
        }
      />
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Buscar por salas, laboratórios, recursos..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className={`btn-outline ${showFilters ? 'bg-primary/5' : ''}`}>
          <SlidersHorizontal className="size-4" /> <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {showFilters && (
        <div className="card mb-4 space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Mínimo de assentos">
              <input className="input" type="number" min={1} placeholder="Ex.: 30" value={f.min_capacity} onChange={(e) => set({ min_capacity: e.target.value })} />
            </Field>
            <Field label="Porte">
              <select className="input" value={f.size} onChange={(e) => set({ size: e.target.value })}>
                <option value="">Todos</option>
                {Object.entries(meta?.size_labels ?? {}).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de ambiente">
              <select className="input" value={f.type} onChange={(e) => set({ type: e.target.value })}>
                <option value="">Todos</option>
                {meta?.room_types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Check label="Com computadores" checked={f.computers} onChange={(v) => set({ computers: v })} />
            <Check label="Com projetor" checked={f.has_projector} onChange={(v) => set({ has_projector: v })} />
            <Check label="Ar-condicionado" checked={f.has_ac} onChange={(v) => set({ has_ac: v })} />
            <Check label="Acessível" checked={f.accessible} onChange={(v) => set({ accessible: v })} />
          </div>
          <div>
            <p className="label">Disponibilidade em um horário</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <input className="input" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} aria-label="Data" />
              <input className="input" type="time" value={f.start_time} onChange={(e) => set({ start_time: e.target.value })} aria-label="Início" />
              <input className="input" type="time" value={f.end_time} onChange={(e) => set({ end_time: e.target.value })} aria-label="Fim" />
              <Check label="Só livres" checked={f.only_available} onChange={(v) => set({ only_available: v })} />
            </div>
            {meta && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(meta.periods).map(([k, p]) => (
                  <button key={k} type="button" className="chip" onClick={() => set({ start_time: p.start, end_time: p.end, date: f.date || meta.now.date })}>
                    {p.label} ({p.start}–{p.end})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <ErrorBox message={error} />}
      {loading && !data ? (
        <Loading />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-muted">{data?.length ?? 0} encontrada(s)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((r) => (
              <RoomCard key={r.id} room={r} showAvailability={slot} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
