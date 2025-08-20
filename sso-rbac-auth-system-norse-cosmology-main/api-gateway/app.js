import express from "express";
import rateLimit from "express-rate-limit";
import axios from "axios";
import { createProxyMiddleware } from "http-proxy-middleware";
import Redis from "ioredis";
import cors from "cors"; // Importa cors correctamente

// Create a Redis client
const redisClient = new Redis({
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

// Configure Express to trust proxy (para Nginx)
app.set('trust proxy', true);

// Configurar CORS para permitir solicitudes desde http://localhost:5173
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Permitir credenciales
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600000, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use(apiLimiter);

const authUrl = process.env.AUTH_URL || "http://localhost:3001";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).send("Missing authorization header");
  const token = authHeader.split(" ")[1];
  
  let tenant = req.query.tenant;
  if (!tenant) {
    tenant = getTenantFromRequest(req);
  }
  if (!tenant) return res.status(400).send("Missing tenant parameter");
  console.log(`Tenant: ${tenant}`);
  
  try {
    // Check if token data is cached
    let cachedData = await redisClient.get(token);
    if (cachedData) {
      cachedData = JSON.parse(cachedData);
      const now = Math.floor(Date.now() / 1000);
      if (cachedData.exp && cachedData.exp > now) {
        console.log("Using cached data");
        req.user = cachedData;
        return next();
      } else {
        console.log("Token in cache has expired");
        await redisClient.del(token);
      }
    }

    // If not cached or expired, fetch data from auth service
    console.log("Fetching data from auth service");
    const response = await axios.get(`${authUrl}/verifyToken?tenant=${tenant}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data } = response;

    // Store the data in cache with expiration
    const expirationTime = data.exp - Math.floor(Date.now() / 1000);
    if (expirationTime > 0) {
      await redisClient.set(token, JSON.stringify(data), 'EX', expirationTime);
      req.user = data;
      next();
    }

  } catch (error) {
    console.error("Error during token verification:", error.response ? error.response.data : error.message);
    console.error(`URL: ${authUrl}/verifyToken?tenant=${tenant}`);
    res.status(401).send("Invalid or expired token");
  }
};

const asgardUrl = process.env.ASGARD_URL || "http://localhost:3002";
const telemedicineUrl = process.env.TELEMEDICINE_URL || "http://localhost:3002";

// Set up proxy middleware for each service
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: authUrl,
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.method === "POST" && req.headers["content-type"]) {
        proxyReq.setHeader("Content-Type", req.headers["content-type"]);
      }
    },
  })
);

// Asgard Proxy Rules
app.use(
  "/api/asgard",
  authMiddleware,
  createProxyMiddleware({
    target: asgardUrl,
    changeOrigin: true,
    pathRewrite: {
      "^/api/asgard": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.method === "POST" && req.headers["content-type"]) {
        proxyReq.setHeader("Content-Type", req.headers["content-type"]);
      }
    },
  })
);


// Telemedicine Proxy Rules
app.use(
    "/api/telemedicine",
  (req, res, next) => {
    if (req.headers.upgrade && req.headers.upgrade === 'websocket') {
      return next();
    }
    authMiddleware(req, res, next);
  },
  createProxyMiddleware({
    target: telemedicineUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      "^/api/telemedicine": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      if (['POST', 'GET'].includes(req.method) && req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
    },
  })
);


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});