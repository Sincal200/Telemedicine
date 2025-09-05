// Servicio simple para manejar tipos de documento
// Como no podemos hacer llamadas a la API por el API Gateway en registro,
// usamos valores fijos que coinciden con la BD

class TipoDocumentoService {
  // Opciones fijas que coinciden con la BD (solo las que vamos a usar)
  static OPCIONES_TIPO_DOCUMENTO = [
    { id: 1, codigo: 'DPI', nombre: 'DPI', descripcion: 'Documento Personal de Identificación' },
    { id: 2, codigo: 'PASAPORTE', nombre: 'Pasaporte', descripcion: 'Pasaporte' }
  ];

  /**
   * Obtiene la descripción del tipo de documento por ID
   * @param {number} tipoId - ID del tipo de documento
   * @returns {string} Descripción del tipo de documento
   */
  static obtenerDescripcionPorId(tipoId) {
    const tipo = this.OPCIONES_TIPO_DOCUMENTO.find(t => t.id === tipoId);
    return tipo ? tipo.descripcion : 'No especificado';
  }

  /**
   * Obtiene el código del tipo de documento por ID
   * @param {number} tipoId - ID del tipo de documento
   * @returns {string} Código del tipo de documento
   */
  static obtenerCodigoPorId(tipoId) {
    const tipo = this.OPCIONES_TIPO_DOCUMENTO.find(t => t.id === tipoId);
    return tipo ? tipo.codigo : 'N/A';
  }

  /**
   * Obtiene todas las opciones de tipos de documento
   * @returns {Array} Array con todas las opciones
   */
  static obtenerOpciones() {
    return this.OPCIONES_TIPO_DOCUMENTO;
  }

  /**
   * Valida si un ID de tipo de documento es válido
   * @param {number} tipoId - ID del tipo de documento
   * @returns {boolean} True si es válido
   */
  static esIdValido(tipoId) {
    return this.OPCIONES_TIPO_DOCUMENTO.some(t => t.id === tipoId);
  }

  /**
   * Obtiene el nombre para mostrar en selects (código - descripción)
   * @param {number} tipoId - ID del tipo de documento
   * @returns {string} Texto para mostrar
   */
  static obtenerTextoCompleto(tipoId) {
    const tipo = this.OPCIONES_TIPO_DOCUMENTO.find(t => t.id === tipoId);
    return tipo ? `${tipo.codigo} - ${tipo.descripcion}` : 'No especificado';
  }
}

export default TipoDocumentoService;
