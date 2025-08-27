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
import setupRoutes from "./routes/setupRoutes.js";
import registroRoutes from "./routes/registroRoutes.js";
import expedienteRoutes from './routes/expedienteRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Documentación Swagger pública
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Autenticación centralizada (usa Redis internamente)
app.use(authenticate);

// Exponer el signaling server por app.locals para accederlo desde rutas
const server = http.createServer(app);
const signalingServer = new WebRTCSignalingServer();
signalingServer.initialize(server);
app.locals.signalingServer = signalingServer;

// Rutas de telemedicina

app.use('/telemedicine', telemedicineRoutes);
app.use('/aldea', aldeaRoutes);
app.use('/archivo', archivoRoutes);
app.use('/cita', citaRoutes);
app.use('/configuracion-centro', configuracionCentroRoutes);
app.use('/consulta' , consultaCentroRoutes);
app.use('/departamento', departamentoRoutes);
app.use('/dias-semana', diasSemanaRoutes);
app.use('/direccion', direccionRoutes)
app.use('/disponibilidad-personal-medico', disponibilidadPersonalMedicoRoutes);
app.use('/especialidades', especialidadesRoutes)
app.use('/estadisticas-diarias', estadisticasDiariasRoutes);
app.use('/estados-cita', estadosCitaRoutes)
app.use('/log-sistema', logSistemaRoutes)
app.use('/mensaje', mensajeRoutes)
app.use('/municipio', municipioRoutes)
app.use('/paciente', pacienteRoutes)
app.use('/persona', personaRoutes)
app.use('/personal-medico', personalMedicoRoutes)
app.use('/prioridad-cita', prioridadCitaRoutes)
app.use('/recordatorio', recordatorioRoutes)
app.use('/sexo', sexoRoutes);
app.use('/signos-vitales', signosVitalesRoutes)
app.use('/solicitud-rol', solicitudRolRoutes)
app.use('/tipos-cita', tiposCitaRoutes)
app.use('/tipos-documento-identidad', tiposDocumentoIdentidadRoutes)
app.use('/usuario', usuarioRoutes)
app.use('/setup', setupRoutes)
app.use('/registro', registroRoutes)
// Nuevo endpoint expediente
app.use('/expediente', expedienteRoutes);


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