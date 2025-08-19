import redisClient from '../config/redisClient.js';

// Middleware para autenticar usando token almacenado en Redis
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Authorization header required');

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).send('Bearer token required');

    const userDataString = await redisClient.get(token);
    if (!userDataString) return res.status(401).send('Invalid or expired user key');

    req.user = JSON.parse(userDataString);
    next();
  } catch (error) {
    return res.status(401).send('Invalid authorization header');
  }
}
