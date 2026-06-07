import type {
  ResumeAiAnalyzeResult,
  ResumeAiOptimizeResponse,
  ResumeAiScoreResponse,
} from '@/lib/ai/score/types';

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string; retryAfter?: number };

function createAnalyzeSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function postAnalyze<T>(
  path: string,
  pages: unknown[],
  analyzeSessionId: string,
): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages, analyzeSessionId }),
  });
  const data = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;
  if (!res.ok || !data || data.success !== true) {
    const msg =
      data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : res.statusText || 'AI 分析失败';
    throw new Error(msg);
  }
  return data.data;
}

export async function analyzeResumeScore(
  resumeJson: { pages?: unknown[] },
  analyzeSessionId?: string,
): Promise<ResumeAiScoreResponse> {
  const sessionId = analyzeSessionId ?? createAnalyzeSessionId();
  return postAnalyze<ResumeAiScoreResponse>('/api/ai/score', resumeJson.pages ?? [], sessionId);
}

export async function analyzeResumeOptimize(
  resumeJson: { pages?: unknown[] },
  analyzeSessionId?: string,
): Promise<ResumeAiOptimizeResponse> {
  const sessionId = analyzeSessionId ?? createAnalyzeSessionId();
  return postAnalyze<ResumeAiOptimizeResponse>(
    '/api/ai/optimize',
    resumeJson.pages ?? [],
    sessionId,
  );
}

export async function analyzeResumeWithAi(
  resumeJson: { pages?: unknown[] },
): Promise<ResumeAiAnalyzeResult> {
  const analyzeSessionId = createAnalyzeSessionId();
  const [scoreRes, optimizeRes] = await Promise.all([
    analyzeResumeScore(resumeJson, analyzeSessionId),
    analyzeResumeOptimize(resumeJson, analyzeSessionId),
  ]);
  const { cached: scoreCached, ...score } = scoreRes;
  const { cached: optimizeCached, ...optimize } = optimizeRes;
  void scoreCached;
  void optimizeCached;
  return { ...score, ...optimize };
}
