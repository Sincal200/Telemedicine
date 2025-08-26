// Servicio para centralizar llamadas usadas en el flujo de registro
// - Obtiene token de client-credentials
// - Crea usuario en Keycloak
// - Asigna roles en Keycloak
// - Llama al endpoint de completar registro en la API propia

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL_1 = import.meta.env.VITE_API_URL_1 || API_URL; // API interna de registro
const TENANT = import.meta.env.VITE_TENANT || 'telemedicine';
const SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '';

class RegisterService {
  getBaseHeaders(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Solicita token client-credentials al backend (que reexporta a Keycloak)
   * @param {{client_id:string, client_secret:string}} body
   */
  async getClientCredentialsToken(body) {
    const res = await fetch(`${API_URL}/api/auth/client-credentials-token?tenant=${TENANT}`, {
      method: 'POST',
      headers: this.getBaseHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error obteniendo token de cliente');
    }

    return res.json();
  }

  /**
   * Crea un usuario en Keycloak a través del endpoint del backend
   * @param {string} adminToken - token de cliente con permiso de admin
   * @param {Object} userData - payload para Keycloak create user
   */
  async createKeycloakUser(adminToken, userData) {
    const res = await fetch(`${API_URL}/api/auth/create-user?tenant=${TENANT}`, {
      method: 'POST',
      headers: this.getBaseHeaders(adminToken),
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error creando usuario en Keycloak');
    }

    return res.json();
  }

  /**
   * Asigna roles a un usuario en Keycloak
   * @param {string} adminToken
   * @param {string} userId
   * @param {Array} roles
   */
  async assignUserRoles(adminToken, userId, roles) {
    const payload = { userId, roles };
    const res = await fetch(`${API_URL}/api/auth/assign-user-roles?tenant=${TENANT}`, {
      method: 'POST',
      headers: this.getBaseHeaders(adminToken),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // don't throw to allow registration to continue; return info instead
      return { ok: false, error: err };
    }

    return { ok: true, ...(await res.json()) };
  }

  /**
   * Llama al endpoint interno para completar el registro en la BD
   * @param {string} authHeader - token para autorizar la petición (puede incluir secret|token si el backend lo requiere)
   * @param {Object} completarData
   */
  async completarRegistro(authHeader, completarData) {
    const headers = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = `${authHeader}`;

    const res = await fetch(`${API_URL_1}/registro/completar?tenant=${TENANT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(completarData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error completando registro en servidor');
    }

    return res.json();
  }
}

const registerService = new RegisterService();
export default registerService;
