// redisClient.js
import { createClient } from 'redis';
import "dotenv/config";

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST, // use your Redis Cloud host
    port: process.env.REDIS_PORT, // your Redis Cloud port
  },
});

client.on('error', (err) => console.error('Redis Client Error:', err));

/**
 * Connect only once and reuse the connection
 */
async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log('✅ Redis connected');
  }
}

export { client, connectRedis };
