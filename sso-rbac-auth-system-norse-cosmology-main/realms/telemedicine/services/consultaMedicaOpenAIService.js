// Servicio especializado para consultas médicas profesionales (doctores)
import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function consultaMedicaProfesional(consulta, contexto = '') {
  if (!OPENAI_API_KEY) throw new Error('No se ha configurado la API Key de OpenAI');
  
  const prompt = `Consulta médica: ${consulta}${contexto ? `\nContexto: ${contexto}` : ''}
  
Responde como especialista médico con: diagnósticos diferenciales, protocolo tratamiento, estudios complementarios y guías clínicas relevantes.`;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'Eres un especialista médico. Responde con terminología profesional, diagnósticos diferenciales y evidencia científica. Respuestas concisas y estructuradas.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.3
  };

  const response1 = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response1.ok) throw new Error('Error consultando OpenAI');
  const data1 = await response1.json();
  return data1.choices?.[0]?.message?.content || 'No se pudo obtener respuesta médica.';
}

export async function buscarInformacionEnfermedad(enfermedad, aspectoEspecifico = '') {
  if (!OPENAI_API_KEY) throw new Error('No se ha configurado la API Key de OpenAI');
  
  const prompt = `Enfermedad: ${enfermedad}${aspectoEspecifico ? `\nAspecto: ${aspectoEspecifico}` : ''}
  
Incluye: fisiopatología, clínica, diagnóstico, tratamiento, pronóstico y complicaciones.`;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'Especialista médico. Información concisa basada en evidencia y guías clínicas actuales.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 900,
    temperature: 0.2
  };

  const response2 = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response2.ok) throw new Error('Error consultando OpenAI');
  const data2 = await response2.json();
  return data2.choices?.[0]?.message?.content || 'No se pudo obtener información médica.';
}

export async function analizarCasoClinico(descripcionCaso, preguntaEspecifica = '') {
  if (!OPENAI_API_KEY) throw new Error('No se ha configurado la API Key de OpenAI');
  
  const prompt = `Caso: ${descripcionCaso}${preguntaEspecifica ? `\nPregunta: ${preguntaEspecifica}` : ''}
  
Análisis: diagnósticos diferenciales, plan diagnóstico, tratamiento inicial, seguimiento.`;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'Médico especialista en análisis de casos. Razonamiento clínico estructurado y basado en evidencia.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.3
  };

  const response3 = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response3.ok) throw new Error('Error consultando OpenAI');
  const data3 = await response3.json();
  return data3.choices?.[0]?.message?.content || 'No se pudo obtener análisis del caso.';
}
