import express from 'express';
import { 
  consultaMedicaProfesional, 
  buscarInformacionEnfermedad, 
  analizarCasoClinico 
} from '../services/consultaMedicaOpenAIService.js';

const router = express.Router();

// POST /consulta-medica-profesional
router.post('/consulta-profesional', async (req, res) => {
  const { consulta, contexto } = req.body;
  
  if (!consulta || typeof consulta !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes enviar la consulta médica como texto.' 
    });
  }

  try {
    const respuesta = await consultaMedicaProfesional(consulta, contexto);
    res.json({ 
      success: true, 
      respuesta: respuesta,
      tipo: 'consulta-profesional'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /informacion-enfermedad
router.post('/informacion-enfermedad', async (req, res) => {
  const { enfermedad, aspectoEspecifico } = req.body;
  
  if (!enfermedad || typeof enfermedad !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes especificar la enfermedad a consultar.' 
    });
  }

  try {
    const respuesta = await buscarInformacionEnfermedad(enfermedad, aspectoEspecifico);
    res.json({ 
      success: true, 
      respuesta: respuesta,
      tipo: 'informacion-enfermedad'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /analisis-caso-clinico
router.post('/analisis-caso', async (req, res) => {
  const { descripcionCaso, preguntaEspecifica } = req.body;
  
  if (!descripcionCaso || typeof descripcionCaso !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Debes proporcionar la descripción del caso clínico.' 
    });
  }

  try {
    const respuesta = await analizarCasoClinico(descripcionCaso, preguntaEspecifica);
    res.json({ 
      success: true, 
      respuesta: respuesta,
      tipo: 'analisis-caso'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
