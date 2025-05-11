import { createClient } from 'redis';

const client = createClient({ url: 'redis://redis:6379' });

client.connect();

export async function setCache(key, buffer, ttl = 60) {
  await client.set(key, buffer.toString('base64'), { EX: ttl });
}

export async function getCache(key) {
  const data = await client.get(key);
  return data ? Buffer.from(data, 'base64') : null;
}
