/**
 * Activa o desactiva un usuario en Keycloak
 * @param {string} userId - ID de usuario en Keycloak
 * @param {boolean} enabled - true para activar, false para desactivar
 */
async function updateUserEnabled(userId, enabled) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';
  // Usa el token admin guardado en sessionStorage
  const adminToken = sessionStorage.getItem('adminAccessToken');
  if (!adminToken) throw new Error('No se encontró el token admin en sessionStorage');
  const authHeader = `Bearer ${adminToken}`;
  const res = await fetch(`${API_URL}/update-user?tenant=${TENANT}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({ userId, updateData: { enabled } })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error actualizando usuario en Keycloak');
  }
  return res.json();
}
// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

/**
 * Servicio para manejar las peticiones de la API de solicitudes de rol
 */
class SolicitudRolService {
  /**
   * Solicita token client-credentials al backend (que reexporta a Keycloak)
   * @param {{client_id:string, client_secret:string}} body
   */
  async getClientCredentialsToken(body) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';
    const res = await fetch(`${API_URL}/api/auth/client-credentials-token?tenant=${TENANT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error obteniendo token de cliente');
    }
    return res.json();
  }
  /**
   * Activa o desactiva un usuario en Keycloak
   * @param {string} userId - ID de usuario en Keycloak
   * @param {boolean} enabled - true para activar, false para desactivar
   */
  async updateUserEnabled(userId, enabled) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';
    // Usa el token admin guardado en sessionStorage
    const adminToken = sessionStorage.getItem('adminAccessToken');
    if (!adminToken) throw new Error('No se encontró el token admin en sessionStorage');
    const authHeader = `Bearer ${adminToken}`;
    const res = await fetch(`${API_URL}/api/auth/update-user?tenant=${TENANT}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ userId, updateData: { enabled } })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error actualizando usuario en Keycloak');
    }
    return res.json();
  }
  constructor() {
    this.tenant = 'telemedicine';
  }

  /**
   * Obtiene el token de autenticación
   */
  getAuthToken() {
    return sessionStorage.getItem('accessToken');
  }

  /**
   * Construye headers para las peticiones
   */
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
    };
  }

  /**
   * Construye la URL con tenant
   */
  buildUrl(endpoint) {
    return `${API_BASE_URL}${endpoint}?tenant=${this.tenant}`;
  }

  /**
   * Obtiene todas las solicitudes de rol con filtros
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} filtros.page - Página actual
   * @param {number} filtros.limit - Elementos por página
   * @param {string} [filtros.estado] - Estado de la solicitud
   * @returns {Promise<Object>} Datos paginados de solicitudes
   */
  async obtenerSolicitudes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await fetch(
        `${this.buildUrl('/solicitud-rol')}&${params.toString()}`, 
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo solicitudes');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de las solicitudes de rol
   * @returns {Promise<Object>} Estadísticas del sistema
   */
  async obtenerEstadisticas() {
    try {
      const response = await fetch(this.buildUrl('/solicitud-rol/estadisticas'), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo estadísticas');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Aprueba una solicitud de rol
   * @param {number} solicitudId - ID de la solicitud
   * @returns {Promise<Object>} Solicitud actualizada
   */
  async aprobarSolicitud(solicitudId) {
    try {
      const response = await fetch(this.buildUrl(`/solicitud-rol/${solicitudId}/aprobar`), {
        method: 'PUT',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error aprobando solicitud');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      throw error;
    }
  }

  /**
   * Rechaza una solicitud de rol
   * @param {number} solicitudId - ID de la solicitud
   * @param {string} motivoRechazo - Motivo del rechazo
   * @returns {Promise<Object>} Solicitud actualizada
   */
  async rechazarSolicitud(solicitudId, motivoRechazo) {
    try {
      const response = await fetch(this.buildUrl(`/solicitud-rol/${solicitudId}/rechazar`), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ comentarios_revision: motivoRechazo })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error rechazando solicitud');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      throw error;
    }
  }

  /**
   * Marca una solicitud como en revisión
   * @param {number} solicitudId - ID de la solicitud
   * @returns {Promise<Object>} Solicitud actualizada
   */
  async marcarEnRevision(solicitudId) {
    try {
      const response = await fetch(this.buildUrl(`/solicitud-rol/${solicitudId}/en-revision`), {
        method: 'PUT',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error marcando solicitud en revisión');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marcando solicitud en revisión:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una solicitud específica
   * @param {number} solicitudId - ID de la solicitud
   * @returns {Promise<Object>} Detalles de la solicitud
   */
  async obtenerSolicitud(solicitudId) {
    try {
      const response = await fetch(this.buildUrl(`/solicitud-rol/${solicitudId}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo solicitud');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const solicitudRolService = new SolicitudRolService();
export default solicitudRolService;
