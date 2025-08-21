import db from '../models/index.js';
const { Sexo } = db;

const sexoService = {
  getAllSexos: () => Sexo.findAll(),
  getSexoById: (id) => Sexo.findByPk(id),
  createSexo: (data) => Sexo.create(data)
};

export default sexoService;
