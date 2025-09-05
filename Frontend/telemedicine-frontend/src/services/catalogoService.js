// Servicio para obtener datos de catálogos (sexo, departamentos, etc.)

const API_URL = import.meta.env.VITE_API_URL_1 || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';

class CatalogoService {
  getBaseHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Obtiene todas las opciones de sexo activas
   */
  async obtenerSexos() {
    try {
      const response = await fetch(`${API_URL}/sexo?tenant=${TENANT}`, {
        method: 'GET',
        headers: this.getBaseHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener opciones de sexo');
      }

      const data = await response.json();
      
      // Filtrar solo los activos y ordenar por idSexo
      return data.filter(sexo => sexo.activo)
                 .sort((a, b) => a.idSexo - b.idSexo);

    } catch (error) {
      console.error('Error en obtenerSexos:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las especialidades activas
   */
  async obtenerEspecialidades() {
    try {
      const response = await fetch(`${API_URL}/especialidades?tenant=${TENANT}`, {
        method: 'GET',
        headers: this.getBaseHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener especialidades');
      }

      const data = await response.json();
      
      return data.filter(esp => esp.activo)
                 .sort((a, b) => a.nombre.localeCompare(b.nombre));

    } catch (error) {
      console.error('Error en obtenerEspecialidades:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los departamentos activos
   */
  async obtenerDepartamentos() {
    try {
      const response = await fetch(`${API_URL}/departamento?tenant=${TENANT}`, {
        method: 'GET',
        headers: this.getBaseHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener departamentos');
      }

      const data = await response.json();
      
      return data.filter(dep => dep.activo)
                 .sort((a, b) => a.nombre.localeCompare(b.nombre));

    } catch (error) {
      console.error('Error en obtenerDepartamentos:', error);
      throw error;
    }
  }
}

const catalogoService = new CatalogoService();
export default catalogoService;
