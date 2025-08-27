// Servicio para manejar las peticiones de la API de consultas
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

class ConsultaService {
  constructor() {
    this.tenant = 'telemedicine';
  }

  getAuthToken() {
    return sessionStorage.getItem('accessToken');
  }

  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
    };
  }

  buildUrl(endpoint) {
    // Si el endpoint ya tiene '?', usa &tenant=...; si no, usa ?tenant=...
    const sep = endpoint.includes('?') ? '&' : '?';
    return `${API_BASE_URL}${endpoint}${sep}tenant=${this.tenant}`;
  }

  async obtenerConsultaPorCitaId(citaId) {
    // Busca la consulta asociada a una cita
    const response = await fetch(this.buildUrl(`/consulta?cita_id=${citaId}`), {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error obteniendo consulta');
    const data = await response.json();
    // Puede devolver un array, tomar la primera
    return Array.isArray(data.data) ? data.data[0] : data.data;
  }

  async crearConsulta(datos) {
    const response = await fetch(this.buildUrl('/consulta'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error creando consulta');
    const data = await response.json();
    return data.data;
  }

  async actualizarConsulta(idConsulta, datos) {
    const response = await fetch(this.buildUrl(`/consulta/${idConsulta}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error actualizando consulta');
    const data = await response.json();
    return data.data;
  }
}

const consultaService = new ConsultaService();
export default consultaService;
