import { BookOpen, LogOut, Pencil } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorBox, Field, Loading, PageHeader, StatCard, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtDateTime, initials } from '../lib/format';
import type { User } from '../lib/types';
import { useFetch } from '../lib/useFetch';

interface Me {
  user: User;
  stats: { aprovadas: number | null; pendentes: number | null; recusadas: number | null; total: number };
}

export function Profile() {
  const { logout } = useAuth();
  const { data } = useFetch<Me>('/me');
  if (!data) return <Loading />;
  const { user, stats } = data;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Perfil" />
      <section className="card p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-peach text-xl font-bold text-primary">{initials(user.name)}</div>
          <div>
            <h2 className="text-lg font-bold text-primary">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCard label="Aprovadas" value={stats.aprovadas ?? 0} />
          <StatCard label="Pendentes" value={stats.pendentes ?? 0} />
          <StatCard label="Último acesso" value={<span className="text-sm">{user.last_access ? fmtDateTime(user.last_access) : 'Hoje'}</span>} />
        </div>
        <h3 className="mt-5 mb-2 text-sm font-bold text-primary">Detalhes da conta</h3>
        <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="text-muted">Nome completo</dt>
          <dd className="text-right font-medium">{user.name}</dd>
          <dt className="text-muted">E-mail</dt>
          <dd className="truncate text-right font-medium">{user.email}</dd>
          <dt className="text-muted">Perfil</dt>
          <dd className="text-right font-medium">{user.role === 'gestao' ? 'Gestão' : 'Professor(a)'}</dd>
          <dt className="text-muted">Conta criada em</dt>
          <dd className="text-right font-medium">{fmtDateTime(user.created_at)}</dd>
        </dl>
      </section>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link to="/turmas" className="btn-outline">
          <BookOpen className="size-4" /> Minhas turmas
        </Link>
        <Link to="/perfil/editar" className="btn-outline">
          <Pencil className="size-4" /> Editar perfil
        </Link>
        <button onClick={logout} className="btn-primary">
          <LogOut className="size-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
}

export function EditProfile() {
  const { user, setSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ token: string; user: User }>('/me', { method: 'PUT', body: form });
      setSession(r.token, r.user);
      toast('Perfil atualizado.');
      navigate('/perfil');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back title="Editar perfil" />
      <form onSubmit={submit} className="card space-y-4 p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-peach/50 p-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-peach font-bold text-primary">{initials(form.name)}</div>
          <div>
            <p className="font-bold text-primary">{form.name || 'Seu nome'}</p>
            <p className="text-xs text-muted">{form.email}</p>
          </div>
        </div>
        <Field label="Nome">
          <input className="input" placeholder="Digite seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Nova senha" hint="Deixe em branco para manter a atual">
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
        </Field>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}
