import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Video from './pages/Video.jsx';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard.jsx';
import GestionCitas from './pages/GestionCitas.jsx';
import GestionSolicitudesRol from './pages/GestionSolicitudesRol.jsx';
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
    </Routes>
  );
}

export default App;