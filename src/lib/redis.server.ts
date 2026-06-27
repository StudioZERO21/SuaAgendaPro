import Redis from "ioredis";

let _redis: Redis | undefined;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("Missing REDIS_URL env var");
    _redis = new Redis(url, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    _redis.on("error", (err) => {
      // não derruba o app se Redis estiver fora
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
  } catch { /* noop — Redis indisponível não quebra o app */ }
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
