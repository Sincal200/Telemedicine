import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import WebRTCSignalingServer from './sockets/webrtc-signaling.js';
import { swaggerUi, swaggerSpec } from './config/swagger.js';
import telemedicineRoutes from './routes/telemedicine.js';
import { authenticate } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';
import sexoRoutes from './routes/sexoRoutes.js';
import aldeaRoutes from './routes/aldeaRoutes.js';
import archivoRoutes from './routes/archivoRoutes.js';
import citaRoutes from "./routes/citaRoutes.js";
import configuracionCentroRoutes from "./routes/configuracionCentroRoutes.js";
import consultaCentroRoutes from "./routes/consultaRoutes.js";
import departamentoRoutes from "./routes/departamentoRoutes.js";
import diasSemanaRoutes from "./routes/diasSemanaRoutes.js";
import direccionRoutes from "./routes/direccionRoutes.js";
import disponibilidadPersonalMedicoRoutes from "./routes/disponibilidadPersonalMedicoRoutes.js";
import especialidadesRoutes from "./routes/especialidadesRoutes.js";
import estadisticasDiariasRoutes from "./routes/estadisticasDiariasRoutes.js";
import estadosCitaRoutes from "./routes/estadosCitaRoutes.js";
import logSistemaRoutes from "./routes/logSistemaRoutes.js";
import mensajeRoutes from "./routes/mensajeRoutes.js";
import municipioRoutes from "./routes/municipioRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js";
import personaRoutes from "./routes/personaRoutes.js";
import personalMedicoRoutes from "./routes/personalMedicoRoutes.js";
import prioridadCitaRoutes from "./routes/prioridadCitaRoutes.js";
import recordatorioRoutes from "./routes/recordatorioRoutes.js";
import signosVitalesRoutes from "./routes/signosVitalesRoutes.js";
import solicitudRolRoutes from "./routes/solicitudRolRoutes.js";
import tiposCitaRoutes from "./routes/tiposCitaRoutes.js";
import tiposDocumentoIdentidadRoutes from "./routes/tiposDocumentoIdentidadRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/aldea', aldeaRoutes);
app.use('/api/archivo', archivoRoutes);
app.use('/api/cita', citaRoutes);
app.use('/api/configuracion-centro', configuracionCentroRoutes);
app.use('/api/conslta' , consultaCentroRoutes);
app.use('/api/departamento', departamentoRoutes);
app.use('/api/dias-semana', diasSemanaRoutes);
app.use('/api/direccion', direccionRoutes)
app.use('/api/disponibilidad-personal-medico', disponibilidadPersonalMedicoRoutes);
app.use('/api/especialidades', especialidadesRoutes)
app.use('/api/estadisticas-diarias', estadisticasDiariasRoutes);
app.use('/api/estados-cita', estadosCitaRoutes)
app.use('/api/log-sistema', logSistemaRoutes)
app.use('/api/mensaje', mensajeRoutes)
app.use('/api/municipio', municipioRoutes)
app.use('/api/paciente', pacienteRoutes)
app.use('/api/persona', personaRoutes)
app.use('/api/personal-medico', personalMedicoRoutes)
app.use('/api/prioridad-cita', prioridadCitaRoutes)
app.use('/api/recordatorio', recordatorioRoutes)
app.use('/api/sexo', sexoRoutes);
app.use('/api/signos-vitales', signosVitalesRoutes)
app.use('/api/solicitud-rol', solicitudRolRoutes)
app.use('/api/tipos-cita', tiposCitaRoutes)
app.use('/api/tipos-documento-identidad', tiposDocumentoIdentidadRoutes)
app.use('/api/usuario', usuarioRoutes)


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