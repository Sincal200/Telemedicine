// Servicio para obtener y actualizar datos médicos del paciente
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

const pacienteService = {
  async getPaciente(idPaciente) {
    const res = await fetch(`${API_BASE_URL}/paciente/${idPaciente}?tenant=telemedicine`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo datos de paciente');
    const data = await res.json();
    return data.data;
  },
  async updatePaciente(idPaciente, payload) {
    const res = await fetch(`${API_BASE_URL}/paciente/${idPaciente}?tenant=telemedicine`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error actualizando datos médicos');
    }
    const data = await res.json();
    return data.data;
  }
};

export default pacienteService;
