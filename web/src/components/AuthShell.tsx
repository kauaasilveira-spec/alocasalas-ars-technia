import { CalendarCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './Layout';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <Brand light />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl leading-tight font-extrabold">Reservas de salas sem conflitos e sem planilhas.</h2>
          <p className="mt-4 text-white/80">
            Consulte a disponibilidade, solicite espaços compatíveis com sua turma e receba recomendações inteligentes com justificativa.
          </p>
        </div>
        <p className="text-xs text-white/60">Ars Technia · Unidade 1.34</p>
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-secondary/40" />
        <div className="absolute top-24 -right-10 size-48 rounded-full bg-peach/20" />
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-peach text-primary">
              <CalendarCheck className="size-9" />
            </div>
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
