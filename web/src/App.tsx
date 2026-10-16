import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import { useAuth } from './lib/auth';
import { Bookings } from './pages/Bookings';
import { Classes } from './pages/Classes';
import { History } from './pages/History';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NewBooking } from './pages/NewBooking';
import { EditProfile, Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { Requests } from './pages/Requests';
import { RoomDetail } from './pages/RoomDetail';
import { RoomForm } from './pages/RoomForm';
import { Rooms } from './pages/Rooms';

function GestaoOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'gestao' ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="salas" element={<Rooms />} />
        <Route path="salas/nova" element={<GestaoOnly><RoomForm /></GestaoOnly>} />
        <Route path="salas/:id" element={<RoomDetail />} />
        <Route path="salas/:id/editar" element={<GestaoOnly><RoomForm /></GestaoOnly>} />
        <Route path="agendar" element={<NewBooking />} />
        <Route path="reservas" element={<Bookings />} />
        <Route path="solicitacoes" element={<Requests />} />
        <Route path="historico" element={<GestaoOnly><History /></GestaoOnly>} />
        <Route path="turmas" element={<Classes />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="perfil/editar" element={<EditProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
