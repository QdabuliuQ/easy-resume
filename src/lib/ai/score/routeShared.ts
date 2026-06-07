import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const CACHE_TTL_SEC = 300;
const ANALYZE_SESSION_TTL_SEC = 120;

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string; retryAfter?: number };

export type AnalyzeRequestBody = {
  pages?: unknown;
  analyzeSessionId?: string;
};

export function ok<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data });
}

export function err(message: string, status: number, retryAfter?: number): NextResponse<ApiError> {
  const body: ApiError = { success: false, error: message };
  if (retryAfter !== undefined) body.retryAfter = retryAfter;
  const headers: Record<string, string> = {};
  if (retryAfter !== undefined) headers['Retry-After'] = String(retryAfter);
  return NextResponse.json(body, { status, headers });
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

export function hashResumeContent(pages: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(pages)).digest('hex');
}

export function parseAnalyzeBody(body: AnalyzeRequestBody): NextResponse<ApiError> | null {
  if (!body.pages || !Array.isArray(body.pages) || body.pages.length === 0) {
    return err('缺少 pages 字段或内容为空', 400);
  }
  return null;
}

async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zadd(key, { score: now, member });
  pipeline.zcard(key);
  pipeline.expire(key, windowSec + 10);
  const results = await pipeline.exec();
  const count = results[2] as number;
  if (count > limit) {
    await redis.zrem(key, member);
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
    const resetIn = Math.ceil((oldestScore + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, resetIn: Math.max(resetIn, 1) };
  }
  return { allowed: true, remaining: limit - count, resetIn: windowSec };
}

type RateLimitDenied = { allowed: false; resetIn: number; message: string };

async function applyAnalyzeRateLimit(ipHash: string): Promise<RateLimitDenied | { allowed: true }> {
  const minuteKey = `ratelimit:analyze:1m:${ipHash}`;
  const hourKey = `ratelimit:analyze:1h:${ipHash}`;
  const [minuteCheck, hourCheck] = await Promise.all([
    checkRateLimit(minuteKey, 2, 60),
    checkRateLimit(hourKey, 10, 3600),
  ]);
  if (!minuteCheck.allowed) {
    return {
      allowed: false,
      resetIn: minuteCheck.resetIn,
      message: `请求过于频繁，1 分钟内最多 2 次，请 ${minuteCheck.resetIn} 秒后重试`,
    };
  }
  if (!hourCheck.allowed) {
    return {
      allowed: false,
      resetIn: hourCheck.resetIn,
      message: `已超出每小时限额（最多 10 次），请 ${hourCheck.resetIn} 秒后重试`,
    };
  }
  return { allowed: true };
}

/**
 * 同一次分析（score + optimize 并行）共享 analyzeSessionId，仅首请求计入限流。
 */
export async function checkAnalyzeRateLimit(
  ipHash: string,
  analyzeSessionId?: string,
): Promise<RateLimitDenied | { allowed: true }> {
  const sessionId = analyzeSessionId?.trim();
  if (!sessionId) return applyAnalyzeRateLimit(ipHash);
  const batchKey = `analyze:batch:${ipHash}:${sessionId}`;
  const blockedKey = `analyze:blocked:${ipHash}:${sessionId}`;
  const count = await redis.incr(batchKey);
  if (count === 1) await redis.expire(batchKey, ANALYZE_SESSION_TTL_SEC);
  if (count > 1) {
    const blocked = await redis.get(blockedKey);
    if (blocked) {
      const resetIn = Number(blocked) || 60;
      return {
        allowed: false,
        resetIn,
        message:
          resetIn >= 3600
            ? `已超出每小时限额（最多 10 次），请 ${resetIn} 秒后重试`
            : `请求过于频繁，1 分钟内最多 2 次，请 ${resetIn} 秒后重试`,
      };
    }
    return { allowed: true };
  }
  const rate = await applyAnalyzeRateLimit(ipHash);
  if (!rate.allowed) {
    await redis.set(blockedKey, String(rate.resetIn), { ex: ANALYZE_SESSION_TTL_SEC });
  }
  return rate;
}

export async function getCachedJson<T>(cacheKey: string): Promise<T | null> {
  const cached = await redis.get<T>(cacheKey);
  return cached ?? null;
}

export function setCachedJson<T>(cacheKey: string, value: T): void {
  void redis.set(cacheKey, value, { ex: CACHE_TTL_SEC }).catch(() => {});
}
