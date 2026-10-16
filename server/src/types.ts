export interface Room {
  id: number;
  name: string;
  type: string;
  setor: string;
  floor: string;
  description: string;
  capacity: number;
  computers: number;
  has_projector: number;
  has_ac: number;
  has_tv: number;
  accessible: number;
  status: 'ativa' | 'manutencao' | 'inativa';
  status_note: string;
  parent_id: number | null;
  image: string | null;
  updated_at: string;
  created_at: string;
}

export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  class_id: number | null;
  title: string;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  attendees: number;
  description: string;
  status: 'pendente' | 'aprovada' | 'recusada' | 'cancelada';
  review_note: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  recommendation: string | null;
  series_id: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'professor' | 'gestao';
  last_access: string | null;
  created_at: string;
}

export interface SchoolClass {
  id: number;
  professor_id: number;
  name: string;
  course: string;
  student_count: number;
  needs_computers: number;
  needs_projector: number;
  needs_accessibility: number;
  created_at: string;
}
