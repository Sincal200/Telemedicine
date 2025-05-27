import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Video from './pages/Video.jsx';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard.jsx';
import './App.css'

function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/home" element={<Home />} />
        <Route path="/video" element={<Video />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App
