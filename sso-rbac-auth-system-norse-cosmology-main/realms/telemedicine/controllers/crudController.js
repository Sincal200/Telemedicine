// Controlador CRUD genérico para cualquier modelo Sequelize
const crudController = (Model) => ({
  getAll: async (req, res, next) => {
    try {
      // Permite filtrar solo por campos válidos del modelo (ignora params extra como tenant)
      const where = {};
      const validFields = Object.keys(Model.rawAttributes);
      Object.keys(req.query).forEach(key => {
        if (validFields.includes(key) && req.query[key] !== undefined && req.query[key] !== '') {
          where[key] = req.query[key];
        }
      });
      const items = await Model.findAll(Object.keys(where).length ? { where } : undefined);
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
      let body = { ...req.body };
      const pkField = Model.primaryKeyAttribute || 'id';
      // Si el campo primario no viene en el body, generarlo automáticamente
      if ((body[pkField] === undefined || body[pkField] === null)) {
        // Detectar tipo INTEGER (solo para modelos con clave primaria numérica)
        const attr = Model.rawAttributes[pkField];
        if (attr && (attr.type.key === 'INTEGER' || attr.type.key === 'BIGINT')) {
          // Generar un número único de máximo 10 dígitos
          // Ejemplo: 1XXXXXXX (timestamp en segundos + random de 3 dígitos)
          const base = Math.floor(Date.now() / 1000); // timestamp en segundos (10 dígitos en 2025)
          const rand = Math.floor(Math.random() * 1000); // 3 dígitos
          // Si base ya tiene 10 dígitos, úsalo tal cual, si no, concatena
          let idNum = base;
          if (String(base).length < 10) {
            idNum = Number(String(base) + String(rand).padStart(3, '0')).toString().slice(0, 10);
          }
          body[pkField] = Number(idNum);
        } else {
          // Si no es numérico, fallback a UUID string
          import('uuid').then(({ v4 }) => {
            body[pkField] = v4();
            Model.create(body).then(newItem => {
              res.status(201).json({
                success: true,
                data: newItem,
                message: 'Creado exitosamente'
              });
            }).catch(error => next(error));
          });
          return;
        }
      }
      const newItem = await Model.create(body);
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

