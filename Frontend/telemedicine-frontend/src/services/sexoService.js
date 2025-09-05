// Servicio simple para manejar datos de Sexo
// Como no podemos hacer llamadas a la API por el API Gateway en registro,
// usamos valores fijos que coinciden con la BD

class SexoService {
  // Opciones fijas que coinciden con la BD
  static OPCIONES_SEXO = [
    { id: 1, descripcion: 'Masculino' },
    { id: 2, descripcion: 'Femenino' },
    { id: 3, descripcion: 'Otro' }
  ];

  /**
   * Obtiene la descripción del sexo por ID
   * @param {number} sexoId - ID del sexo
   * @returns {string} Descripción del sexo
   */
  static obtenerDescripcionPorId(sexoId) {
    const sexo = this.OPCIONES_SEXO.find(s => s.id === sexoId);
    return sexo ? sexo.descripcion : 'No especificado';
  }

  /**
   * Obtiene todas las opciones de sexo
   * @returns {Array} Array con todas las opciones
   */
  static obtenerOpciones() {
    return this.OPCIONES_SEXO;
  }

  /**
   * Valida si un ID de sexo es válido
   * @param {number} sexoId - ID del sexo
   * @returns {boolean} True si es válido
   */
  static esIdValido(sexoId) {
    return this.OPCIONES_SEXO.some(s => s.id === sexoId);
  }
}

export default SexoService;
