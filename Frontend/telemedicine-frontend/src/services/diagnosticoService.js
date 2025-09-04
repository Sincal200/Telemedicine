// Servicio para consultar el diagnóstico médico virtual vía API Gateway
const API_BASE_URL = import.meta.env.VITE_API_URL_1 || 'http://localhost:3003';
const VITE_KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret';

function getAuthToken() {
  return sessionStorage.getItem('accessToken');
}

function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${VITE_KEYCLOAK_CLIENT_SECRET}|${token}` })
  };
}

export async function consultarDiagnosticoOpenAI(sintomas) {
  const res = await fetch(`${API_BASE_URL}/diagnostico-openai?tenant=telemedicine`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ sintomas })
  });
  const data = await res.json();
  return data;
}
