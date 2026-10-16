import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { ErrorBox, Field } from '../components/ui';
import { useAuth } from '../lib/auth';

const DEMO = [
  { label: 'Professor(a)', email: 'alexia@alocasalas.com' },
  { label: 'Gestão', email: 'samanta@alocasalas.com' },
];

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Acesse sua conta para acompanhar reservas, solicitações e a ocupação das salas.">
      <form onSubmit={submit} className="card space-y-4 p-5">
        <Field label="E-mail">
          <input className="input" type="email" placeholder="Digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </Field>
        <Field label="Senha">
          <input className="input" type="password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </Field>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-xs text-muted">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
      <div className="mt-4 rounded-2xl border border-dashed border-mist p-3 text-xs text-muted">
        <p className="mb-2 font-semibold text-ink">Acesso de demonstração (senha: senha123)</p>
        <div className="flex gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              className="chip flex-1"
              onClick={() => {
                setEmail(d.email);
                setPassword('senha123');
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
