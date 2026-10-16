import { Bell, Check, Clock, X } from 'lucide-react';
import { useState } from 'react';
import { BookingPill, Empty, ErrorBox, Field, Loading, Modal, PageHeader, RoomFeatures, ScoreRing, useToast, WarningBox } from '../components/ui';
import { api, qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtDate, fmtDateTime } from '../lib/format';
import type { Booking, BookingStatus, Recommendation, Validation } from '../lib/types';
import { useFetch } from '../lib/useFetch';

type Detail = Booking & { validation: Validation | null; alternatives: Recommendation[] };

export function Requests() {
  const { user, meta } = useAuth();
  const gestao = user?.role === 'gestao';
  const [status, setStatus] = useState<BookingStatus | ''>('pendente');
  const { data, error, loading, reload } = useFetch<Booking[]>(`/bookings${qs({ status, order: status === 'pendente' ? 'asc' : 'desc' })}`);
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        title="Solicitações"
        subtitle={gestao ? 'Analise e libere as salas solicitadas pelos professores.' : 'Acompanhe o andamento das suas solicitações de sala.'}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['pendente', 'aprovada', 'recusada', 'cancelada', ''] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {s === '' ? 'Todas' : s === 'pendente' ? 'Aguardando' : s[0].toUpperCase() + s.slice(1) + 's'}
          </button>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Empty icon={<Bell className="size-6" />} title="Nenhuma solicitação aqui" text={status === 'pendente' ? 'Tudo em dia!' : undefined} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data?.slice(0, 100).map((b) => (
            <div key={b.id} className="card flex items-center gap-3 p-3.5">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  b.status === 'pendente' ? 'bg-amber-100 text-amber-700' : b.status === 'aprovada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {b.status === 'pendente' ? <Clock className="size-5" /> : b.status === 'aprovada' ? <Check className="size-5" /> : <X className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted">
                  {fmtDate(b.date, { weekday: true })} · {b.start_time}–{b.end_time}
                  {b.date < (meta?.now.date ?? '') ? ' · passada' : ''}
                </p>
                <p className="truncate text-sm font-bold text-primary">{b.room_name}</p>
                <p className="truncate text-xs text-muted">
                  {b.title} · Professor(a) <b>{b.user_name}</b>
                </p>
              </div>
              <button className="btn-primary px-3 py-2 text-xs" onClick={() => setOpenId(b.id)}>
                Ver detalhes
              </button>
            </div>
          ))}
        </div>
      )}
      {openId && <RequestModal id={openId} onClose={() => setOpenId(null)} onDone={reload} />}
    </div>
  );
}

function RequestModal({ id, onClose, onDone }: { id: number; onClose: () => void; onDone: () => void }) {
  const { user, meta } = useAuth();
  const toast = useToast();
  const { data: b, error, loading } = useFetch<Detail>(`/bookings/${id}`);
  const [note, setNote] = useState('');
  const [series, setSeries] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const gestao = user?.role === 'gestao';

  const act = async (action: 'approve' | 'reject') => {
    setBusy(true);
    setErr('');
    try {
      await api(`/bookings/${id}/${action}`, { body: { note, series } });
      toast(action === 'approve' ? 'Solicitação aprovada. Sala liberada.' : 'Solicitação recusada.');
      onDone();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhes da solicitação"
      wide
      footer={
        gestao && b?.status === 'pendente' ? (
          <>
            <button className="btn-outline border-red-300 text-red-600 hover:bg-red-50" disabled={busy} onClick={() => act('reject')}>
              <X className="size-4" /> Recusar
            </button>
            <button className="btn-primary" disabled={busy || (b.validation ? !b.validation.ok : false)} onClick={() => act('approve')}>
              <Check className="size-4" /> Aprovar e liberar sala
            </button>
          </>
        ) : (
          <button className="btn-outline" onClick={onClose}>Fechar</button>
        )
      }
    >
      {loading || !b ? (
        error ? <ErrorBox message={error} /> : <Loading />
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-primary">{b.room_name}</h3>
              <p className="text-muted">
                {fmtDate(b.date, { weekday: true })} · {b.start_time}–{b.end_time}
              </p>
            </div>
            <BookingPill status={b.status} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-peach/40 p-3 text-xs">
            <dt className="text-muted">Professor(a)</dt>
            <dd className="font-semibold">{b.user_name}</dd>
            <dt className="text-muted">Título</dt>
            <dd className="font-semibold">{b.title}</dd>
            <dt className="text-muted">Tipo</dt>
            <dd className="font-semibold">{meta?.booking_types[b.type] ?? b.type}</dd>
            <dt className="text-muted">Turma</dt>
            <dd className="font-semibold">{b.class_name ?? '—'}</dd>
            <dt className="text-muted">Pessoas</dt>
            <dd className="font-semibold">{b.attendees}</dd>
            <dt className="text-muted">Solicitado em</dt>
            <dd className="font-semibold">{fmtDateTime(b.created_at)}</dd>
            {b.reviewer_name && (
              <>
                <dt className="text-muted">Analisado por</dt>
                <dd className="font-semibold">{b.reviewer_name}</dd>
              </>
            )}
          </dl>
          {b.description && <p className="text-ink/80">{b.description}</p>}
          {b.recommendation && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-xs">
              <p className="mb-1 font-bold text-secondary">Por que esta sala (recomendação do sistema)</p>
              {b.recommendation}
            </div>
          )}
          {b.review_note && <WarningBox>Observação da gestão: {b.review_note}</WarningBox>}

          {b.validation && (
            <div className="space-y-2">
              {b.validation.ok ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Sem conflitos: a sala está livre neste horário.</div>
              ) : (
                <ErrorBox message={[...b.validation.errors, ...b.validation.conflicts.filter((c) => c.blocking).map((c) => c.message)].join(' ')} />
              )}
              {b.validation.warnings.map((w) => (
                <WarningBox key={w}>{w}</WarningBox>
              ))}
            </div>
          )}

          {b.alternatives.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold text-primary">Salas alternativas livres neste horário</p>
              <div className="space-y-2">
                {b.alternatives.map((a) => (
                  <div key={a.room.id} className="card flex items-center gap-3 p-2.5">
                    <ScoreRing score={a.score} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">{a.room.name}</p>
                      <p className="truncate text-[11px] text-muted">{a.reasons[0]}</p>
                      <RoomFeatures room={a.room} compact />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gestao && b.status === 'pendente' && (
            <div className="space-y-2">
              {b.series_id && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" className="accent-primary" checked={series} onChange={(e) => setSeries(e.target.checked)} />
                  Aplicar a todas as ocorrências semanais pendentes desta solicitação
                </label>
              )}
              <Field label="Observação (obrigatória para recusar)">
                <textarea className="input min-h-16" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Sala reservada para outro evento. Sugerimos a Sala 101." />
              </Field>
            </div>
          )}
          {err && <ErrorBox message={err} />}
        </div>
      )}
    </Modal>
  );
}
