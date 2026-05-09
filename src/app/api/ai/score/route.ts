import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { analyzeResumeWithBigmodel, type ResumeAiAnalyzeResult } from '@/api/resumeAiScoreAnalyze';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Upstash Redis 实例（环境变量见 .env.local）
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// ---------------------------------------------------------------------------
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ---------------------------------------------------------------------------
// 标准响应格式
// ---------------------------------------------------------------------------
type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string; retryAfter?: number };

function ok<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data });
}

function err(message: string, status: number, retryAfter?: number): NextResponse<ApiError> {
  const body: ApiError = { success: false, error: message };
  if (retryAfter !== undefined) body.retryAfter = retryAfter;
  const headers: Record<string, string> = {};
  if (retryAfter !== undefined) headers['Retry-After'] = String(retryAfter);
  return NextResponse.json(body, { status, headers });
}

// ---------------------------------------------------------------------------
// 获取真实客户端 IP（兼容常见代理头）
// ---------------------------------------------------------------------------
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Redis 滑动计数器限流
// key: 限流桶 key，limit: 最大次数，windowSec: 窗口秒数
// 返回: { allowed: boolean; remaining: number; resetIn: number }
// ---------------------------------------------------------------------------
async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = now - windowMs;

  // 使用 Redis sorted set 实现滑动窗口
  // member = timestamp:random（避免重复 score）
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  const pipeline = redis.pipeline();
  // 移除窗口外的旧记录
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  // 添加当前请求
  pipeline.zadd(key, { score: now, member });
  // 统计窗口内总数
  pipeline.zcard(key);
  // 设置过期时间（防止 key 永久存在）
  pipeline.expire(key, windowSec + 10);

  const results = await pipeline.exec();
  const count = results[2] as number;

  if (count > limit) {
    // 超出限制，撤销刚才加入的记录
    await redis.zrem(key, member);
    // 找最早一条，估算重置时间
    // zrange withScores 返回 [member, score, member, score, ...]
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
    const resetIn = Math.ceil((oldestScore + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, resetIn: Math.max(resetIn, 1) };
  }

  return { allowed: true, remaining: limit - count, resetIn: windowSec };
}

// ---------------------------------------------------------------------------
// 简历内容缓存（MD5 hash → 分析结果，TTL 5 分钟）
// ---------------------------------------------------------------------------
function hashResumeContent(pages: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(pages)).digest('hex');
}

const CACHE_TTL_SEC = 300; // 5 分钟

async function getCachedResult(hash: string): Promise<ResumeAiAnalyzeResult | null> {
  const cacheKey = `resume:cache:${hash}`;
  const cached = await redis.get<ResumeAiAnalyzeResult>(cacheKey);
  return cached ?? null;
}

async function setCachedResult(hash: string, result: ResumeAiAnalyzeResult): Promise<void> {
  const cacheKey = `resume:cache:${hash}`;
  await redis.set(cacheKey, result, { ex: CACHE_TTL_SEC });
}

// ---------------------------------------------------------------------------
// POST /api/ai/score
// Body: { pages: unknown[] }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // ---------- 1. 解析请求体 ----------
  let body: { pages?: unknown } = {};
  try {
    body = (await req.json()) as { pages?: unknown };
  } catch {
    return err('请求体必须是合法 JSON', 400);
  }

  if (!body.pages || !Array.isArray(body.pages) || body.pages.length === 0) {
    return err('缺少 pages 字段或内容为空', 400);
  }

  // ---------- 2. 限流（IP 维度） ----------
  const ip = getClientIp(req);
  // 对 IP 做 hash 后再存 Redis，避免在 Redis 里明文记录用户 IP
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const minuteKey = `ratelimit:score:1m:${ipHash}`;
  const hourKey = `ratelimit:score:1h:${ipHash}`;

  // 并行检查两个窗口
  const [minuteCheck, hourCheck] = await Promise.all([
    checkRateLimit(minuteKey, 2, 60),
    checkRateLimit(hourKey, 10, 3600),
  ]);

  if (!minuteCheck.allowed) {
    return err(
      `请求过于频繁，1 分钟内最多 2 次，请 ${minuteCheck.resetIn} 秒后重试`,
      429,
      minuteCheck.resetIn,
    );
  }

  if (!hourCheck.allowed) {
    return err(
      `已超出每小时限额（最多 10 次），请 ${hourCheck.resetIn} 秒后重试`,
      429,
      hourCheck.resetIn,
    );
  }

  // ---------- 3. 缓存命中检查 ----------
  const hash = hashResumeContent(body.pages);
  const cached = await getCachedResult(hash);
  if (cached) {
    return ok({ ...cached, cached: true });
  }

  // ---------- 4. 调用 AI 分析 ----------
  let result: ResumeAiAnalyzeResult;
  try {
    result = await analyzeResumeWithBigmodel({ pages: body.pages });
  } catch (e) {
    const message = e instanceof Error ? e.message : '未知错误';
    return err(`AI 分析失败：${message}`, 502);
  }

  // ---------- 5. 写入缓存（不阻塞响应）----------
  setCachedResult(hash, result).catch(() => {
    // 缓存写入失败不影响主流程，忽略
  });

  return ok({ ...result, cached: false });
}
