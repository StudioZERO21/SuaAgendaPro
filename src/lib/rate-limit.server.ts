/**
 * Rate limiting via Redis (sliding window por chave).
 * Falha aberta se Redis indisponível — não bloqueia o app.
 */

import { getRedis } from "@/lib/redis.server";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  try {
    const redis = getRedis();
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    const remaining = Math.max(0, maxRequests - count);
    return {
      allowed: count <= maxRequests,
      remaining,
      retryAfterSec: count <= maxRequests ? 0 : Math.max(ttl, 1),
    };
  } catch {
    return { allowed: true, remaining: maxRequests, retryAfterSec: 0 };
  }
}

/** Extrai IP do request (sem persistir — só para rate limit). */
export function clientIpFromRequest(request: Request | null | undefined): string {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function enforceRateLimit(
  key: string,
  maxRequests: number,
  windowSec: number,
): Promise<void> {
  const result = await checkRateLimit(key, maxRequests, windowSec);
  if (!result.allowed) {
    throw new Error(
      `Muitas tentativas. Aguarde ${result.retryAfterSec}s e tente novamente.`,
    );
  }
}
