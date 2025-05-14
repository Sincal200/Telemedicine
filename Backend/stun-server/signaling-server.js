// filepath: Backend/signaling-server.js
const WebSocket = require('ws');

// Puerto en el que escuchará el servidor de WebSockets
const PORT = process.env.PORT || 3000;

// Crear el servidor de WebSockets
const wss = new WebSocket.Server({ port: PORT });

// Almacenaremos los clientes conectados en un Set para evitar duplicados
// y facilitar la eliminación.
const clients = new Set();

console.log(`Servidor de señalización WebSocket iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Cliente conectado.');
    clients.add(ws); // Añadir el nuevo cliente al conjunto

    ws.on('message', (messageAsString) => {
        const message = JSON.parse(messageAsString); // Asumimos que los mensajes son JSON
        console.log('Mensaje recibido:', message);

        // Retransmitir el mensaje a todos los OTROS clientes conectados
        // Esto es una implementación muy simple. En una app real, querrías
        // dirigir los mensajes a usuarios específicos (ej: basados en una "sala" o ID de destinatario).
        for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageAsString); // Reenviar el string original
                    console.log('Mensaje reenviado a otro cliente.');
                } catch (error) {
                    console.error('Error al reenviar mensaje:', error);
                }
            }
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado.');
        clients.delete(ws); // Eliminar el cliente del conjunto
    });

    ws.on('error', (error) => {
        console.error('Error en WebSocket:', error);
        clients.delete(ws); // Asegurarse de eliminar en caso de error también
    });

    // Enviar un mensaje de bienvenida o confirmación al cliente recién conectado
    ws.send(JSON.stringify({ type: 'connection-success', message: 'Conectado al servidor de señalización!' }));
});

// Manejo de errores del servidor principal (raro, pero buena práctica)
wss.on('error', (error) => {
    console.error('Error en el servidor WebSocket principal:', error);
});