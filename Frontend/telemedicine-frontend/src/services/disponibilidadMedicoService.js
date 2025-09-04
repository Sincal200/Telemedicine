// Servicio para consumir la disponibilidad de los médicos
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

export async function getDisponibilidadMedico(personal_medico_id) {
  const res = await fetch(`${API_BASE_URL}/disponibilidad-personal-medico?personal_medico_id=${personal_medico_id}&tenant=telemedicine`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error obteniendo disponibilidad');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

export async function crearDisponibilidadMedico(payload) {
  const res = await fetch(`${API_BASE_URL}/disponibilidad-personal-medico?tenant=telemedicine`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error creando disponibilidad');
  return await res.json();
}

export async function actualizarDisponibilidadMedico(idDisponibilidad, payload) {
  const res = await fetch(`${API_BASE_URL}/disponibilidad-personal-medico/${idDisponibilidad}?tenant=telemedicine`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error actualizando disponibilidad');
  return await res.json();
}

export async function eliminarDisponibilidadMedico(idDisponibilidad) {
  const res = await fetch(`${API_BASE_URL}/disponibilidad-personal-medico/${idDisponibilidad}?tenant=telemedicine`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error eliminando disponibilidad');
  return await res.json();
}
