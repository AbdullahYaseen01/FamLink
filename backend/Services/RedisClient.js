// redisClient.js
import { createClient } from 'redis';

const client = createClient({
  username: 'default',
  password: 'cgHppOFrizLC3gILwuImbx9WZDQW4tag',
  socket: {
    host: 'redis-15740.c8.us-east-1-2.ec2.redns.redis-cloud.com', // use your Redis Cloud host
    port: 15740, // your Redis Cloud port
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
