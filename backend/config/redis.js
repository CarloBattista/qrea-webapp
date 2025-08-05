import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

// Configurazione Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Crea connessione Redis
export const redis = new Redis(redisConfig);

// Event listeners per debugging
redis.on('connect', () => {
  console.log('✅ Redis connesso');
});

redis.on('error', (err) => {
  console.error('❌ Errore Redis:', err);
});

redis.on('ready', () => {
  console.log('🚀 Redis pronto');
});

export default redis;
