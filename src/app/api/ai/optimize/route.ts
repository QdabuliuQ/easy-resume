/**
 * POST /api/ai/optimize — 简历 AI 字段优化建议
 */
import crypto from 'crypto';
import { type NextRequest } from 'next/server';
import { analyzeResumeOptimize } from '@/lib/ai/score/service';
import {
  checkAnalyzeRateLimit,
  err,
  getCachedJson,
  getClientIp,
  hashResumeContent,
  ok,
  parseAnalyzeBody,
  parseEncryptedRequestBody,
  setCachedJson,
  type AnalyzeRequestBody,
} from '@/lib/ai/score/routeShared';
import type { ResumeAiOptimizeResult } from '@/lib/ai/score/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return err('请求体必须是合法 JSON', 400);
    }
    const decrypted = parseEncryptedRequestBody(raw);
    if (decrypted instanceof Response) return decrypted;
    const body = decrypted as AnalyzeRequestBody;
    const invalid = parseAnalyzeBody(body);
    if (invalid) return invalid;
    const ipHash = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
    const rate = await checkAnalyzeRateLimit(ipHash, body.analyzeSessionId);
    if (!rate.allowed) return err(rate.message, 429, rate.resetIn);
    const hash = hashResumeContent(body.pages);
    const cacheKey = `resume:optimize:${hash}`;
    const cached = await getCachedJson<ResumeAiOptimizeResult>(cacheKey);
    if (cached) return ok({ ...cached, cached: true });
    let result: ResumeAiOptimizeResult;
    try {
      result = await analyzeResumeOptimize({ pages: body.pages });
    } catch (e) {
      const message = e instanceof Error ? e.message : '未知错误';
      return err(`AI 优化建议失败：${message}`, 502);
    }
    setCachedJson(cacheKey, result);
    return ok({ ...result, cached: false });
  } catch (e) {
    console.error('[api/ai/optimize]', e);
    const message = e instanceof Error ? e.message : '未知错误';
    return err(`服务异常：${message}`, 500);
  }
}
