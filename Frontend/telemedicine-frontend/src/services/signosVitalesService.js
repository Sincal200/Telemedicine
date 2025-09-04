const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';

const signosVitalesService = {
  getAuthToken() {
    return sessionStorage.getItem('accessToken');
  },

  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
    };
  },

  buildUrl(endpoint) {
    const sep = endpoint.includes('?') ? '&' : '?';
    return `${API_BASE_URL}${endpoint}${sep}tenant=${TENANT}`;
  },

  async crearSignosVitales(data) {
    const response = await fetch(this.buildUrl('/signos-vitales'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error creando signos vitales');
    const res = await response.json();
    return res.data;
  },

  async actualizarSignosVitales(id, data) {
    const response = await fetch(this.buildUrl(`/signos-vitales/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error actualizando signos vitales');
    const res = await response.json();
    return res.data;
  },

  async obtenerPorConsulta(consultaId) {
    const response = await fetch(this.buildUrl(`/signos-vitales?consulta_id=${consultaId}`), {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error obteniendo signos vitales');
    const res = await response.json();
    return res.data;
  }
};

export default signosVitalesService;
