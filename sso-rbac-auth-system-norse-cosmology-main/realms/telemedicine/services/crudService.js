// Servicio CRUD genérico para cualquier modelo Sequelize

const crudService = (Model) => {
  const pkField = Model.primaryKeyAttribute || 'id';
  return {
    findAll: () => Model.findAll(),
    findById: (id) => Model.findByPk(id),
    create: (data) => Model.create(data),
    update: (id, data) => Model.update(data, { where: { [pkField]: id } }),
    delete: (id) => Model.destroy({ where: { [pkField]: id } })
  };
};

export default crudService;

