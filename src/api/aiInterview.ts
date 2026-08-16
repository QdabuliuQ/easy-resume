import type {
  InterviewQuestion,
  InterviewReport,
} from '@/lib/ai/interview/types';

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string; retryAfter?: number };
type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

async function postJson<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: 'no-store',
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) {
    throw new Error('unexpected sse');
  }
  const data = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !data || !data.success) {
    throw new Error((data && !data.success && data.error) || res.statusText || '请求失败');
  }
  return data.data;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { method: 'GET', signal, cache: 'no-store' });
  const data = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !data || !data.success) {
    throw new Error((data && !data.success && data.error) || res.statusText || '请求失败');
  }
  return data.data;
}

export type InterviewPreflightResult = {
  ok: boolean;
  message?: string;
  anchorCount: number;
  anchors: Array<{ moduleType: string; label: string; excerpt: string }>;
};

export async function interviewPreflight(
  /** 生产仅 resumeId；resume 仅本地调试草稿 */
  body: { resumeId?: string; resume?: unknown },
  signal?: AbortSignal,
) {
  return postJson<InterviewPreflightResult>('/api/ai/interview/preflight', body, signal);
}

export type InterviewStartResult = {
  sessionId: string;
  questionCount: number;
  question: InterviewQuestion;
  progress: { index: number; total: number };
};

export async function interviewStart(
  body: {
    resumeId?: string;
    /** 仅本地调试（当前编辑器草稿）；生产请用 resumeId */
    resume?: unknown;
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  },
  signal?: AbortSignal,
) {
  return postJson<InterviewStartResult>('/api/ai/interview/session', body, signal);
}

export async function interviewGetSession(sessionId: string, signal?: AbortSignal) {
  return getJson<{
    sessionId: string;
    status: string;
    questionCount: number;
    currentIndex: number;
    question: InterviewQuestion | null;
    progress: { index: number; total: number };
    answered: number;
    report: InterviewReport | null;
  }>(`/api/ai/interview/session/${sessionId}`, signal);
}

/** 中断本场；unmount / pagehide 用 keepalive，不抛错 */
export function interviewAbandon(sessionId: string): void {
  try {
    void fetch(`/api/ai/interview/session/${sessionId}`, {
      method: 'DELETE',
      keepalive: true,
      cache: 'no-store',
    });
  } catch {
    /* ignore */
  }
}

export type InterviewAnswerResult =
  | {
      phase: 'question';
      question: InterviewQuestion;
      progress: { index: number; total: number };
    }
  | {
      phase: 'reporting';
      progress: { index: number; total: number };
    };

export async function interviewAnswer(
  sessionId: string,
  body: { questionId: string; text?: string; skipped?: boolean },
  signal?: AbortSignal,
) {
  return postJson<InterviewAnswerResult>(
    `/api/ai/interview/session/${sessionId}/answer`,
    body,
    signal,
  );
}

export async function interviewEnd(sessionId: string, signal?: AbortSignal) {
  return postJson<{ phase: 'reporting'; alreadyDone?: boolean }>(
    `/api/ai/interview/session/${sessionId}/end`,
    {},
    signal,
  );
}

export type InterviewReportStreamHandlers = {
  onProgress?: (stage: string) => void;
  onMeta?: (dimensions: InterviewReport['dimensions']) => void;
  onDelta?: (evt: { field: string; index?: number; textDelta: string }) => void;
  onDone?: (report: InterviewReport) => void;
};

function processReportSseLine(line: string, handlers: InterviewReportStreamHandlers): void {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return;
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === '[DONE]') return;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }
  if (j.type === 'error') throw new Error(String(j.message || '报告生成失败'));
  if (j.type === 'report.progress' && typeof j.stage === 'string') {
    handlers.onProgress?.(j.stage);
    return;
  }
  if (j.type === 'report.meta' && j.dimensions && typeof j.dimensions === 'object') {
    handlers.onMeta?.(j.dimensions as InterviewReport['dimensions']);
    return;
  }
  if (j.type === 'report.delta' && typeof j.textDelta === 'string') {
    handlers.onDelta?.({
      field: String(j.field || ''),
      index: typeof j.index === 'number' ? j.index : undefined,
      textDelta: j.textDelta,
    });
    return;
  }
  if (j.type === 'report.done' && j.report && typeof j.report === 'object') {
    handlers.onDone?.(j.report as InterviewReport);
  }
}

export async function interviewReportStream(
  sessionId: string,
  handlers: InterviewReportStreamHandlers,
  signal?: AbortSignal,
): Promise<InterviewReport | null> {
  const res = await fetch(`/api/ai/interview/session/${sessionId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal,
    cache: 'no-store',
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const data = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(data?.error || res.statusText || '报告失败');
    }
    throw new Error((await res.text().catch(() => '')) || '报告失败');
  }
  if (!res.body) throw new Error('无响应体');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalReport: InterviewReport | null = null;
  const wrapped: InterviewReportStreamHandlers = {
    ...handlers,
    onDone: (report) => {
      finalReport = report;
      handlers.onDone?.(report);
    },
  };
  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    if (done) {
      buffer += decoder.decode();
      break;
    }
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) processReportSseLine(line, wrapped);
  }
  for (const line of buffer.split('\n')) processReportSseLine(line, wrapped);
  return finalReport;
}
