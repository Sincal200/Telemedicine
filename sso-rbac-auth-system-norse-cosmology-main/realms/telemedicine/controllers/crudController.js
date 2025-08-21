// Controlador CRUD genérico para cualquier modelo Sequelize
const crudController = (Model) => ({
  getAll: async (req, res, next) => {
    try {
      const items = await Model.findAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'No encontrado' });
      res.json(item);
    } catch (error) {
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const newItem = await Model.create(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const [updated] = await Model.update(req.body, { where: { id: req.params.id } });
      if (!updated) return res.status(404).json({ message: 'No encontrado' });
      const updatedItem = await Model.findByPk(req.params.id);
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const deleted = await Model.destroy({ where: { id: req.params.id } });
      if (!deleted) return res.status(404).json({ message: 'No encontrado' });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
});

export default crudController;

