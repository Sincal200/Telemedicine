// Servicio para crear una nueva dirección
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

const direccionService = {
  async crearDireccion({ departamento_id, municipio_id, aldea_id, direccion_completa = '', zona = '', referencia = '' }) {
    const res = await fetch(`${API_BASE_URL}/direccion?tenant=telemedicine`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        departamento_id,
        municipio_id,
        aldea_id,
        direccion_completa,
        zona,
        referencia
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error creando dirección');
    }
    const data = await res.json();
    return data.data;
  },
  async actualizarDireccion(idDireccion, data) {
    const res = await fetch(`${API_BASE_URL}/direccion/${idDireccion}?tenant=telemedicine`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error actualizando dirección');
    }
    const resData = await res.json();
    return resData.data;
  }
};

export default direccionService;
