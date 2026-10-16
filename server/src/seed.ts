import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { openDb, type DB } from './db.js';
import { linkedRoomIds } from './rooms.js';
import { addDays, nowLocal, PERIODS, startOfWeek } from './schedule.js';

export const DEMO_PASSWORD = 'senha123';

type RoomSeed = {
  key: string;
  name: string;
  type: string;
  setor: string;
  floor: string;
  capacity: number;
  computers?: number;
  projector?: boolean;
  ac?: boolean;
  tv?: boolean;
  description: string;
  status?: 'ativa' | 'manutencao' | 'inativa';
  note?: string;
  parent?: string;
};

const ROOMS: RoomSeed[] = [
  { key: 's101', name: 'Sala 101', type: 'Sala de aula', setor: 'Bloco A', floor: 'Térreo', capacity: 40, projector: true, description: 'Sala de aula ampla com carteiras móveis, lousa branca e projetor.' },
  { key: 's102', name: 'Sala 102', type: 'Sala de aula', setor: 'Bloco A', floor: 'Térreo', capacity: 35, projector: true, description: 'Sala de aula com projetor e quadro branco.' },
  { key: 's103', name: 'Sala 103', type: 'Sala de aula', setor: 'Bloco A', floor: 'Térreo', capacity: 30, tv: true, description: 'Sala de aula com TV 65" para apresentações.' },
  { key: 's104', name: 'Sala 104', type: 'Sala de aula', setor: 'Bloco A', floor: 'Térreo', capacity: 20, ac: false, description: 'Sala compacta para turmas pequenas e monitorias. Ar-condicionado em instalação.' },
  { key: 's14', name: 'Sala 14 – MAC', type: 'Laboratório de informática', setor: 'Bloco B', floor: '2º andar', capacity: 30, computers: 30, projector: true, description: 'Todas as mesas com computadores MacBook, ar-condicionado e projetor.' },
  { key: 's15', name: 'Sala 15 – Desenvolvimento de Sistemas', type: 'Laboratório de informática', setor: 'Bloco B', floor: '2º andar', capacity: 32, computers: 32, projector: true, description: 'Laboratório com 32 desktops para programação.' },
  { key: 's18', name: 'Sala 18 – Redes de Computação', type: 'Laboratório técnico', setor: 'Bloco B', floor: '2º andar', capacity: 24, computers: 24, projector: true, description: 'Bancadas com racks, switches e roteadores para práticas de redes.' },
  { key: 's19', name: 'Sala 19 – Computação Quântica', type: 'Laboratório de informática', setor: 'Bloco B', floor: '2º andar', capacity: 16, computers: 16, description: 'Laboratório de pesquisa com estações de alto desempenho.', status: 'manutencao', note: 'Troca do ar-condicionado. Previsão de liberação em 5 dias.' },
  { key: 's20', name: 'Sala 20 – Studio de Fotos', type: 'Estúdio', setor: 'Bloco C', floor: '1º andar', capacity: 12, tv: true, description: 'Estúdio com fundo infinito, iluminação e tripés.' },
  { key: 'cyber', name: 'Sala Cyber (completa)', type: 'Sala Cyber', setor: 'Bloco C', floor: '1º andar', capacity: 40, computers: 40, projector: true, description: 'Espaço com dois ambientes que podem ser usados juntos ou separados.' },
  { key: 'cyber1', name: 'Sala Cyber – Ambiente 1', type: 'Sala Cyber', setor: 'Bloco C', floor: '1º andar', capacity: 20, computers: 20, projector: true, description: 'Ambiente 1 da Sala Cyber (gamer/e-sports).', parent: 'cyber' },
  { key: 'cyber2', name: 'Sala Cyber – Ambiente 2', type: 'Sala Cyber', setor: 'Bloco C', floor: '1º andar', capacity: 20, computers: 20, tv: true, description: 'Ambiente 2 da Sala Cyber (segurança da informação).', parent: 'cyber' },
  { key: 'reuniao', name: 'Sala de Reunião (completa)', type: 'Sala de reunião', setor: 'Administração', floor: 'Térreo', capacity: 24, tv: true, description: 'Sala de reunião apartada com divisória: pode ser desmembrada em duas.' },
  { key: 'reuniaoA', name: 'Sala de Reunião A', type: 'Sala de reunião', setor: 'Administração', floor: 'Térreo', capacity: 12, tv: true, description: 'Metade A da sala de reunião.', parent: 'reuniao' },
  { key: 'reuniaoB', name: 'Sala de Reunião B', type: 'Sala de reunião', setor: 'Administração', floor: 'Térreo', capacity: 12, description: 'Metade B da sala de reunião.', parent: 'reuniao' },
  { key: 'auditorio', name: 'Auditório', type: 'Auditório', setor: 'Bloco A', floor: 'Térreo', capacity: 120, projector: true, tv: true, description: 'Auditório com palco, som e projetor para eventos e palestras.' },
  { key: 'eletronica', name: 'Laboratório de Eletrônica', type: 'Laboratório técnico', setor: 'Bloco C', floor: '1º andar', capacity: 20, computers: 10, projector: true, description: 'Bancadas com osciloscópios, fontes e kits de microcontroladores.' },
];

