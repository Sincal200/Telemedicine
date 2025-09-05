const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';

const consultaDetalleService = {
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

  /**
   * Obtiene los detalles completos de una consulta incluyendo signos vitales
   * @param {number} consultaId - ID de la consulta
   */
  async obtenerDetalleConsulta(consultaId) {
    try {
      // Obtener datos de la consulta
      const responseConsulta = await fetch(this.buildUrl(`/consulta/${consultaId}`), {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!responseConsulta.ok) throw new Error('Error obteniendo consulta');
      const consulta = await responseConsulta.json();

      // Obtener signos vitales asociados
      let signosVitales = null;
      try {
        const responseSignos = await fetch(this.buildUrl(`/signos-vitales?consulta_id=${consultaId}`), {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (responseSignos.ok) {
          const signosData = await responseSignos.json();
          signosVitales = signosData.data && signosData.data.length > 0 ? signosData.data[0] : null;
        }
      } catch (error) {
        console.warn('No se pudieron cargar los signos vitales:', error);
      }

      return {
        consulta: consulta.data,
        signosVitales
      };
    } catch (error) {
      console.error('Error obteniendo detalle de consulta:', error);
      throw error;
    }
  },

  /**
   * Obtiene información de múltiples consultas de forma eficiente
   * @param {number[]} consultaIds - Array de IDs de consultas
   */
  async obtenerDetallesConsultas(consultaIds) {
    const detalles = {};
    
    // Procesar en lotes para evitar demasiadas peticiones simultáneas
    const batchSize = 5;
    for (let i = 0; i < consultaIds.length; i += batchSize) {
      const batch = consultaIds.slice(i, i + batchSize);
      const promises = batch.map(async (id) => {
        try {
          const detalle = await this.obtenerDetalleConsulta(id);
          return { id, detalle };
        } catch (error) {
          console.warn(`Error obteniendo consulta ${id}:`, error);
          return { id, detalle: null };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ id, detalle }) => {
        detalles[id] = detalle;
      });
    }
    
    return detalles;
  }
};

export default consultaDetalleService;
