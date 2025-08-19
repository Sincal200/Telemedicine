/* filepath: c:\Users\sinca\OneDrive\Documents\Telemedicine\Frontend\telemedicine-frontend\src\utils\auth.js */
// Funciones de utilidad para manejo de autenticación

export const authUtils = {
  // Obtener token de acceso
  getAccessToken: () => {
    return sessionStorage.getItem('accessToken');
  },

  // Obtener refresh token
  getRefreshToken: () => {
    return sessionStorage.getItem('refreshToken');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = sessionStorage.getItem('accessToken');
    const expiresIn = sessionStorage.getItem('expiresIn');
    
    if (!token) return false;
    
    // Opcional: verificar si el token ha expirado
    // Necesitarías calcular el tiempo de expiración
    return true;
  },

  // Limpiar tokens (logout)
  clearTokens: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenType');
    sessionStorage.removeItem('expiresIn');
    sessionStorage.removeItem('sessionState');
    sessionStorage.removeItem('userInfo');
  },

  // Obtener header de autorización para requests
  getAuthHeader: () => {
    const token = sessionStorage.getItem('accessToken');
    const tokenType = sessionStorage.getItem('tokenType') || 'Bearer';
    
    return token ? `${tokenType} ${token}` : null;
  },

  // Decodificar información del JWT (sin validar la firma)
  getTokenInfo: () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }
};
 
// Guardar tokens (helper reutilizable)
export const saveTokens = (tokenData) => {
  if (!tokenData) return;

  sessionStorage.setItem('accessToken', tokenData.accessToken || tokenData.access_token || '');
  sessionStorage.setItem('refreshToken', tokenData.refreshToken || tokenData.refresh_token || '');
  sessionStorage.setItem('tokenType', tokenData.token_type || 'Bearer');
  if (tokenData.expires_in) sessionStorage.setItem('expiresIn', tokenData.expires_in);
  if (tokenData.session_state) sessionStorage.setItem('sessionState', tokenData.session_state);
  if (tokenData.userInfo) sessionStorage.setItem('userInfo', JSON.stringify(tokenData.userInfo));
};

// Hook para uso en componentes React
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (tokenData) => {
  // Guardar tokens usando el helper centralizado
  saveTokens(tokenData);
  setIsAuthenticated(true);
  };

  const logout = () => {
    authUtils.clearTokens();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    getAccessToken: authUtils.getAccessToken,
    getAuthHeader: authUtils.getAuthHeader,
    getTokenInfo: authUtils.getTokenInfo
  };
};