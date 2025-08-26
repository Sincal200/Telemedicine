// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';
/**
 * Servicio para manejar las peticiones de la API de citas
 */
class CitaService {
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
   * Busca horarios disponibles
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} filtros.especialidadId - ID de la especialidad
   * @param {string} filtros.fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} filtros.fechaFin - Fecha fin (YYYY-MM-DD)
   * @param {number} [filtros.tipoCitaId] - ID del tipo de cita (opcional)
   * @param {number} [filtros.personalMedicoId] - ID del médico específico (opcional)
   * @returns {Promise<Array>} Array de horarios disponibles
   */
  async buscarHorariosDisponibles(filtros) {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });

      const response = await fetch(
        `${this.buildUrl('/cita/horarios-disponibles')}&${params.toString()}`, 
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error buscando horarios');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error buscando horarios disponibles:', error);
      throw error;
    }
  }

  /**
   * Programa una nueva cita
   * @param {Object} datosCita - Datos de la cita
   * @returns {Promise<Object>} Cita creada
   */
  async programarCita(datosCita) {
    try {
      const response = await fetch(this.buildUrl('/cita/programar'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(datosCita)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error programando cita');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error programando cita:', error);
      throw error;
    }
  }

  /**
   * Obtiene las citas de un paciente
   * @param {number} pacienteId - ID del paciente
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Array de citas
   */
  async obtenerCitasPaciente(pacienteId, filtros = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = this.buildUrl(`/cita/paciente/${pacienteId}${queryString ? `&${queryString}` : ''}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo citas del paciente');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene las citas de un médico
   * @param {number} medicoId - ID del médico
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Array de citas
   */
  async obtenerCitasMedico(medicoId, filtros = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = this.buildUrl(`/cita/medico/${medicoId}${queryString ? `&${queryString}` : ''}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo citas del médico');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo citas del médico:', error);
      throw error;
    }
  }

  /**
   * Cancela una cita
   * @param {number} citaId - ID de la cita
   * @param {string} motivoCancelacion - Motivo de la cancelación
   * @returns {Promise<Object>} Cita actualizada
   */
  async cancelarCita(citaId, motivoCancelacion) {
    try {
      const response = await fetch(this.buildUrl(`/cita/${citaId}/cancelar`), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ motivo_cancelacion: motivoCancelacion })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cancelando cita');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error cancelando cita:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una cita específica
   * @param {number} citaId - ID de la cita
   * @returns {Promise<Object>} Detalles de la cita
   */
  async obtenerCita(citaId) {
    try {
      const response = await fetch(this.buildUrl(`/cita/${citaId}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo cita');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error obteniendo cita:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de especialidades
   * @returns {Promise<Array>} Array de especialidades
   */
  async obtenerEspecialidades() {
    try {
      const response = await fetch(this.buildUrl('/especialidades'), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo especialidades');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo especialidades:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de tipos de cita
   * @returns {Promise<Array>} Array de tipos de cita
   */
  async obtenerTiposCita() {
    try {
      const response = await fetch(this.buildUrl('/tipos-cita'), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo tipos de cita');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error obteniendo tipos de cita:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const citaService = new CitaService();
export default citaService;
