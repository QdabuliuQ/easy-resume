import type {
  ResumeAiAnalyzeResponse,
  ResumeAiAnalyzeResult,
} from '@/lib/ai/score/types';

type ScoreApiSuccess = { success: true; data: ResumeAiAnalyzeResponse };
type ScoreApiError = { success: false; error: string; retryAfter?: number };

export async function analyzeResumeWithAi(
  resumeJson: { pages?: unknown[] },
): Promise<ResumeAiAnalyzeResult> {
  const res = await fetch('/api/ai/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages: resumeJson.pages ?? [] }),
  });
  const data = (await res.json().catch(() => null)) as
    | ScoreApiSuccess
    | ScoreApiError
    | null;
  if (!res.ok || !data || data.success !== true) {
    const msg =
      data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : res.statusText || 'AI 分析失败';
    throw new Error(msg);
  }
  const { cached, ...result } = data.data;
  void cached;
  return result;
}
