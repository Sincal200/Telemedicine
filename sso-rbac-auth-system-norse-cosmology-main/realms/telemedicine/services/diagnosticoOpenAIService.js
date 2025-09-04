// Servicio para consultar la API de OpenAI y obtener diagnóstico basado en síntomas
import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function obtenerDiagnosticoPorSintomas(sintomas) {
  if (!OPENAI_API_KEY) throw new Error('No se ha configurado la API Key de OpenAI');
  const prompt = `Eres un médico virtual certificado. El usuario describe estos síntomas: ${sintomas}. Si la información es insuficiente, haz preguntas de seguimiento. Sugiere diagnósticos probables, explica los riesgos y recomienda acciones claras. Si es urgente, indica acudir a emergencias. Responde en español y de forma profesional. Al final, incluye: \n- Diagnóstico probable\n- Gravedad\n- Recomendaciones\n- Preguntas de seguimiento (si aplica)`;
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Eres un médico virtual certificado que responde en español y de forma profesional.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 400,
    temperature: 0.6
  };
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Error consultando OpenAI');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No se pudo obtener diagnóstico.';
}
