import Redis from "ioredis";

let _redis: Redis | undefined;

function buildRedisUrl(): string {
  // Formato 1 — URL completa (dev local / Coolify / Railway)
  const url = process.env.REDIS_URL;
  if (url) return url;

  // Formato 2 — variáveis separadas (já existentes no container da VPS)
  const password = process.env.REDIS_PASSWORD;
  const host     = process.env.REDIS_HOST ?? "187.77.244.198";
  const port     = process.env.REDIS_PORT ?? "32773";

  if (password) return `redis://:${password}@${host}:${port}`;

  throw new Error("Redis não configurado. Defina REDIS_URL ou REDIS_PASSWORD no .env");
}

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(buildRedisUrl(), {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    _redis.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });
  }
  return _redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await getRedis().get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> {
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* Redis indisponível não quebra o app */ }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await getRedis().del(...keys);
  } catch { /* noop */ }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length) await getRedis().del(...keys);
  } catch { /* noop */ }
}
