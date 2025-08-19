import { WebSocketServer } from 'ws';

class WebRTCSignalingServer {
    constructor() {
        this.rooms = new Map(); // Map para almacenar salas: key = roomId, value = Set de clientes
        this.wss = null;
    }

    // Inicializar el servidor WebSocket
    initialize(server) {
        this.wss = new WebSocketServer({ noServer: true });
        
        console.log('Servidor de señalización WebSocket inicializado');

        this.wss.on('connection', (ws, request) => {
            console.log('Cliente conectado');
            let clientRoom = null; // Para rastrear en qué sala está el cliente

            ws.send(JSON.stringify({ 
                type: 'connection-success', 
                message: 'Conectado al servidor de señalización!' 
            }));

            ws.on('message', (messageAsString) => {
                try {
                    const message = JSON.parse(messageAsString);
                    console.log('Mensaje recibido:', message);

                    // Manejar mensajes según su tipo
                    switch (message.type) {
                        case 'join-room':
                            // Unirse a una sala específica
                            const { roomId, userRole, userId } = message;
                            
                            if (!this.rooms.has(roomId)) {
                                this.rooms.set(roomId, new Set());
                                console.log(`Nueva sala creada: ${roomId}`);
                            }
                            
                            ws.userId = userId;
                            ws.userRole = userRole;
                            ws.roomId = roomId;
                            clientRoom = roomId;
                            
                            this.rooms.get(roomId).add(ws);
                            console.log(`Cliente ${userId} (${userRole}) unido a sala ${roomId}`);
                            
                            ws.send(JSON.stringify({
                                type: 'room-joined',
                                roomId,
                                usersInRoom: Array.from(this.rooms.get(roomId)).map(client => ({
                                    userId: client.userId,
                                    userRole: client.userRole
                                }))
                            }));
                            
                            // Notificar a otros usuarios en la sala sobre el nuevo participante
                            this.broadcastToRoom(roomId, ws, {
                                type: 'user-joined',
                                userId,
                                userRole
                            });
                            break;

                        case 'leave-room':
                            this.removeFromRoom(ws);
                            break;
                        
                        // Mensajes de señalización WebRTC
                        case 'offer':
                        case 'answer':
                        case 'candidate':
                            // Añadir roomId a los mensajes de señalización
                            const signalMessage = { ...message };
                            
                            // Si hay un destinatario específico (targetUserId), enviar solo a ese usuario
                            if (message.targetUserId && clientRoom) {
                                this.sendToUser(clientRoom, message.targetUserId, signalMessage);
                            } else if (clientRoom) {
                                // De lo contrario, enviar a todos en la sala excepto el remitente
                                this.broadcastToRoom(clientRoom, ws, signalMessage);
                            }
                            break;
                        
                        default:
                            console.log(`Mensaje de tipo desconocido: ${message.type}`);
                    }
                } catch (error) {
                    console.error('Error al procesar mensaje:', error);
                }
            });

            // Cuando un cliente se desconecta
            ws.on('close', () => {
                console.log('Cliente desconectado');
                this.removeFromRoom(ws);
            });

            ws.on('error', (error) => {
                console.error('Error en WebSocket:', error);
                this.removeFromRoom(ws);
            });
        });

        this.wss.on('error', (error) => {
            console.error('Error en el servidor WebSocket principal:', error);
        });

        return this.wss;
    }

    // Función para eliminar un cliente de su sala actual
    removeFromRoom(client) {
        if (client.roomId && this.rooms.has(client.roomId)) {
            const room = this.rooms.get(client.roomId);
            room.delete(client);
            
            this.broadcastToRoom(client.roomId, client, {
                type: 'user-left',
                userId: client.userId
            });
            
            // Si la sala queda vacía, eliminarla
            if (room.size === 0) {
                this.rooms.delete(client.roomId);
                console.log(`Sala ${client.roomId} eliminada por estar vacía`);
            }
            
            console.log(`Cliente ${client.userId} eliminado de sala ${client.roomId}`);
        }
    }

    // Función para enviar mensaje a todos en una sala excepto al remitente
    broadcastToRoom(roomId, sender, message) {
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            for (const client of room) {
                if (client !== sender && client.readyState === 1) { // WebSocket.OPEN = 1
                    try {
                        client.send(JSON.stringify(message));
                    } catch (error) {
                        console.error('Error al enviar mensaje a cliente:', error);
                    }
                }
            }
        }
    }

    // Función para enviar mensaje a un usuario específico en una sala
    sendToUser(roomId, targetUserId, message) {
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            for (const client of room) {
                if (client.userId === targetUserId && client.readyState === 1) { // WebSocket.OPEN = 1
                    try {
                        client.send(JSON.stringify(message));
                        return true;
                    } catch (error) {
                        console.error('Error al enviar mensaje a usuario específico:', error);
                        return false;
                    }
                }
            }
        }
        return false;
    }

    // Manejar la actualización de WebSocket
    handleUpgrade(request, socket, head, server) {
        // Aquí puedes implementar autenticación para conexiones WebSocket si es necesario
        // Por ejemplo, verificar `request.headers.cookie` si usas autenticación basada en sesión,
        // o un token en `request.url` o `request.headers['sec-websocket-protocol']`.

        this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
        });
    }

    // Obtener estadísticas de las salas
    getRoomsStats() {
        const stats = {
            totalRooms: this.rooms.size,
            rooms: []
        };

        for (const [roomId, clients] of this.rooms) {
            stats.rooms.push({
                roomId,
                clientCount: clients.size,
                clients: Array.from(clients).map(client => ({
                    userId: client.userId,
                    userRole: client.userRole
                }))
            });
        }

        return stats;
    }
}

export default WebRTCSignalingServer;
