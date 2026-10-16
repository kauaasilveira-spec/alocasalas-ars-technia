import { CheckCircle2, Info, Monitor, Projector, Accessibility, Sparkles, Wand2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ErrorBox, Field, Loading, PageHeader, RoomFeatures, ScoreRing, useToast, WarningBox } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { RecommendResponse, Room, SchoolClass, Validation } from '../lib/types';
import { useFetch } from '../lib/useFetch';

interface CheckResult {
  ok: boolean;
  results: (Validation & { date: string })[];
}

const CRITERIA_LABEL: Record<string, string> = {
  capacidade: 'Capacidade',
  recursos: 'Recursos',
  equilibrio: 'Equilíbrio de uso',
  continuidade: 'Continuidade',
  conforto: 'Conforto',
};

export function NewBooking() {
  const { user, meta } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: rooms } = useFetch<Room[]>('/rooms');
  const { data: classes } = useFetch<SchoolClass[]>('/classes');

  const [form, setForm] = useState({
    class_id: '',
    title: '',
    type: 'aula',
    attendees: '',
    date: params.get('date') ?? '',
    start_time: params.get('start') ?? '',
    end_time: params.get('end') ?? '',
    room_id: params.get('room_id') ?? '',
    description: '',
    repeat_weeks: '1',
  });
  const [needs, setNeeds] = useState({ computers: false, projector: false, accessibility: false });
  const [rec, setRec] = useState<RecommendResponse | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nl, setNl] = useState('');
  const [nlBusy, setNlBusy] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const selectedRoom = rooms?.find((r) => String(r.id) === form.room_id);
  const compatibleRooms = useMemo(() => {
    const n = Number(form.attendees) || 0;
    return (rooms ?? []).filter(
      (r) =>
        r.status === 'ativa' &&
        r.capacity >= n &&
        (!needs.computers || r.computers >= n) &&
        (!needs.projector || r.has_projector || r.has_tv) &&
        (!needs.accessibility || r.accessible),
    );
  }, [rooms, form.attendees, needs]);
  const slotReady = Boolean(form.date && form.start_time && form.end_time && Number(form.attendees) > 0);

  const pickClass = (id: string) => {
    const c = classes?.find((x) => String(x.id) === id);
    set({ class_id: id, ...(c ? { attendees: String(c.student_count), title: form.title || `Aula ${c.name}` } : {}) });
    if (c) setNeeds({ computers: Boolean(c.needs_computers), projector: Boolean(c.needs_projector), accessibility: Boolean(c.needs_accessibility) });
  };

  // Validação em tempo real (conflitos, horário de funcionamento, capacidade)
  useEffect(() => {
    if (!slotReady || !form.room_id) {
      setCheck(null);
      return;
    }
    const t = setTimeout(() => {
      api<CheckResult>('/bookings/check', {
        body: { ...form, class_id: form.class_id || null, title: form.title || '-', attendees: Number(form.attendees) },
      })
        .then(setCheck)
        .catch(() => setCheck(null));
    }, 300);
    return () => clearTimeout(t);
  }, [form, slotReady]);

  const recommend = async () => {
    setRecLoading(true);
    setError('');
    try {
      const r = await api<RecommendResponse>('/recommend', {
        body: {
          attendees: Number(form.attendees),
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          class_id: form.class_id || null,
          needs_computers: needs.computers,
          needs_projector: needs.projector,
          needs_accessibility: needs.accessibility,
        },
      });
      setRec(r);
      if (r.recommendations[0] && !form.room_id) set({ room_id: String(r.recommendations[0].room.id) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRecLoading(false);
    }
  };

  const parseNl = async () => {
    setNlBusy(true);
    setError('');
    try {
      const p = await api<Partial<Record<string, string | number | boolean>>>('/ai/parse', { body: { text: nl } });
      set({
        ...(p.title ? { title: String(p.title) } : {}),
        ...(p.type ? { type: String(p.type) } : {}),
        ...(p.attendees ? { attendees: String(p.attendees) } : {}),
        ...(p.date ? { date: String(p.date) } : {}),
        ...(p.start_time ? { start_time: String(p.start_time) } : {}),
        ...(p.end_time ? { end_time: String(p.end_time) } : {}),
      });
      setNeeds((n) => ({
        computers: p.needs_computers === undefined ? n.computers : Boolean(p.needs_computers),
        projector: p.needs_projector === undefined ? n.projector : Boolean(p.needs_projector),
        accessibility: p.needs_accessibility === undefined ? n.accessibility : Boolean(p.needs_accessibility),
      }));
      toast('Pedido interpretado pelo Gemini. Confira os campos.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setNlBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const chosen = rec?.recommendations.find((r) => String(r.room.id) === form.room_id);
    try {
      await api('/bookings', {
        body: {
          ...form,
          class_id: form.class_id || null,
          attendees: Number(form.attendees),
          repeat_weeks: Number(form.repeat_weeks),
          recommendation: chosen ? `${chosen.score}% de compatibilidade. ${chosen.reasons.join(' ')}` : null,
        },
      });
      toast(user?.role === 'gestao' ? 'Reserva confirmada.' : 'Solicitação enviada para aprovação da gestão.');
      navigate('/reservas');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  if (!meta) return <Loading />;

  return (
    <div>
      <PageHeader back title="Cadastro de agendamento" subtitle="Informe a turma e o horário. O sistema mostra apenas salas compatíveis e bloqueia conflitos." />
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {meta.ai_enabled && (
            <section className="card p-4">
              <p className="label flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Descreva o que precisa (assistente Gemini)
              </p>
              <div className="flex gap-2">
                <input className="input" placeholder="Ex.: laboratório para 28 alunos na próxima terça à noite" value={nl} onChange={(e) => setNl(e.target.value)} />
                <button type="button" className="btn-secondary" onClick={parseNl} disabled={!nl || nlBusy}>
                  <Wand2 className="size-4" /> {nlBusy ? '...' : 'Preencher'}
                </button>
              </div>
            </section>
          )}

          <section className="card space-y-4 p-4">
            <Field label="Nome do professor">
              <input className="input" value={user?.name ?? ''} disabled />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Turma" hint={<Link to="/turmas" className="text-secondary hover:underline">Gerenciar minhas turmas</Link>}>
                <select className="input" value={form.class_id} onChange={(e) => pickClass(e.target.value)}>
                  <option value="">Sem turma (evento, reunião...)</option>
                  {classes?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.student_count} alunos
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de agendamento" required>
                <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
                  {Object.entries(meta.booking_types)
                    .filter(([k]) => user?.role === 'gestao' || (k !== 'manutencao' && k !== 'tecnico'))
                    .map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <Field label="Título" required>
                <input className="input" placeholder="Ex.: Aula de Banco de Dados" value={form.title} onChange={(e) => set({ title: e.target.value })} required />
              </Field>
              <Field label="Quantidade de pessoas" required>
                <input className="input" type="number" min={1} placeholder="Ex.: 30" value={form.attendees} onChange={(e) => set({ attendees: e.target.value })} required />
              </Field>
            </div>
            <div>
              <p className="label">Recursos necessários</p>
              <div className="flex flex-wrap gap-2">
                <Check label="Computador por aluno" icon={<Monitor className="size-3.5" />} checked={needs.computers} onChange={(v) => setNeeds({ ...needs, computers: v })} />
                <Check label="Projetor/TV" icon={<Projector className="size-3.5" />} checked={needs.projector} onChange={(v) => setNeeds({ ...needs, projector: v })} />
                <Check label="Acessibilidade" icon={<Accessibility className="size-3.5" />} checked={needs.accessibility} onChange={(v) => setNeeds({ ...needs, accessibility: v })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Data" required>
                <input className="input" type="date" min={meta.now.date} value={form.date} onChange={(e) => set({ date: e.target.value })} required />
              </Field>
              <Field label="Início" required>
                <input className="input" type="time" value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} required />
              </Field>
              <Field label="Término" required>
                <input className="input" type="time" value={form.end_time} onChange={(e) => set({ end_time: e.target.value })} required />
              </Field>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(meta.periods).map(([k, p]) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${form.start_time === p.start && form.end_time === p.end ? 'chip-active' : ''}`}
                  onClick={() => set({ start_time: p.start, end_time: p.end })}
                >
                  {p.label} {p.start}–{p.end}
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <Info className="size-3" /> Funcionamento: segunda a sexta, 07:45–22:30 · sábado, 09:00–18:00.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Local / sala" required hint={`${compatibleRooms.length} sala(s) compatível(is) com a quantidade e os recursos informados`}>
                <select className="input" value={form.room_id} onChange={(e) => set({ room_id: e.target.value })} required>
                  <option value="">Selecione uma sala compatível</option>
                  {compatibleRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.capacity} lugares
                    </option>
                  ))}
                  {selectedRoom && !compatibleRooms.includes(selectedRoom) && <option value={selectedRoom.id}>{selectedRoom.name} (incompatível)</option>}
                </select>
              </Field>
              <Field label="Repetir semanalmente" hint="Útil para planejar o semestre">
                <select className="input" value={form.repeat_weeks} onChange={(e) => set({ repeat_weeks: e.target.value })}>
                  {[1, 2, 4, 8, 12, 16, 20].map((n) => (
                    <option key={n} value={n}>{n === 1 ? 'Não repetir' : `${n} semanas`}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Descrição do evento">
              <textarea className="input min-h-20" placeholder="Ex.: Local reservado para aulas práticas..." value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </section>

          {check && (
            <section className="space-y-2">
              {check.ok ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="size-4" /> Horário disponível{check.results.length > 1 ? ` nas ${check.results.length} semanas` : ''}. Nenhum conflito encontrado.
                </div>
              ) : (
                check.results
                  .filter((r) => !r.ok)
                  .slice(0, 4)
                  .map((r) => (
                    <div key={r.date} className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                      <p className="flex items-center gap-2 font-semibold">
                        <XCircle className="size-4" /> Conflito em {r.date.split('-').reverse().join('/')}
                      </p>
                      <ul className="mt-1 list-disc pl-6 text-xs">
                        {r.errors.map((e) => <li key={e}>{e}</li>)}
                        {r.conflicts.filter((c) => c.blocking).map((c) => <li key={c.booking.id}>{c.message}</li>)}
                      </ul>
                    </div>
                  ))
              )}
              {[...new Set(check.results.flatMap((r) => r.warnings))].map((w) => (
                <WarningBox key={w}>{w}</WarningBox>
              ))}
            </section>
          )}
          {error && <ErrorBox message={error} />}
          <button className="btn-primary w-full" disabled={busy || (check !== null && !check.ok)}>
            {busy ? 'Salvando...' : user?.role === 'gestao' ? 'Confirmar reserva' : 'Enviar solicitação'}
          </button>
        </div>

        <aside className="space-y-3 lg:col-span-2">
          <section className="rounded-2xl bg-primary p-4 text-white">
            <h2 className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4" /> Recomendação inteligente
            </h2>
            <p className="mt-1 text-xs text-white/80">
              Pontua as salas livres por capacidade (45), recursos (25), equilíbrio de uso (15), continuidade (10) e conforto (5), e explica a escolha.
            </p>
            <button type="button" onClick={recommend} disabled={!slotReady || recLoading} className="btn mt-3 w-full bg-cream text-primary hover:bg-white">
              {recLoading ? 'Analisando...' : 'Sugerir melhor sala'}
            </button>
            {!slotReady && <p className="mt-2 text-[11px] text-white/70">Preencha quantidade, data e horário.</p>}
          </section>

          {rec && (
            <>
              {rec.explanation && (
                <div className="card-peach p-3.5 text-sm">
                  <p className="mb-1 text-[11px] font-bold tracking-wide text-primary uppercase">
                    Justificativa · {rec.explanation.source === 'gemini' ? 'Gemini (Google)' : 'regras do sistema'}
                  </p>
                  <p className="text-ink/90">{rec.explanation.text}</p>
                </div>
              )}
              {rec.recommendations.length === 0 && <ErrorBox message="Nenhuma sala atende aos critérios neste horário." />}
              {rec.recommendations.map((r, i) => {
                const selected = String(r.room.id) === form.room_id;
                return (
                  <button
                    type="button"
                    key={r.room.id}
                    onClick={() => set({ room_id: String(r.room.id) })}
                    className={`card w-full p-3.5 text-left transition ${selected ? 'ring-2 ring-primary' : 'hover:border-secondary/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <ScoreRing score={r.score} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {i === 0 && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Melhor opção</span>}
                          {selected && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Selecionada</span>}
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-primary">{r.room.name}</h3>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-muted">
                          {r.reasons.map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-5 gap-1">
                      {Object.entries(r.breakdown).map(([k, v]) => (
                        <div key={k} title={`${CRITERIA_LABEL[k]}: ${v}/${rec.weights[k as keyof typeof rec.weights]}`}>
                          <div className="h-1.5 overflow-hidden rounded-full bg-peach">
                            <div className="h-full bg-secondary" style={{ width: `${(v / rec.weights[k as keyof typeof rec.weights]) * 100}%` }} />
                          </div>
                          <p className="mt-0.5 truncate text-[9px] text-muted">{CRITERIA_LABEL[k]}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <RoomFeatures room={r.room} compact />
                    </div>
                  </button>
                );
              })}
              {rec.discarded.length > 0 && (
                <details className="card p-3.5 text-xs">
                  <summary className="cursor-pointer font-semibold text-primary">{rec.discarded.length} sala(s) descartada(s) e por quê</summary>
                  <ul className="mt-2 space-y-1 text-muted">
                    {rec.discarded.map((d) => (
                      <li key={d.room_id}>
                        <b className="text-ink">{d.room_name}</b>: {d.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </aside>
      </form>
    </div>
  );
}
