import express from "express";
import dotenv from "dotenv";
import redis from "ioredis";
import http from 'http'; // Added: Import http module
import { WebSocketServer } from 'ws'; 

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server without directly binding to a port
const wss = new WebSocketServer({ noServer: true }); // Changed: Use WebSocketServer

// Estructura para manejar salas y clientes
const rooms = new Map(); // Map para almacenar salas: key = roomId, value = Set de clientes

console.log(`Servidor de señalización WebSocket iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    let clientRoom = null; // Para rastrear en qué sala está el cliente

    // Enviar mensaje de conexión exitosa
    ws.send(JSON.stringify({ type: 'connection-success', message: 'Conectado al servidor de señalización!' }));

    ws.on('message', (messageAsString) => {
        try {
            const message = JSON.parse(messageAsString);
            console.log('Mensaje recibido:', message);

            // Manejar mensajes según su tipo
            switch (message.type) {
                case 'join-room':
                    // Unirse a una sala específica
                    const { roomId, userRole, userId } = message;
                    
                    // Si la sala no existe, crearla
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Set());
                        console.log(`Nueva sala creada: ${roomId}`);
                    }
                    
                    // Añadir metadatos al cliente
                    ws.userId = userId;
                    ws.userRole = userRole;
                    ws.roomId = roomId;
                    clientRoom = roomId;
                    
                    // Añadir el cliente a la sala
                    rooms.get(roomId).add(ws);
                    console.log(`Cliente ${userId} (${userRole}) unido a sala ${roomId}`);
                    
                    // Notificar al cliente que se unió correctamente
                    ws.send(JSON.stringify({
                        type: 'room-joined',
                        roomId,
                        usersInRoom: Array.from(rooms.get(roomId)).map(client => ({
                            userId: client.userId,
                            userRole: client.userRole
                        }))
                    }));
                    
                    // Notificar a otros usuarios en la sala sobre el nuevo participante
                    broadcastToRoom(roomId, ws, {
                        type: 'user-joined',
                        userId,
                        userRole
                    });
                    break;

                case 'leave-room':
                    removeFromRoom(ws);
                    break;
                
                // Mensajes de señalización WebRTC
                case 'offer':
                case 'answer':
                case 'candidate':
                    // Añadir roomId a los mensajes de señalización
                    const signalMessage = { ...message };
                    
                    // Si hay un destinatario específico (targetUserId), enviar solo a ese usuario
                    if (message.targetUserId && clientRoom) {
                        sendToUser(clientRoom, message.targetUserId, signalMessage);
                    } else if (clientRoom) {
                        // De lo contrario, enviar a todos en la sala excepto el remitente
                        broadcastToRoom(clientRoom, ws, signalMessage);
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
        removeFromRoom(ws);
    });

    ws.on('error', (error) => {
        console.error('Error en WebSocket:', error);
        removeFromRoom(ws);
    });

    // Función para eliminar un cliente de su sala actual
    function removeFromRoom(client) {
        if (client.roomId && rooms.has(client.roomId)) {
            const room = rooms.get(client.roomId);
            room.delete(client);
            
            // Notificar a otros en la sala que este usuario se fue
            broadcastToRoom(client.roomId, client, {
                type: 'user-left',
                userId: client.userId
            });
            
            // Si la sala queda vacía, eliminarla
            if (room.size === 0) {
                rooms.delete(client.roomId);
                console.log(`Sala ${client.roomId} eliminada por estar vacía`);
            }
            
            clientRoom = null;
            console.log(`Cliente ${client.userId} eliminado de sala ${client.roomId}`);
        }
    }

    // Función para enviar mensaje a todos en una sala excepto al remitente
    function broadcastToRoom(roomId, sender, message) {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            for (const client of room) {
                if (client !== sender && client.readyState === WebSocket.OPEN) {
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
    function sendToUser(roomId, targetUserId, message) {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            for (const client of room) {
                if (client.userId === targetUserId && client.readyState === WebSocket.OPEN) {
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
});

wss.on('error', (error) => {
    console.error('Error en el servidor WebSocket principal:', error);
});

server.on('upgrade', (request, socket, head) => {
  // You can implement authentication for WebSocket connections here if needed.
  // For example, check `request.headers.cookie` if using session-based auth,
  // or a token in `request.url` or `request.headers['sec-websocket-protocol']`.

  // For now, directly handle the upgrade:
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});


// Start the HTTP server (which also handles WebSocket upgrades)
server.listen(PORT, () => {
  console.log(`Asgard listening on port ${PORT}`);
});