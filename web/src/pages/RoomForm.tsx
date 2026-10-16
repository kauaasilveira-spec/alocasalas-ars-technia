import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ErrorBox, Field, Loading, PageHeader, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Room } from '../lib/types';
import { useFetch } from '../lib/useFetch';

const EMPTY = {
  name: '',
  type: 'Sala de aula',
  setor: '',
  floor: '',
  description: '',
  capacity: '',
  computers: '0',
  has_projector: false,
  has_ac: true,
  has_tv: false,
  accessible: true,
  status: 'ativa' as Room['status'],
  status_note: '',
  parent_id: '',
};

export function RoomForm() {
  const { id } = useParams();
  const { meta } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: rooms } = useFetch<Room[]>('/rooms');
  const { data: existing, loading } = useFetch<Room>(id ? `/rooms/${id}` : null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      type: existing.type,
      setor: existing.setor,
      floor: existing.floor,
      description: existing.description,
      capacity: String(existing.capacity),
      computers: String(existing.computers),
      has_projector: Boolean(existing.has_projector),
      has_ac: Boolean(existing.has_ac),
      has_tv: Boolean(existing.has_tv),
      accessible: Boolean(existing.accessible),
      status: existing.status,
      status_note: existing.status_note,
      parent_id: existing.parent_id ? String(existing.parent_id) : '',
    });
  }, [existing]);

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      setError('Imagem muito grande (máx. 2 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...form,
        capacity: Number(form.capacity),
        computers: Number(form.computers),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        ...(image !== undefined ? { image } : {}),
      };
      const saved = await api<Room>(id ? `/rooms/${id}` : '/rooms', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Sala atualizada.' : 'Sala cadastrada.');
      navigate(`/salas/${saved.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id || !confirm('Excluir esta sala? Esta ação não pode ser desfeita.')) return;
    try {
      await api(`/rooms/${id}`, { method: 'DELETE' });
      toast('Sala excluída.');
      navigate('/salas');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (id && loading) return <Loading />;
  const previewSrc = image ?? (image === undefined && existing?.has_image ? `/api/rooms/${id}/image` : null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back title={id ? 'Editar sala' : 'Cadastro de salas'} subtitle="Cadastre o ambiente, sua capacidade, recursos e situação." />
      <form onSubmit={submit} className="card space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da sala" required>
            <input className="input" placeholder="Ex.: Sala 14 – MAC" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
          </Field>
          <Field label="Tipo de ambiente" required>
            <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
              {meta?.room_types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Local / Setor">
            <input className="input" placeholder="Ex.: Bloco B" value={form.setor} onChange={(e) => set({ setor: e.target.value })} />
          </Field>
          <Field label="Andar">
            <input className="input" placeholder="Ex.: 2º andar" value={form.floor} onChange={(e) => set({ floor: e.target.value })} />
          </Field>
          <Field label="Quantidade de alunos (limite de assentos)" required>
            <input className="input" type="number" min={1} placeholder="Ex.: 30" value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} required />
          </Field>
          <Field label="Computadores">
            <input className="input" type="number" min={0} value={form.computers} onChange={(e) => set({ computers: e.target.value })} />
          </Field>
        </div>
        <div>
          <p className="label">Recursos e acessibilidade</p>
          <div className="flex flex-wrap gap-2">
            <Check label="Projetor" checked={form.has_projector} onChange={(v) => set({ has_projector: v })} />
            <Check label="TV" checked={form.has_tv} onChange={(v) => set({ has_tv: v })} />
            <Check label="Ar-condicionado" checked={form.has_ac} onChange={(v) => set({ has_ac: v })} />
            <Check label="Acessível" checked={form.accessible} onChange={(v) => set({ accessible: v })} />
          </div>
        </div>
        <Field label="Faz parte de outro ambiente (divisão)" hint="Ex.: Ambiente 1 da Sala Cyber. Reservar o ambiente inteiro bloqueia as divisões, e vice-versa.">
          <select className="input" value={form.parent_id} onChange={(e) => set({ parent_id: e.target.value })}>
            <option value="">Não, é um ambiente independente</option>
            {rooms?.filter((r) => !r.parent_id && String(r.id) !== id).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Descrição do local">
          <textarea className="input min-h-20" placeholder="Ex.: Local reservado para aulas práticas..." value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <Field label="Situação">
            <select className="input" value={form.status} onChange={(e) => set({ status: e.target.value as Room['status'] })}>
              <option value="ativa">Ativa</option>
              <option value="manutencao">Em manutenção</option>
              <option value="inativa">Desativada</option>
            </select>
          </Field>
          <Field label="Aviso / comunicação" hint="Exibido para todos na tela inicial e nos detalhes da sala.">
            <input className="input" placeholder="Ex.: Troca do ar-condicionado até sexta-feira" value={form.status_note} onChange={(e) => set({ status_note: e.target.value })} />
          </Field>
        </div>
        <div>
          <p className="label">Imagem</p>
          <label className="flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-peach bg-peach/30 hover:border-secondary">
            {previewSrc ? (
              <img src={previewSrc} alt="Pré-visualização" className="size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs text-muted">
                <ImagePlus className="size-7 text-primary/60" /> Adicionar foto do local
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {previewSrc && (
            <button type="button" className="mt-1 text-xs text-red-600 hover:underline" onClick={() => setImage(null)}>
              Remover imagem
            </button>
          )}
        </div>
        {error && <ErrorBox message={error} />}
        <div className="flex gap-2">
          {id && (
            <button type="button" onClick={remove} className="btn-outline border-red-300 text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" /> Excluir
            </button>
          )}
          <button className="btn-primary flex-1" disabled={busy}>
            {busy ? 'Salvando...' : id ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
