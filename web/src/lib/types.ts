export type Role = 'professor' | 'gestao';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  last_access: string | null;
  created_at: string;
}

export type LiveStatus = 'aberta' | 'reservada' | 'fechada' | 'manutencao';
export type RoomStatus = 'ativa' | 'manutencao' | 'inativa';
export type BookingStatus = 'pendente' | 'aprovada' | 'recusada' | 'cancelada';

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
  status: RoomStatus;
  status_note: string;
  parent_id: number | null;
  has_image: boolean;
  size_category: 'poucos' | 'medios' | 'muitos';
  size_label: string;
  updated_at: string;
  live_status?: LiveStatus;
  current_booking?: Booking | null;
  next_booking?: Booking | null;
  available?: boolean;
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
  status: BookingStatus;
  review_note: string;
  reviewed_at: string | null;
  recommendation: string | null;
  series_id: string | null;
  created_at: string;
  room_name: string;
  user_name: string;
  class_name: string | null;
  reviewer_name: string | null;
}

export interface SchoolClass {
  id: number;
  name: string;
  course: string;
  student_count: number;
  needs_computers: number;
  needs_projector: number;
  needs_accessibility: number;
}

export interface ConflictItem {
  kind: 'sala' | 'ambiente_vinculado' | 'turma' | 'professor';
  blocking: boolean;
  message: string;
  booking: { id: number; title: string; start_time: string; end_time: string; room_name: string; user_name: string; status: string };
}

export interface Validation {
  ok: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ConflictItem[];
}

export interface Recommendation {
  room: Room;
  score: number;
  breakdown: Record<'capacidade' | 'recursos' | 'equilibrio' | 'continuidade' | 'conforto', number>;
  reasons: string[];
}

export interface RecommendResponse {
  recommendations: Recommendation[];
  discarded: { room_id: number; room_name: string; reason: string }[];
  explanation: { text: string; source: 'gemini' | 'regras' } | null;
  weights: Recommendation['breakdown'];
}

export interface Meta {
  periods: Record<string, { label: string; start: string; end: string }>;
  operating_hours: Record<string, { start: string; end: string } | null>;
  booking_types: Record<string, string>;
  room_types: string[];
  size_labels: Record<string, string>;
  ai_enabled: boolean;
  now: { date: string; time: string };
}

export interface HistoryPoint {
  week_start: string;
  hours: number;
  bookings: number;
  utilization: number;
}
