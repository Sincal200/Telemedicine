import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import WebRTCSignalingServer from './sockets/webrtc-signaling.js';
import telemedicineRoutes from './routes/telemedicine.js';
import { authenticate } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';
import sexoRoutes from './routes/sexoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Autenticación centralizada (usa Redis internamente)
app.use(authenticate);

// Exponer el signaling server por app.locals para accederlo desde rutas
const server = http.createServer(app);
const signalingServer = new WebRTCSignalingServer();
signalingServer.initialize(server);
app.locals.signalingServer = signalingServer;

// Rutas de telemedicina
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/sexos', sexoRoutes);


// Rutas heredadas mínimas para compatibilidad
app.get('/authenticate', (req, res) => {
  res.json({ status: 'success', message: 'User authenticated' });
});

app.get('/authorize', (req, res) => {
  res.json({ status: 'success', message: 'User authorized' });
});

// Error handler final
app.use(errorHandler);

// Upgrade handler para WebSocket
server.on('upgrade', (request, socket, head) => {
  signalingServer.handleUpgrade(request, socket, head, server);
});

server.listen(PORT, () => {
  console.log(`Telemedicine API listening on port ${PORT}`);
  console.log(`WebSocket de señalización disponible en ws://localhost:${PORT}`);
});