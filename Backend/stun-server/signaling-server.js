const WebSocket = require('ws');

// Puerto en el que escuchará el servidor de WebSockets
const PORT = process.env.PORT || 3000; // Asegúrate que coincida con el del cliente si no es 8080

// Crear el servidor de WebSockets
const wss = new WebSocket.Server({ port: PORT });

// Estructura para almacenar las salas y los clientes dentro de ellas
// Ejemplo: { "sala123": Set(wsClient1, wsClient2), "sala456": Set(wsClient3) }
const rooms = {};

console.log(`Servidor de señalización WebSocket (con salas) iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Cliente conectado al servidor general.');
    // ws.roomId = null; // Inicialmente el cliente no está en ninguna sala

    ws.on('message', (messageAsString) => {
        let message;
        try {
            message = JSON.parse(messageAsString);
        } catch (error) {
            console.error('Error al parsear mensaje JSON:', error, messageAsString);
            // Podrías enviar un error de vuelta al cliente si el JSON es inválido
            // ws.send(JSON.stringify({ type: 'error', message: 'Mensaje JSON inválido.' }));
            return;
        }

        console.log('Mensaje recibido:', message.type, 'de cliente en sala:', ws.roomId, 'contenido:', message);

        switch (message.type) {
            case 'join-room':
                const { roomId } = message;
                if (!roomId) {
                    console.warn('Intento de unirse a sala sin roomId.');
                    ws.send(JSON.stringify({ type: 'error', message: 'Se requiere roomId para unirse.' }));
                    return;
                }

                // Si el cliente ya estaba en una sala, lo sacamos primero
                if (ws.roomId && rooms[ws.roomId]) {
                    rooms[ws.roomId].delete(ws);
                    console.log(`Cliente ${ws.id || ''} salió de la sala ${ws.roomId}`);
                    if (rooms[ws.roomId].size === 0) {
                        delete rooms[ws.roomId];
                        console.log(`Sala ${ws.roomId} eliminada por estar vacía.`);
                    }
                }

                ws.roomId = roomId; // Asignar la nueva sala al cliente

                if (!rooms[roomId]) {
                    rooms[roomId] = new Set();
                    console.log(`Sala ${roomId} creada.`);
                }

                // Limitar a 2 participantes por sala para el caso doctor-paciente
                if (rooms[roomId].size >= 2) {
                    console.warn(`Intento de unirse a sala ${roomId} llena.`);
                    ws.send(JSON.stringify({ type: 'room-full', roomId: roomId, message: `La sala ${roomId} está llena.` }));
                    ws.roomId = null; // No se unió exitosamente
                    return;
                }
                
                rooms[roomId].add(ws);
                // Podrías asignar un ID único al ws si no lo tienes: ws.id = generateUniqueId();
                console.log(`Cliente ${ws.id || ''} se unió a la sala ${roomId}. Participantes: ${rooms[roomId].size}`);
                ws.send(JSON.stringify({ type: 'room-joined', roomId: roomId, message: `Te has unido a la sala ${roomId}` }));

                // Notificar a otros en la sala (si hay)
                rooms[roomId].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'user-joined', roomId: roomId, userId: ws.id || 'otro_usuario' }));
                    }
                });
                break;

            // Mensajes de señalización WebRTC (offer, answer, candidate)
            // Estos mensajes ahora deben incluir la roomId para el enrutamiento,
            // o el servidor debe saber la sala del remitente.
            // Por ahora, asumimos que el cliente ya está en una sala (ws.roomId está seteado).
            case 'offer':
            case 'answer':
            case 'candidate':
                if (!ws.roomId || !rooms[ws.roomId]) {
                    console.warn(`Mensaje de señalización (${message.type}) recibido de cliente no asignado a una sala válida.`);
                    ws.send(JSON.stringify({ type: 'error', message: 'Debes estar en una sala para enviar mensajes de señalización.' }));
                    return;
                }
                // Retransmitir solo a otros clientes en la misma sala
                console.log(`Retransmitiendo ${message.type} en sala ${ws.roomId}`);
                rooms[ws.roomId].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        try {
                            client.send(messageAsString); // Reenviar el string original
                            console.log(`Mensaje ${message.type} reenviado a otro cliente en sala ${ws.roomId}.`);
                        } catch (error) {
                            console.error('Error al reenviar mensaje en sala:', error);
                        }
                    }
                });
                break;

            default:
                console.log('Tipo de mensaje desconocido o no manejado:', message.type);
                // Podrías reenviar mensajes genéricos si es necesario, o ignorarlos.
                // Si es un mensaje genérico para la sala:
                // if (ws.roomId && rooms[ws.roomId]) {
                //     rooms[ws.roomId].forEach(client => {
                //         if (client !== ws && client.readyState === WebSocket.OPEN) {
                //             client.send(messageAsString);
                //         }
                //     });
                // }
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado.');
        if (ws.roomId && rooms[ws.roomId]) {
            rooms[ws.roomId].delete(ws);
            console.log(`Cliente ${ws.id || ''} eliminado de la sala ${ws.roomId} por desconexión.`);
            // Notificar a otros en la sala
            rooms[ws.roomId].forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'user-left', roomId: ws.roomId, userId: ws.id || 'otro_usuario' }));
                }
            });
            if (rooms[ws.roomId].size === 0) {
                delete rooms[ws.roomId];
                console.log(`Sala ${ws.roomId} eliminada por estar vacía tras desconexión.`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('Error en WebSocket de cliente:', error);
        // La lógica de 'close' también se encargará de limpiar la sala si es necesario.
    });

    // Enviar un mensaje de bienvenida o confirmación al cliente recién conectado
    // Esto es para la conexión general, no para la unión a una sala.
    ws.send(JSON.stringify({ type: 'connection-success', message: 'Conectado al servidor de señalización (general)!' }));
});

wss.on('error', (error) => {
    console.error('Error en el servidor WebSocket principal:', error);
});