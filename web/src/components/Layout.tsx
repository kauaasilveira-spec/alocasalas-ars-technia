import { BarChart3, Bell, Building2, CalendarDays, Home, LogOut, User } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';

export function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-9 rounded-xl" />
      <div className="leading-tight">
        <div className={`text-sm font-extrabold ${light ? 'text-white' : 'text-primary'}`}>AlocaSalas</div>
        <div className={`text-[10px] font-medium ${light ? 'text-white/70' : 'text-muted'}`}>Unidade 1.34</div>
      </div>
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const gestao = user?.role === 'gestao';
  const items = [
    { to: '/', label: 'Início', icon: Home, end: true },
    { to: '/reservas', label: 'Reservas', icon: CalendarDays },
    { to: '/salas', label: 'Salas', icon: Building2 },
    { to: '/solicitacoes', label: 'Solicitações', icon: Bell },
    ...(gestao ? [{ to: '/historico', label: 'Histórico', icon: BarChart3 }] : []),
    { to: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-primary px-4 py-6 text-white md:flex">
        <Brand light />
        <p className="mt-8 mb-2 px-3 text-[10px] font-semibold tracking-wider text-white/60 uppercase">Menu principal</p>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-cream text-primary shadow-sm' : 'text-white/85 hover:bg-white/10'
                }`
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-peach text-xs font-bold text-primary">{initials(user?.name ?? '')}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] text-white/70">{gestao ? 'Gestão' : 'Professor(a)'}</div>
            </div>
            <button onClick={logout} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10" title="Sair" aria-label="Sair">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-8 md:pt-8">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-primary-dark bg-primary px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.4rem)] md:hidden">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-white/70'}`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
