import { AlertTriangle, ArrowLeft, Accessibility, Loader2, Monitor, Projector, Snowflake, Tv, Users, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOOKING_STATUS, LIVE_STATUS } from '../lib/format';
import type { BookingStatus, LiveStatus, Room } from '../lib/types';

export function StatusPill({ status }: { status: LiveStatus }) {
  const s = LIVE_STATUS[status];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

export function BookingPill({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS[status];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="size-5 animate-spin text-primary" /> {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span>{message}</span>
    </div>
  );
}

export function WarningBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <div>{children}</div>
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 rounded-2xl bg-peach/70 p-3 text-primary">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, back }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; back?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {back && (
          <button onClick={() => navigate(-1)} className="mt-0.5 rounded-lg p-1 text-primary hover:bg-primary/5" aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        className={`max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-peach px-5 py-4">
          <h2 className="text-base font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-peach/60" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-peach px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && ' *'}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Check({ checked, onChange, label, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
        checked ? 'border-primary bg-primary/10 text-primary' : 'border-peach bg-white/70 text-muted hover:border-primary/40'
      }`}
    >
      <span className={`flex size-4 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-white' : 'border-mist bg-white'}`}>
        {checked && <svg viewBox="0 0 12 12" className="size-3"><path d="M2 6l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}
      </span>
      {icon}
      {label}
    </button>
  );
}

export function StatCard({ label, value, tone = 'peach', icon }: { label: string; value: ReactNode; tone?: 'peach' | 'primary' | 'white'; icon?: ReactNode }) {
  const cls = {
    peach: 'bg-peach/70 text-primary',
    primary: 'bg-primary text-white',
    white: 'bg-white/80 text-primary border border-peach',
  }[tone];
  return (
    <div className={`rounded-2xl px-3 py-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function RoomFeatures({ room, compact }: { room: Room; compact?: boolean }) {
  const items: [ReactNode, string, boolean][] = [
    [<Users key="Users" className="size-3.5" />, `${room.capacity} lugares`, true],
    [<Monitor key="Monitor" className="size-3.5" />, `${room.computers} PCs`, room.computers > 0],
    [<Projector key="Projector" className="size-3.5" />, 'Projetor', Boolean(room.has_projector)],
    [<Tv key="Tv" className="size-3.5" />, 'TV', Boolean(room.has_tv)],
    [<Snowflake key="Snowflake" className="size-3.5" />, 'Ar-cond.', Boolean(room.has_ac)],
    [<Accessibility key="Accessibility" className="size-3.5" />, 'Acessível', Boolean(room.accessible)],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items
        .filter(([, , show]) => show)
        .map(([icon, label]) => (
          <span key={label} className={`inline-flex items-center gap-1 rounded-lg bg-cream px-2 py-0.5 text-[11px] font-medium text-muted ${compact ? '' : 'border border-peach'}`}>
            {icon}
            {label}
          </span>
        ))}
      {!room.has_ac && <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">Sem ar-cond.</span>}
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#357dbf' : '#d97706';
  return (
    <div
      className="relative flex size-14 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #f7dcba 0deg)` }}
    >
      <div className="flex size-11 flex-col items-center justify-center rounded-full bg-white">
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

// ---------- Toasts ----------
type Toast = { id: number; msg: string; kind: 'ok' | 'erro' };
const ToastCtx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.kind === 'ok' ? 'bg-primary text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);
