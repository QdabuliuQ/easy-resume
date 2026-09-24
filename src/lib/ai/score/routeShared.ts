import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { decryptAiPayloadJson } from '@/lib/ai/payloadCrypto';

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string; retryAfter?: number };

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

export function getClientIp(req: Pick<NextRequest, 'headers'> | Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

export function parseEncryptedRequestBody(raw: unknown): NextResponse<ApiError> | unknown {
  try {
    return decryptAiPayloadJson(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : '加密载荷解密失败';
    return err(message, 400);
  }
}

async function checkRateLimit(
  redis: Redis,
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

type MemBucket = { t: number[] };
type DayBucket = { day: string; n: number };

function shanghaiYmd(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

function secondsUntilShanghaiMidnight(now = Date.now()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const elapsed = n('hour') * 3600 + n('minute') * 60 + n('second');
  return Math.max(1, 86400 - elapsed);
}

/** AI 帮写：2 次/分钟防刷 + 每天 20 条（上海时区）。有 Redis 用 Redis；生产无 Redis 用内存桶；本地开发跳过。 */
const MODIFY_CHAT_PER_MIN = 2;
const MODIFY_CHAT_PER_DAY = 20;

const modifyChatMemBuckets = new Map<string, MemBucket>();
const modifyChatDayBuckets = new Map<string, DayBucket>();

function checkModifyChatMemMinute(key: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const windowMs = 60_000;
  let bucket = modifyChatMemBuckets.get(key);
  if (!bucket) {
    bucket = { t: [] };
    modifyChatMemBuckets.set(key, bucket);
  }
  bucket.t = bucket.t.filter((ts) => now - ts < windowMs);
  if (bucket.t.length >= MODIFY_CHAT_PER_MIN) {
    const oldest = bucket.t[0] ?? now;
    return { allowed: false, resetIn: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  bucket.t.push(now);
  return { allowed: true, resetIn: 60 };
}

function checkModifyChatMemDay(key: string): RateLimitDenied | { allowed: true } {
  const day = shanghaiYmd();
  const resetIn = secondsUntilShanghaiMidnight();
  let bucket = modifyChatDayBuckets.get(key);
  if (!bucket || bucket.day !== day) {
    bucket = { day, n: 0 };
    modifyChatDayBuckets.set(key, bucket);
  }
  if (bucket.n >= MODIFY_CHAT_PER_DAY) {
    return {
      allowed: false,
      resetIn,
      message: `今日 AI 帮写次数已用完（每天最多 ${MODIFY_CHAT_PER_DAY} 次），请明天再试`,
    };
  }
  bucket.n += 1;
  return { allowed: true };
}

export async function checkModifyChatRateLimit(
  rateKey: string,
): Promise<RateLimitDenied | { allowed: true }> {
  const redis = getRedis();
  if (redis) {
    const day = shanghaiYmd();
    const resetIn = secondsUntilShanghaiMidnight();
    const dayKey = `ratelimit:modify-chat:day:${day}:${rateKey}`;
    const count = await redis.incr(dayKey);
    if (count === 1) await redis.expire(dayKey, resetIn + 120);
    if (count > MODIFY_CHAT_PER_DAY) {
      return {
        allowed: false,
        resetIn,
        message: `今日 AI 帮写次数已用完（每天最多 ${MODIFY_CHAT_PER_DAY} 次），请明天再试`,
      };
    }
    const minuteCheck = await checkRateLimit(
      redis,
      `ratelimit:modify-chat:1m:${rateKey}`,
      MODIFY_CHAT_PER_MIN,
      60,
    );
    if (!minuteCheck.allowed) {
      return {
        allowed: false,
        resetIn: minuteCheck.resetIn,
        message: `请求过于频繁，1 分钟内最多 ${MODIFY_CHAT_PER_MIN} 次，请 ${minuteCheck.resetIn} 秒后重试`,
      };
    }
    return { allowed: true };
  }
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const day = checkModifyChatMemDay(rateKey);
  if (!day.allowed) return day;
  const minute = checkModifyChatMemMinute(rateKey);
  if (!minute.allowed) {
    return {
      allowed: false,
      resetIn: minute.resetIn,
      message: `请求过于频繁，1 分钟内最多 ${MODIFY_CHAT_PER_MIN} 次，请 ${minute.resetIn} 秒后重试`,
    };
  }
  return { allowed: true };
}

/** AI 润色：1 分钟最多 4 次（按 IP）。未配置 Upstash 时跳过限流。 */
export async function checkPolishRateLimit(
  ipHash: string,
): Promise<RateLimitDenied | { allowed: true }> {
  const redis = getRedis();
  if (!redis) return { allowed: true };
  const minuteCheck = await checkRateLimit(redis, `ratelimit:polish:1m:${ipHash}`, 4, 60);
  if (!minuteCheck.allowed) {
    return {
      allowed: false,
      resetIn: minuteCheck.resetIn,
      message: `请求过于频繁，1 分钟内最多 4 次，请 ${minuteCheck.resetIn} 秒后重试`,
    };
  }
  return { allowed: true };
}

/** 语音识别：1 分钟最多 6 次（按 IP）。未配置 Upstash 时跳过限流。 */
export async function checkSpeechRateLimit(
  ipHash: string,
): Promise<RateLimitDenied | { allowed: true }> {
  const redis = getRedis();
  if (!redis) return { allowed: true };
  const minuteCheck = await checkRateLimit(redis, `ratelimit:speech:1m:${ipHash}`, 6, 60);
  if (!minuteCheck.allowed) {
    return {
      allowed: false,
      resetIn: minuteCheck.resetIn,
      message: `请求过于频繁，1 分钟内最多 6 次，请 ${minuteCheck.resetIn} 秒后重试`,
    };
  }
  return { allowed: true };
}

/** 简历文件导入：1 分钟最多 2 次（按 IP）。未配置 Upstash 时跳过限流。 */
export async function checkResumeImportRateLimit(
  ipHash: string,
): Promise<RateLimitDenied | { allowed: true }> {
  const redis = getRedis();
  if (!redis) return { allowed: true };
  const minuteCheck = await checkRateLimit(redis, `ratelimit:resume-import:1m:${ipHash}`, 2, 60);
  if (!minuteCheck.allowed) {
    return {
      allowed: false,
      resetIn: minuteCheck.resetIn,
      message: `请求过于频繁，1 分钟内最多 2 次，请 ${minuteCheck.resetIn} 秒后重试`,
    };
  }
  return { allowed: true };
}

/** AI 面试限流。生产必限流：有 Redis 用 Redis，否则进程内内存桶。本地调试跳过。 */
export type InterviewRateKind = 'session' | 'answer' | 'report';

type InterviewRateCfg = { perMin: number; perHour?: number; perDay?: number };

const INTERVIEW_RATE: Record<InterviewRateKind, InterviewRateCfg> = {
  // session：每天 2 场；perMin 防连点刷
  session: { perMin: 2, perDay: 2 },
  answer: { perMin: 30, perHour: 200 },
  report: { perMin: 3, perHour: 10 },
};

const interviewMemBuckets = new Map<string, MemBucket>();
const interviewDayBuckets = new Map<string, DayBucket>();

function checkMemRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  let bucket = interviewMemBuckets.get(key);
  if (!bucket) {
    bucket = { t: [] };
    interviewMemBuckets.set(key, bucket);
  }
  bucket.t = bucket.t.filter((ts) => now - ts < windowMs);
  if (bucket.t.length >= limit) {
    const oldest = bucket.t[0] ?? now;
    return { allowed: false, resetIn: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  bucket.t.push(now);
  return { allowed: true, resetIn: windowSec };
}

function checkMemDayLimit(
  key: string,
  limit: number,
): RateLimitDenied | { allowed: true } {
  const day = shanghaiYmd();
  const resetIn = secondsUntilShanghaiMidnight();
  let bucket = interviewDayBuckets.get(key);
  if (!bucket || bucket.day !== day) {
    bucket = { day, n: 0 };
    interviewDayBuckets.set(key, bucket);
  }
  if (bucket.n >= limit) {
    return {
      allowed: false,
      resetIn,
      message: `今日 AI 面试次数已用完（每天最多 ${limit} 次），请明天再试`,
    };
  }
  bucket.n += 1;
  return { allowed: true };
}

async function checkRedisDayLimit(
  redis: Redis,
  key: string,
  limit: number,
): Promise<RateLimitDenied | { allowed: true }> {
  const day = shanghaiYmd();
  const resetIn = secondsUntilShanghaiMidnight();
  const redisKey = `ratelimit:interview:session:day:${day}:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, resetIn + 120);
  if (count > limit) {
    return {
      allowed: false,
      resetIn,
      message: `今日 AI 面试次数已用完（每天最多 ${limit} 次），请明天再试`,
    };
  }
  return { allowed: true };
}

export async function checkInterviewRateLimit(
  key: string,
  kind: InterviewRateKind = 'session',
): Promise<RateLimitDenied | { allowed: true }> {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const cfg = INTERVIEW_RATE[kind];
  const redis = getRedis();
  if (redis) {
    if (cfg.perDay != null) {
      const day = await checkRedisDayLimit(redis, key, cfg.perDay);
      if (!day.allowed) return day;
    }
    const minuteCheck = await checkRateLimit(
      redis,
      `ratelimit:interview:${kind}:1m:${key}`,
      cfg.perMin,
      60,
    );
    if (!minuteCheck.allowed) {
      return {
        allowed: false,
        resetIn: minuteCheck.resetIn,
        message: `请求过于频繁，1 分钟内最多 ${cfg.perMin} 次，请 ${minuteCheck.resetIn} 秒后重试`,
      };
    }
    if (cfg.perHour != null) {
      const hourCheck = await checkRateLimit(
        redis,
        `ratelimit:interview:${kind}:1h:${key}`,
        cfg.perHour,
        3600,
      );
      if (!hourCheck.allowed) {
        return {
          allowed: false,
          resetIn: hourCheck.resetIn,
          message: `1 小时内最多 ${cfg.perHour} 次，请 ${hourCheck.resetIn} 秒后重试`,
        };
      }
    }
    return { allowed: true };
  }
  // ponytail: 无 Upstash 时用进程内桶，多实例不共享，但强于生产静默放行
  if (cfg.perDay != null) {
    const day = checkMemDayLimit(`interview:${kind}:day:${key}`, cfg.perDay);
    if (!day.allowed) return day;
  }
  const minute = checkMemRateLimit(`interview:${kind}:1m:${key}`, cfg.perMin, 60);
  if (!minute.allowed) {
    return {
      allowed: false,
      resetIn: minute.resetIn,
      message: `请求过于频繁，1 分钟内最多 ${cfg.perMin} 次，请 ${minute.resetIn} 秒后重试`,
    };
  }
  if (cfg.perHour != null) {
    const hour = checkMemRateLimit(`interview:${kind}:1h:${key}`, cfg.perHour, 3600);
    if (!hour.allowed) {
      return {
        allowed: false,
        resetIn: hour.resetIn,
        message: `1 小时内最多 ${cfg.perHour} 次，请 ${hour.resetIn} 秒后重试`,
      };
    }
  }
  return { allowed: true };
}

