import express from 'express';
import { obtenerDiagnosticoPorSintomas } from '../services/diagnosticoOpenAIService.js';

const router = express.Router();

// POST /diagnostico-openai
router.post('/', async (req, res) => {
  const { sintomas } = req.body;
  if (!sintomas || typeof sintomas !== 'string') {
    return res.status(400).json({ success: false, error: 'Debes enviar los síntomas como texto.' });
  }
  try {
    const respuesta = await obtenerDiagnosticoPorSintomas(sintomas);
    res.json({ success: true, diagnostico: respuesta });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
