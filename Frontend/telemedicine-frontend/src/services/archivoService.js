// Configuración de URLs
let API_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:8081/api/telemedicine/archivo';
if (!API_URL.endsWith('/archivo')) {
  API_URL = API_URL.replace(/\/?$/, '/archivo');
}

// URL base para el endpoint de descarga segura (usar API Gateway)
const RECETAS_API_URL = 'http://localhost:8081';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';

function getHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

function getAuthHeaders() {
  const token = sessionStorage.getItem('accessToken');
  return {
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

const archivoService = {
  async obtenerRecetasPorPacienteId(pacienteId) {
    const url = `http://localhost:8081/api/telemedicine/archivo?paciente_id=${pacienteId}&tipo_archivo=Receta&tenant=${TENANT}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error obteniendo recetas');
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Descarga segura de una receta médica
   * @param {number} idArchivo - ID del archivo de receta
   * @param {string} nombreArchivo - Nombre del archivo para la descarga
   */
  async descargarReceta(idArchivo, nombreArchivo) {
    try {
      const response = await fetch(`${RECETAS_API_URL}/api/telemedicine/recetas/${idArchivo}?tenant=${TENANT}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No está autenticado');
        } else if (response.status === 403) {
          throw new Error('No tiene permisos para descargar este archivo');
        } else if (response.status === 404) {
          throw new Error('Archivo no encontrado');
        } else {
          throw new Error('Error al descargar el archivo');
        }
      }

      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento temporal para iniciar la descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo || `receta_${idArchivo}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error descargando receta:', error);
      throw error;
    }
  }
};

export default archivoService;