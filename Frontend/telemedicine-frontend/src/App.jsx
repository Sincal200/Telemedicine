import PaginaRecetas from './pages/PaginaRecetas';
import ChatDiagnostico from './pages/ChatDiagnostico.jsx';
import ChatMedico from './pages/ChatMedico.jsx';
import ConfiguracionHorarioMedico from './pages/ConfiguracionHorarioMedico.jsx';
import PaginaHistorialConsultasDoctor from './pages/PaginaHistorialConsultasDoctor.jsx';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Video from './pages/Video.jsx';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard.jsx';
import GestionCitas from './pages/GestionCitas.jsx';
import GestionSolicitudesRol from './pages/GestionSolicitudesRol.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Perfil from './pages/Perfil.jsx';
import { useParams, useLocation } from 'react-router-dom';
import VideoComponent from './components/VideoComponent';

function VideoComponentWrapper() {
  const { roomId } = useParams();
  const location = useLocation();
  // Si se navega desde ResumenCitas, se pasan por location.state
  const userRole = location.state?.userRole || 'doctor';
  const userId = location.state?.userId || 1;
  return <VideoComponent roomId={roomId} userRole={userRole} userId={userId} />;
}
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/home" element={<Home />} />
      <Route path="/video" element={<Video />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/citas" element={<GestionCitas />} />
      <Route path="/admin/solicitudes-rol" element={<GestionSolicitudesRol />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/videollamada/:roomId" element={<VideoComponentWrapper />} />
      <Route path="/recetas" element={<PaginaRecetas />} />
      <Route path="/historial-consultas" element={<PaginaRecetas />} />
      <Route path="/historial-consultas-doctor" element={<PaginaHistorialConsultasDoctor />} />
      <Route path="/chat-diagnostico" element={<ChatDiagnostico />} />
      <Route path="/chat-medico" element={<ChatMedico />} />
      <Route path="/configuracion-horario" element={<ConfiguracionHorarioMedico personal_medico_id={1} />} />
    </Routes>
  );
}

export default App;