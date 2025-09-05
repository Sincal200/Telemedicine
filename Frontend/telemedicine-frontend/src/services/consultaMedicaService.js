// Servicio para consultas médicas profesionales (doctores)
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getAuthToken() {
  return sessionStorage.getItem('accessToken');
}

function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

export async function consultaMedicaProfesional(consulta, contexto = '') {
  const res = await fetch(`${API_BASE_URL}/consulta-medica-ai/consulta-profesional?tenant=telemedicine`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ consulta, contexto })
  });
  const data = await res.json();
  return data;
}

export async function buscarInformacionEnfermedad(enfermedad, aspectoEspecifico = '') {
  const res = await fetch(`${API_BASE_URL}/consulta-medica-ai/informacion-enfermedad?tenant=telemedicine`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ enfermedad, aspectoEspecifico })
  });
  const data = await res.json();
  return data;
}

export async function analizarCasoClinico(descripcionCaso, preguntaEspecifica = '') {
  const res = await fetch(`${API_BASE_URL}/consulta-medica-ai/analisis-caso?tenant=telemedicine`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ descripcionCaso, preguntaEspecifica })
  });
  const data = await res.json();
  return data;
}
