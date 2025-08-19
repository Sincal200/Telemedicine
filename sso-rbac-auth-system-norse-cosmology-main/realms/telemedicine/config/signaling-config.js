// Configuración para el servidor de señalización WebRTC
export const signalingConfig = {
    // Configuración de WebSocket
    websocket: {
        pingInterval: 30000, // 30 segundos
        pongTimeout: 5000,   // 5 segundos
        maxPayload: 1024 * 1024, // 1MB
    },
    
    // Configuración de salas
    rooms: {
        maxUsersPerRoom: 10,
        roomTimeoutMinutes: 60, // Tiempo antes de eliminar una sala inactiva
        allowedUserRoles: ['doctor', 'patient', 'admin']
    },
    
    // Configuración de logging
    logging: {
        enableDebug: process.env.NODE_ENV === 'development',
        logConnections: true,
        logMessages: process.env.NODE_ENV === 'development'
    }
};

export default signalingConfig;
