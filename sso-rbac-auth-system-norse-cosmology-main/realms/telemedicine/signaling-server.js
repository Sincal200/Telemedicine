import express from "express";
import dotenv from "dotenv";
import redis from "ioredis";
import http from 'http'; 
import mysql from 'mysql2/promise';
import WebRTCSignalingServer from './sockets/webrtc-signaling.js';
import telemedicineRoutes from './routes/telemedicine.js';

dotenv.config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

redisClient.on("end", () => {
  console.log("Redis client connection closed");
});

const app = express();

// Middleware de manejo de errores
const errorHandlingMiddleware = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send(err.message || "Internal server error");
};

// Middleware de autenticación
app.use(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send("Authorization header required");
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send("Bearer token required");
    }
    
    const userDataString = await redisClient.get(token);
    if (userDataString) {
      req.user = JSON.parse(userDataString);
      next();
    } else {
      res.status(401).send("Invalid or expired user key");
    }
  } catch (error) {
    res.status(401).send("Invalid authorization header");
  }
});

// Middleware para inyectar el servidor de señalización en las rutas
app.use((req, res, next) => {
  req.signalingServer = signalingServer;
  next();
});

app.use(express.json());
app.use(errorHandlingMiddleware);

// Middleware de autorización (mantenido para compatibilidad con rutas existentes)
const authorizationMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const availableRoles = req.user.realm_access.roles;
      if (!availableRoles.includes(requiredRole)) throw new Error();
      next();
    } catch (err) {
      res.status(403).send({ error: "access denied" });
    }
  };
};

// Usar las rutas de telemedicina
app.use('/api/telemedicine', telemedicineRoutes);

// Rutas heredadas (mantener para compatibilidad)
app.get("/authenticate", (req, res) => {
  res.json({ 
    status: "success",
    message: "User authenticated"
  });
});

app.get("/authorize", authorizationMiddleware("doctor"), (req, res) => {
  res.json({ 
    status: "success",
    message: "User authorized"
  });
});

const PORT = process.env.PORT || 3002;

const server = http.createServer(app);

// Inicializar el servidor de señalización WebRTC
const signalingServer = new WebRTCSignalingServer();
const wss = signalingServer.initialize(server);

console.log(`Servidor de telemedicina iniciado en el puerto ${PORT}`);
console.log(`WebSocket de señalización disponible en ws://localhost:${PORT}`);

// Manejar las actualizaciones de WebSocket
server.on('upgrade', (request, socket, head) => {
  signalingServer.handleUpgrade(request, socket, head, server);
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Telemedicine API listening on port ${PORT}`);
});