// Servicio CRUD genérico para cualquier modelo Sequelize
const crudService = (Model) => ({
  findAll: () => Model.findAll(),
  findById: (id) => Model.findByPk(id),
  create: (data) => Model.create(data),
  update: (id, data) => Model.update(data, { where: { id } }),
  delete: (id) => Model.destroy({ where: { id } })
});

export default crudService;

