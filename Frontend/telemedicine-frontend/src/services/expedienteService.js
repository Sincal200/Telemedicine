
const API_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8093/expediente';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';

const expedienteService = {
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

  async obtenerExpedientePorPacienteId(idPaciente) {
    // Construye la URL igual que el curl que funciona
    const url = `${API_URL}/expediente/pacientes/${idPaciente}/expediente?tenant=${TENANT}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Error obteniendo expediente');
    return await res.json();
  }
};

export default expedienteService;
