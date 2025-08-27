// Controlador CRUD genérico para cualquier modelo Sequelize
const crudController = (Model) => ({
  getAll: async (req, res, next) => {
    try {
      const items = await Model.findAll();
      res.json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      next(error);
    }
  },
  getById: async (req, res, next) => {
    try {
      // Usar el campo primario del modelo
      const pkField = Model.primaryKeyAttribute || 'id';
      const where = { [pkField]: req.params.id };
      const item = await Model.findOne({ where });
      if (!item) return res.status(404).json({ 
        success: false, 
        error: 'No encontrado' 
      });
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const newItem = await Model.create(req.body);
      res.status(201).json({
        success: true,
        data: newItem,
        message: 'Creado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const pkField = Model.primaryKeyAttribute || 'id';
      const where = { [pkField]: req.params.id };
      const [updated] = await Model.update(req.body, { where });
      if (!updated) return res.status(404).json({ 
        success: false,
        error: 'No encontrado' 
      });
      const updatedItem = await Model.findOne({ where });
      res.json({
        success: true,
        data: updatedItem,
        message: 'Actualizado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const pkField = Model.primaryKeyAttribute || 'id';
      const where = { [pkField]: req.params.id };
      const deleted = await Model.destroy({ where });
      if (!deleted) return res.status(404).json({ 
        success: false,
        error: 'No encontrado' 
      });
      res.json({
        success: true,
        message: 'Eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
});

export default crudController;

