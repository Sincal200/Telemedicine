import sexoService from '../services/sexoService.js';

async function getAllSexos(req, res, next) {
    try {
        const sexos = await sexoService.getAllSexos();
        res.json(sexos);
    } catch (error) {
        next(error);
    }
}

async function getSexoById(req, res, next) {
    try {
        const sexo = await sexoService.getSexoById(req.params.id);
        if (!sexo) return res.status(404).json({ message: 'Sexo no encontrado' });
        res.json(sexo);
    } catch (error) {
        next(error);
    }
}

async function createSexo(req, res, next) {
    try {
        const nuevoSexo = await sexoService.createSexo(req.body);
        res.status(201).json(nuevoSexo);
    } catch (error) {
        next(error);
    }
}

const sexoController = {
    getAllSexos,
    getSexoById,
    createSexo
};

export default sexoController;
