// Servicio para obtener y actualizar la especialidad del doctor
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

const especialidadService = {
  async getEspecialidades() {
    try {
      const res = await fetch(`${API_BASE_URL}/especialidades?tenant=telemedicine`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        throw new Error('Error obteniendo especialidades');
      }
      const data = await res.json();
      // Si la respuesta es un array directamente, retorna data
      if (Array.isArray(data)) return data;
      // Si la respuesta tiene .data, retorna data.data
      if (data && Array.isArray(data.data)) return data.data;
      // Si no, retorna vacío
      return [];
    } catch (e) {
  // ...sin log de depuración...
      return [];
    }
  },
  async getPersonalMedico(idPersonalMedico) {
  const res = await fetch(`${API_BASE_URL}/personal-medico/${idPersonalMedico}?tenant=telemedicine`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo datos de médico');
    const data = await res.json();
    return data.data;
  },
  async updateEspecialidad(idPersonalMedico, especialidad_id) {
  const res = await fetch(`${API_BASE_URL}/personal-medico/${idPersonalMedico}?tenant=telemedicine`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ especialidad_id })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error actualizando especialidad');
    }
    const data = await res.json();
    return data.data;
  }
};

export default especialidadService;
