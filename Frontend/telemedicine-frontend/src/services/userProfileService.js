// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';


/**
 * Servicio para manejar información del usuario y su perfil
 */
class UserProfileService {
  constructor() {
    this.tenant = 'telemedicine';
  }

  /**
   * Actualiza los datos de la persona
   * @param {number} idPersona
   * @param {object} data
   * @returns {Promise<object>}
   */

  async actualizarPersona(idPersona, data) {
    const response = await fetch(this.buildUrl(`/persona/${idPersona}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error actualizando persona');
    }
    const resData = await response.json();
    // Actualizar cache local si es necesario
    this.limpiarCache();
    return resData.data;
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
   * Obtiene información del usuario desde el token JWT
   */
  getTokenInfo() {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Obtiene el perfil completo del usuario desde la base de datos
   * @returns {Promise<Object>} Información completa del usuario
   */
  async obtenerPerfilCompleto() {
    try {
      const tokenInfo = this.getTokenInfo();
      if (!tokenInfo || !tokenInfo.sub) {
        throw new Error('No hay información de usuario en el token');
      }

      const keycloak_user_id = tokenInfo.sub;

      const response = await fetch(this.buildUrl(`/registro/perfil/${keycloak_user_id}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuario no encontrado en la base de datos');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo perfil de usuario');
      }

      const data = await response.json();
      
      // Guardar información en sessionStorage para uso rápido
      sessionStorage.setItem('userProfile', JSON.stringify(data.data));
      
      return data.data;
    } catch (error) {
      console.error('Error obteniendo perfil completo:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del usuario desde sessionStorage (cache)
   * @returns {Object|null} Información del usuario en cache
   */
  obtenerPerfilCache() {
    try {
      const profile = sessionStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error obteniendo perfil del cache:', error);
      return null;
    }
  }

  /**
   * Obtiene el ID del paciente si el usuario es paciente
   * @returns {Promise<number|null>} ID del paciente o null
   */
  async obtenerIdPaciente() {
    try {
      const perfil = await this.obtenerPerfilCompleto();
      return perfil.esPaciente ? perfil.idPaciente : null;
    } catch (error) {
      console.error('Error obteniendo ID de paciente:', error);
      return null;
    }
  }

  /**
   * Obtiene el ID del personal médico si el usuario es médico
   * @returns {Promise<number|null>} ID del personal médico o null
   */
  async obtenerIdPersonalMedico() {
    try {
      const perfil = await this.obtenerPerfilCompleto();
      return perfil.esMedico ? perfil.idPersonalMedico : null;
    } catch (error) {
      console.error('Error obteniendo ID de personal médico:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario está aprobado para usar el sistema
   * @returns {Promise<boolean>} True si está aprobado
   */
  async verificarEstadoAprobacion() {
    try {
      const perfil = await this.obtenerPerfilCompleto();
      return perfil.estado_aprobacion === 'aprobado';
    } catch (error) {
      console.error('Error verificando estado de aprobación:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado del registro del usuario
   * @returns {Promise<Object>} Estado del registro y solicitudes
   */
  async obtenerEstadoRegistro() {
    try {
      const tokenInfo = this.getTokenInfo();
      if (!tokenInfo || !tokenInfo.sub) {
        throw new Error('No hay información de usuario en el token');
      }

      const keycloak_user_id = tokenInfo.sub;

      const response = await fetch(this.buildUrl(`/registro/estado/${keycloak_user_id}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo estado de registro');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error obteniendo estado de registro:', error);
      throw error;
    }
  }

  /**
   * Limpia el cache del perfil de usuario
   */
  limpiarCache() {
    sessionStorage.removeItem('userProfile');
  }

  /**
   * Obtiene información básica del usuario para mostrar en la UI
   * @returns {Promise<Object>} Información básica del usuario
   */
  async obtenerInfoBasica() {
    try {
      // Intentar primero desde cache
      let perfil = this.obtenerPerfilCache();
      
      // Si no hay cache, obtener desde API
      if (!perfil) {
        perfil = await this.obtenerPerfilCompleto();
      }

      if (!perfil) {
        // Fallback a información del token
        const tokenInfo = this.getTokenInfo();
        let fallbackRole = 'patient';
        
        if (tokenInfo?.realm_access?.roles?.includes('admin')) {
          fallbackRole = 'admin';
        } else if (tokenInfo?.realm_access?.roles?.includes('doctor')) {
          fallbackRole = 'doctor';
        }
        
        return {
          name: tokenInfo?.name || 'Usuario',
          email: tokenInfo?.email || '',
          role: fallbackRole,
          id: null,
          estado_aprobacion: 'desconocido',
          aprobado: false
        };
      }

      // Determinar el rol del usuario
      let userRole = 'user';
      if (perfil.esMedico) {
        userRole = 'doctor';
      } else if (perfil.esPaciente) {
        userRole = 'patient';
      }
      
      // Verificar si es admin desde el token
      const tokenInfo = this.getTokenInfo();
      if (tokenInfo?.realm_access?.roles?.includes('admin')) {
        userRole = 'admin';
      }

      return {
        name: `${perfil.persona?.nombres} ${perfil.persona?.apellidos}`,
        email: perfil.persona?.email || '',
        role: userRole,
        id: perfil.esPaciente ? perfil.idPaciente : perfil.idPersonalMedico,
        estado_aprobacion: perfil.estado_aprobacion,
        aprobado: perfil.estado_aprobacion === 'aprobado'
      };
    } catch (error) {
      console.error('Error obteniendo información básica:', error);
      
      // Fallback a información del token
      const tokenInfo = this.getTokenInfo();
      let fallbackRole = 'patient';
      
      if (tokenInfo?.realm_access?.roles?.includes('admin')) {
        fallbackRole = 'admin';
      } else if (tokenInfo?.realm_access?.roles?.includes('doctor')) {
        fallbackRole = 'doctor';
      }
      
      return {
        name: tokenInfo?.name || 'Usuario',
        email: tokenInfo?.email || '',
        role: fallbackRole,
        id: null,
        estado_aprobacion: 'desconocido',
        aprobado: false
      };
    }
  }
}

// Exportar instancia singleton
const userProfileService = new UserProfileService();
export default userProfileService;
