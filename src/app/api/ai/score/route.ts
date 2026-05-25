/**
 * POST /api/ai/score — 简历 AI 智能评分与字段优化建议
 *
 * 调用链：
 *   编辑器 AI 评分面板 → src/api/analyzeResume.ts → 本路由
 *   → LangChain（src/lib/ai/score/service.ts）→ ChatAnywhere
 *
 * 环境变量：
 *   CHATANYWHERE_API_KEY      — 必填，LLM 调用
 *   UPSTASH_REDIS_REST_URL    — 必填，限流 + 结果缓存
 *   UPSTASH_REDIS_REST_TOKEN  — 必填
 *
 * 请求体（JSON）：
 *   { pages: unknown[] } — 简历 pages 数组（与编辑器 config.pages 结构一致）
 *
 * 成功响应：
 *   { success: true, data: ResumeAiAnalyzeResult & { cached?: boolean } }
 *   data.totalScore          — 0-100 综合评分
 *   data.dimensionEvaluate   — 四大维度评价（结构/STAR/用词/量化）
 *   data.fieldOptimizeList   — 逐字段优化建议
 *   data.cached              — true 表示命中 Redis 缓存，未重新调用 LLM
 *
 * 失败响应：
 *   { success: false, error: string, retryAfter?: number }
 *   429 时带 Retry-After 头，retryAfter 为秒数
 *
 * 限流策略（按客户端 IP，SHA256 哈希后存 Redis）：
 *   1 分钟最多 2 次 / 1 小时最多 10 次
 *
 * 缓存策略：
 *   pages JSON 的 MD5 → Redis，TTL 5 分钟，相同内容重复分析直接返回缓存
 */
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { analyzeResumeWithAi } from '@/lib/ai/score/service';
import type { ResumeAiAnalyzeResult } from '@/lib/ai/score/types';
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
// 获取真实客户端 IP（兼容 Nginx / CDN 等反向代理）
// 优先 x-forwarded-for 首段，其次 x-real-ip，兜底 127.0.0.1
// ---------------------------------------------------------------------------
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Redis 滑动窗口限流（Sorted Set）
//
// 原理：
//   score = 请求时间戳，member = timestamp:random
//   每次请求：清理窗口外记录 → 写入当前记录 → 统计窗口内总数
//   超出 limit 则撤销本次写入，并计算最早记录的过期时间作为 resetIn
//
// @param key       Redis key，如 ratelimit:score:1m:{ipHash}
// @param limit     窗口内允许的最大请求数
// @param windowSec 窗口长度（秒）
// @returns allowed   是否放行
//          remaining 剩余配额（拒绝时为 0）
//          resetIn    距离配额恢复的秒数
// ---------------------------------------------------------------------------
async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = now - windowMs;

  // member 带随机后缀，避免同一毫秒多次请求 score 冲突
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zadd(key, { score: now, member });
  pipeline.zcard(key);
  pipeline.expire(key, windowSec + 10);

  const results = await pipeline.exec();
  const count = results[2] as number;

  if (count > limit) {
    // 超限：回滚本次写入
    await redis.zrem(key, member);
    // zrange withScores 返回 [member, score, member, score, ...]
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
    const resetIn = Math.ceil((oldestScore + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, resetIn: Math.max(resetIn, 1) };
  }

  return { allowed: true, remaining: limit - count, resetIn: windowSec };
}

// ---------------------------------------------------------------------------
// 简历内容缓存
// 相同 pages JSON → 相同 MD5 → 5 分钟内直接返回，节省 LLM 调用
// ---------------------------------------------------------------------------
function hashResumeContent(pages: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(pages)).digest('hex');
}

const CACHE_TTL_SEC = 300;

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

  // ---------- 2. 限流（IP 维度，双窗口并行检查） ----------
  const ip = getClientIp(req);
  // IP 哈希后存 Redis，避免明文记录用户 IP
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const minuteKey = `ratelimit:score:1m:${ipHash}`;
  const hourKey = `ratelimit:score:1h:${ipHash}`;

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

  // ---------- 3. 缓存命中 → 直接返回，跳过 LLM ----------
  const hash = hashResumeContent(body.pages);
  const cached = await getCachedResult(hash);
  if (cached) {
    return ok({ ...cached, cached: true });
  }

  // ---------- 4. LangChain 调用 ChatAnywhere 分析 ----------
  let result: ResumeAiAnalyzeResult;
  try {
    result = await analyzeResumeWithAi({ pages: body.pages });
  } catch (e) {
    const message = e instanceof Error ? e.message : '未知错误';
    return err(`AI 分析失败：${message}`, 502);
  }

  // ---------- 5. 异步写入缓存（失败不影响响应） ----------
  setCachedResult(hash, result).catch(() => {});

  return ok({ ...result, cached: false });
}
