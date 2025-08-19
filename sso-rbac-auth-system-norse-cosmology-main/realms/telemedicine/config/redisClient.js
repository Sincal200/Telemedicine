import Redis from 'ioredis';

// Configuración centralizada del cliente Redis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

redisClient.on('error', (error) => {
  console.error('Redis client error:', error);
});

redisClient.on('end', () => {
  console.log('Redis client connection closed');
});

export default redisClient;
