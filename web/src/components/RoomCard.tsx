import { ChevronRight, Clock, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Room } from '../lib/types';
import { RoomFeatures, StatusPill } from './ui';

export function RoomCard({ room, showAvailability }: { room: Room; showAvailability?: boolean }) {
  return (
    <Link to={`/salas/${room.id}`} className="card group flex flex-col gap-2 p-3.5 transition hover:border-secondary/50 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {room.live_status && <StatusPill status={room.live_status} />}
          {showAvailability && room.available !== undefined && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                room.available ? 'bg-emerald-600 text-white' : 'bg-red-100 text-red-700'
              }`}
            >
              {room.available ? 'Livre no horário' : 'Ocupada no horário'}
            </span>
          )}
        </div>
        <ChevronRight className="size-4 text-mist transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-primary">{room.name}</h3>
        <p className="text-[11px] text-muted">
          {room.type} · {room.setor}
          {room.floor ? `, ${room.floor}` : ''}
        </p>
      </div>
      {room.live_status === 'manutencao' && room.status_note && (
        <p className="flex items-start gap-1.5 rounded-lg bg-orange-50 px-2 py-1.5 text-[11px] text-orange-800">
          <Wrench className="mt-px size-3 shrink-0" /> {room.status_note}
        </p>
      )}
      {room.current_booking ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="size-3" /> {room.current_booking.title} · {room.current_booking.user_name} · até {room.current_booking.end_time}
        </p>
      ) : room.next_booking ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="size-3" /> Próxima: {room.next_booking.start_time} · {room.next_booking.title}
        </p>
      ) : null}
      <RoomFeatures room={room} compact />
    </Link>
  );
}
