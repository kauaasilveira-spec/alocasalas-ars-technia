import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Check, Empty, ErrorBox, Field, Loading, Modal, PageHeader, useToast } from '../components/ui';
import { api } from '../lib/api';
import type { SchoolClass } from '../lib/types';
import { useFetch } from '../lib/useFetch';

const EMPTY = { name: '', course: '', student_count: '', needs_computers: false, needs_projector: false, needs_accessibility: false };

export function Classes() {
  const toast = useToast();
  const { data, loading, reload } = useFetch<SchoolClass[]>('/classes');
  const [editing, setEditing] = useState<SchoolClass | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const open = (c: SchoolClass | 'new') => {
    setEditing(c);
    setError('');
    setForm(
      c === 'new'
        ? EMPTY
        : {
            name: c.name,
            course: c.course,
            student_count: String(c.student_count),
            needs_computers: Boolean(c.needs_computers),
            needs_projector: Boolean(c.needs_projector),
            needs_accessibility: Boolean(c.needs_accessibility),
          },
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, student_count: Number(form.student_count) };
      if (editing === 'new') await api('/classes', { body });
      else if (editing) await api(`/classes/${editing.id}`, { method: 'PUT', body });
      toast('Turma salva.');
      setEditing(null);
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (c: SchoolClass) => {
    if (!confirm(`Excluir a turma ${c.name}?`)) return;
    await api(`/classes/${c.id}`, { method: 'DELETE' });
    reload();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back
        title="Minhas turmas"
        subtitle="Cadastre suas turmas com a quantidade de alunos: o sistema mostra apenas as salas compatíveis ao reservar."
        action={
          <button className="btn-primary" onClick={() => open('new')}>
            <Plus className="size-4" /> Nova turma
          </button>
        }
      />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Empty icon={<BookOpen className="size-6" />} title="Nenhuma turma cadastrada" action={<button className="btn-primary" onClick={() => open('new')}>Cadastrar turma</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-primary">{c.name}</h3>
                  <p className="text-xs text-muted">{c.course || 'Sem curso'}</p>
                </div>
                <div className="flex">
                  <button className="btn-ghost p-1.5" onClick={() => open(c)} aria-label="Editar"><Pencil className="size-4" /></button>
                  <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(c)} aria-label="Excluir"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-primary">
                {c.student_count} <span className="text-xs font-medium text-muted">alunos</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                {c.needs_computers ? <span className="rounded bg-peach px-2 py-0.5">Computadores</span> : null}
                {c.needs_projector ? <span className="rounded bg-peach px-2 py-0.5">Projetor</span> : null}
                {c.needs_accessibility ? <span className="rounded bg-peach px-2 py-0.5">Acessibilidade</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Nova turma' : 'Editar turma'}
        footer={<button form="class-form" className="btn-primary">Salvar</button>}
      >
        <form id="class-form" onSubmit={save} className="space-y-3">
          <Field label="Nome da turma" required>
            <input className="input" placeholder="Ex.: DS-2A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Curso">
            <input className="input" placeholder="Ex.: Técnico em Desenvolvimento de Sistemas" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          </Field>
          <Field label="Quantidade de alunos" required>
            <input className="input" type="number" min={1} value={form.student_count} onChange={(e) => setForm({ ...form, student_count: e.target.value })} required />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Check label="Precisa de computadores" checked={form.needs_computers} onChange={(v) => setForm({ ...form, needs_computers: v })} />
            <Check label="Precisa de projetor" checked={form.needs_projector} onChange={(v) => setForm({ ...form, needs_projector: v })} />
            <Check label="Acessibilidade" checked={form.needs_accessibility} onChange={(v) => setForm({ ...form, needs_accessibility: v })} />
          </div>
          {error && <ErrorBox message={error} />}
        </form>
      </Modal>
    </div>
  );
}
