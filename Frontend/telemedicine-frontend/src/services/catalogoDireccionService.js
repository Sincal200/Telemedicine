// Servicios para obtener catálogos de dirección
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

const catalogoDireccionService = {
  async getDepartamentos() {
    const res = await fetch(`${API_BASE_URL}/departamento?tenant=telemedicine`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo departamentos');
    const data = await res.json();
    return data.data;
  },
  async getMunicipios(departamento_id) {
    const res = await fetch(`${API_BASE_URL}/municipio?tenant=telemedicine&departamento_id=${departamento_id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo municipios');
    const data = await res.json();
    return data.data;
  },
  async getAldeas(municipio_id) {
    const res = await fetch(`${API_BASE_URL}/aldea?tenant=telemedicine&municipio_id=${municipio_id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo aldeas');
    const data = await res.json();
    return data.data;
  }
};

export default catalogoDireccionService;
