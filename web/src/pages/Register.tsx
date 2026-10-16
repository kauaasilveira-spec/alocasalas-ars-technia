import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { ErrorBox, Field } from '../components/ui';
import { useAuth } from '../lib/auth';

export function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError('Aceite os termos de uso para continuar.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Criar Conta" subtitle="Preencha os dados abaixo para acessar o aplicativo.">
      <form onSubmit={submit} className="card space-y-4 p-5">
        <Field label="Nome completo">
          <input className="input" placeholder="Digite seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" placeholder="nome@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres">
          <input className="input" type="password" placeholder="Crie uma senha segura" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </Field>
        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" className="mt-0.5 accent-primary" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          Li e aceito os termos de uso e a política de privacidade.
        </label>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Criando...' : 'Criar Conta'}
        </button>
        <p className="text-center text-xs text-muted">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
      <p className="mt-3 text-center text-[11px] text-muted">Novas contas são criadas com perfil de Professor(a). Contas da gestão são criadas pela coordenação.</p>
    </AuthShell>
  );
}