const USERS = [
  { key: 'samanta', name: 'Samanta Giulia', email: 'samanta@alocasalas.com', role: 'gestao' },
  { key: 'juscelino', name: 'Juscelino Andrade', email: 'juscelino@alocasalas.com', role: 'gestao' },
  { key: 'alexia', name: 'Aléxia Victória', email: 'alexia@alocasalas.com', role: 'professor' },
  { key: 'eduardo', name: 'Eduardo Mendes Costa', email: 'eduardo@alocasalas.com', role: 'professor' },
  { key: 'patrick', name: 'Patrick Souza', email: 'patrick@alocasalas.com', role: 'professor' },
  { key: 'jessica', name: 'Jéssica Lima', email: 'jessica@alocasalas.com', role: 'professor' },
  { key: 'marcos', name: 'Marcos Caique', email: 'marcos@alocasalas.com', role: 'professor' },
] as const;

type ClassSeed = {
  prof: string;
  name: string;
  course: string;
  students: number;
  computers?: boolean;
  projector?: boolean;
  /** [room, weekday (1=seg), period] */
  slots: [string, number, keyof typeof PERIODS][];
  /** Semana (relativa à atual) em que a turma começou — gera o crescimento histórico. */
  since: number;
};

const CLASSES: ClassSeed[] = [
  { prof: 'alexia', name: 'DS-2A', course: 'Técnico em Desenvolvimento de Sistemas', students: 30, computers: true, slots: [['s15', 1, 'manha'], ['s15', 3, 'manha']], since: -10 },
  { prof: 'alexia', name: 'DS-3B', course: 'Técnico em Desenvolvimento de Sistemas', students: 28, computers: true, slots: [['s14', 2, 'noite'], ['s14', 4, 'noite']], since: -6 },
  { prof: 'eduardo', name: 'DS-1C', course: 'Técnico em Desenvolvimento de Sistemas', students: 32, computers: true, slots: [['s15', 2, 'tarde'], ['s15', 5, 'tarde']], since: -9 },
  { prof: 'eduardo', name: 'Lógica de Programação', course: 'Curso livre', students: 18, computers: true, slots: [['cyber1', 6, 'manha']], since: -4 },
  { prof: 'patrick', name: 'Redes-2A', course: 'Técnico em Redes de Computadores', students: 22, computers: true, slots: [['s18', 1, 'tarde'], ['s18', 3, 'tarde']], since: -10 },
  { prof: 'patrick', name: 'Segurança da Informação', course: 'Qualificação', students: 20, computers: true, slots: [['cyber2', 2, 'noite'], ['cyber2', 4, 'noite']], since: -5 },
  { prof: 'jessica', name: 'ADM-1A', course: 'Técnico em Administração', students: 38, projector: true, slots: [['s101', 1, 'noite'], ['s101', 3, 'noite'], ['s101', 5, 'noite']], since: -10 },
  { prof: 'jessica', name: 'SEDUC – Itinerário Formativo', course: 'Novo Ensino Médio (integral)', students: 34, projector: true, slots: [['s102', 2, 'integral'], ['s102', 4, 'integral']], since: -8 },
  { prof: 'marcos', name: 'Fotografia Digital', course: 'Curso livre', students: 10, slots: [['s20', 6, 'manha'], ['s20', 3, 'tarde']], since: -7 },
  { prof: 'marcos', name: 'Eletrônica Básica', course: 'Técnico em Eletrônica', students: 18, projector: true, slots: [['eletronica', 2, 'manha'], ['eletronica', 4, 'manha']], since: -3 },
  { prof: 'eduardo', name: 'Games-1A', course: 'Técnico em Programação de Jogos', students: 36, computers: true, slots: [['cyber', 5, 'noite']], since: -2 },
  { prof: 'alexia', name: 'Banco de Dados', course: 'Técnico em Desenvolvimento de Sistemas', students: 25, computers: true, slots: [['s14', 1, 'tarde']], since: -1 },
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function seed(db: DB) {
  const random = rng(134);
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const today = nowLocal().date;
  const week0 = startOfWeek(today);

  const tx = db.transaction(() => {
    const userIds: Record<string, number> = {};
    for (const u of USERS) {
      userIds[u.key] = Number(
        db
          .prepare("INSERT INTO users (name, email, password_hash, role, last_access) VALUES (?, ?, ?, ?, datetime('now', '-1 day'))")
          .run(u.name, u.email, hash, u.role).lastInsertRowid,
      );
    }

    const roomIds: Record<string, number> = {};
    for (const r of ROOMS) {
      roomIds[r.key] = Number(
        db
          .prepare(
            `INSERT INTO rooms (name, type, setor, floor, description, capacity, computers, has_projector, has_ac, has_tv, accessible, status, status_note, parent_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          )
          .run(
            r.name,
            r.type,
            r.setor,
            r.floor,
            r.description,
            r.capacity,
            r.computers ?? 0,
            r.projector ? 1 : 0,
            r.ac === false ? 0 : 1,
            r.tv ? 1 : 0,
            r.status ?? 'ativa',
            r.note ?? '',
            r.parent ? roomIds[r.parent] : null,
          ).lastInsertRowid,
      );
    }
    const roomRows = db.prepare('SELECT id, parent_id FROM rooms').all() as { id: number; parent_id: number | null }[];

    // Ocupação por sala/data/período para garantir que o seed não gere conflitos.
    const busy = new Map<string, [string, string][]>();
    const free = (roomId: number, d: string, s: string, e: string) => {
      const ids = linkedRoomIds(roomRows.find((r) => r.id === roomId)!, roomRows);
      return ids.every((id) => !(busy.get(`${id}|${d}`) ?? []).some(([bs, be]) => s < be && bs < e));
    };
    const mark = (roomId: number, d: string, s: string, e: string) => {
      const k = `${roomId}|${d}`;
      busy.set(k, [...(busy.get(k) ?? []), [s, e]]);
    };

    const insert = db.prepare(
      `INSERT INTO bookings (room_id, user_id, class_id, title, type, date, start_time, end_time, attendees, description, status, review_note, reviewed_by, reviewed_at, series_id, created_at)
       VALUES (@room_id, @user_id, @class_id, @title, @type, @date, @start_time, @end_time, @attendees, @description, @status, @review_note, @reviewed_by, @reviewed_at, @series_id, @created_at)`,
    );
    const book = (b: {
      room: string;
      user: string;
      class_id?: number | null;
      title: string;
      type: string;
      date: string;
      start: string;
      end: string;
      attendees: number;
      description?: string;
      status?: string;
      note?: string;
      series?: string | null;
    }) => {
      const roomId = roomIds[b.room];
      const active = b.status === undefined || b.status === 'aprovada' || b.status === 'pendente';
      if (active && !free(roomId, b.date, b.start, b.end)) return;
      if (active) mark(roomId, b.date, b.start, b.end);
      const status = b.status ?? 'aprovada';
      insert.run({
        room_id: roomId,
        user_id: userIds[b.user],
        class_id: b.class_id ?? null,
        title: b.title,
        type: b.type,
        date: b.date,
        start_time: b.start,
        end_time: b.end,
        attendees: b.attendees,
        description: b.description ?? '',
        status,
        review_note: b.note ?? '',
        reviewed_by: status === 'pendente' ? null : userIds.samanta,
        reviewed_at: status === 'pendente' ? null : `${addDays(b.date, -7)} 10:00:00`,
        series_id: b.series ?? null,
        created_at: `${addDays(b.date, status === 'pendente' ? -2 : -10)} 09:00:00`,
      });
    };

    // Turmas e aulas recorrentes (10 semanas de histórico + 3 futuras)
    for (const c of CLASSES) {
      const classId = Number(
        db
          .prepare(
            `INSERT INTO classes (professor_id, name, course, student_count, needs_computers, needs_projector) VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(userIds[c.prof], c.name, c.course, c.students, c.computers ? 1 : 0, c.projector ? 1 : 0).lastInsertRowid,
      );
      for (const [room, wd, period] of c.slots) {
        const series = `seed-${classId}-${room}-${wd}`;
        for (let w = c.since; w <= 3; w++) {
          const d = addDays(week0, w * 7 + (wd - 1));
          const p = PERIODS[period];
          const start = wd === 6 && period === 'manha' ? '09:00' : p.start;
          book({
            room,
            user: c.prof,
            class_id: classId,
            title: `Aula ${c.name}`,
            type: 'aula',
            date: d,
            start,
            end: p.end,
            attendees: c.students,
            description: c.course,
            series,
          });
        }
      }
    }

    // Eventos, reuniões e cursos pontuais distribuídos no histórico
    const events = [
      { room: 'auditorio', title: 'Palestra: Carreiras em Tecnologia', type: 'evento', attendees: 110, start: '19:00', end: '21:30' },
      { room: 'auditorio', title: 'Aula inaugural', type: 'evento', attendees: 95, start: '09:00', end: '11:00' },
      { room: 'reuniao', title: 'Conselho de classe', type: 'reuniao', attendees: 20, start: '14:00', end: '16:00' },
      { room: 'reuniaoA', title: 'Reunião pedagógica', type: 'reuniao', attendees: 8, start: '10:00', end: '11:30' },
      { room: 'reuniaoB', title: 'Atendimento a pais', type: 'reuniao', attendees: 6, start: '15:00', end: '16:30' },
      { room: 's103', title: 'Workshop de Currículo', type: 'curso', attendees: 26, start: '13:30', end: '16:30' },
      { room: 's20', title: 'Ensaio fotográfico – formandos', type: 'evento', attendees: 10, start: '18:30', end: '21:00' },
      { room: 's104', title: 'Monitoria de Matemática', type: 'aula', attendees: 14, start: '13:00', end: '15:00' },
    ];
    for (let w = -10; w <= 2; w++) {
      const perWeek = 2 + Math.floor(((w + 10) / 12) * 4);
      for (let i = 0; i < perWeek; i++) {
        const e = events[Math.floor(random() * events.length)];
        const wd = 1 + Math.floor(random() * 5);
        const d = addDays(week0, w * 7 + (wd - 1));
        const users = ['samanta', 'jessica', 'eduardo', 'alexia', 'juscelino'];
        book({ ...e, user: users[Math.floor(random() * users.length)], date: d });
      }
    }

    // Manutenções técnicas
    book({ room: 's15', user: 'juscelino', title: 'Formatação dos computadores', type: 'manutencao', date: addDays(week0, -14 + 5), start: '08:00', end: '12:00', attendees: 2 });
    book({ room: 's19', user: 'juscelino', title: 'Troca do ar-condicionado', type: 'manutencao', date: addDays(week0, 5), start: '09:00', end: '17:00', attendees: 3 });

    // Solicitações pendentes, recusadas e canceladas
    const tomorrow = addDays(today, 1) <= addDays(week0, 5) ? addDays(today, 1) : addDays(week0, 7);
    book({ room: 's14', user: 'eduardo', title: 'Hackathon interno', type: 'evento', date: addDays(week0, 7 + 2), start: '13:00', end: '17:30', attendees: 28, status: 'pendente', description: 'Maratona de programação entre as turmas de DS.' });
    book({ room: 'auditorio', user: 'jessica', title: 'Feira de Empreendedorismo', type: 'evento', date: addDays(week0, 7 + 4), start: '18:00', end: '22:00', attendees: 100, status: 'pendente', description: 'Apresentação dos projetos dos alunos de ADM.' });
    book({ room: 'reuniaoA', user: 'alexia', title: 'Orientação de TCC', type: 'reuniao', date: tomorrow, start: '16:00', end: '17:00', attendees: 5, status: 'pendente' });
    book({ room: 's103', user: 'patrick', title: 'Revisão para certificação CCNA', type: 'curso', date: addDays(week0, 7 + 5), start: '13:00', end: '17:00', attendees: 18, status: 'pendente' });
    book({ room: 'cyber', user: 'marcos', title: 'Campeonato de e-sports', type: 'evento', date: addDays(week0, 7 + 5), start: '09:00', end: '12:00', attendees: 36, status: 'pendente', description: 'Precisa dos dois ambientes da Sala Cyber.' });
    book({ room: 'auditorio', user: 'patrick', title: 'Semana de Redes', type: 'evento', date: addDays(week0, -7 + 3), start: '19:00', end: '22:00', attendees: 80, status: 'recusada', note: 'Auditório reservado para a aula inaugural. Sugerimos a Sala 101.' });
    book({ room: 's101', user: 'alexia', title: 'Aula de reposição DS-2A', type: 'aula', date: addDays(week0, -7 + 5), start: '13:00', end: '15:00', attendees: 30, status: 'cancelada' });

    const log = db.prepare('INSERT INTO audit_log (user_id, action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    log.run(userIds.samanta, 'status_sala', 'sala', roomIds.s19, 'Sala 19 – Computação Quântica: ativa → manutencao (Troca do ar-condicionado)', `${addDays(today, -1)} 08:15:00`);
    log.run(userIds.samanta, 'recusar', 'reserva', null, 'Semana de Redes — Auditório reservado para a aula inaugural', `${addDays(week0, -9)} 11:00:00`);
    log.run(userIds.juscelino, 'criar', 'sala', roomIds.eletronica, 'Sala Laboratório de Eletrônica cadastrada', `${addDays(week0, -22)} 14:00:00`);
  });
  tx();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDb();
  db.exec('DELETE FROM audit_log; DELETE FROM bookings; DELETE FROM classes; DELETE FROM rooms; DELETE FROM users; DELETE FROM sqlite_sequence;');
  seed(db);
  const n = db.prepare('SELECT COUNT(*) AS n FROM bookings').get() as { n: number };
  console.log(`Banco recriado com dados de demonstração (${n.n} reservas). Senha de todos os usuários: ${DEMO_PASSWORD}`);
}
