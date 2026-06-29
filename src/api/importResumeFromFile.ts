import type { ImportedPagesPayload } from '@/lib/ai/resumeImport/schema';
import type { ResumeImportStreamEvent } from '@/lib/ai/resumeImport/streamTypes';

type ApiError = { success: false; error: string; retryAfter?: number };

function processSseLine(
  line: string,
  onEvent?: (event: ResumeImportStreamEvent) => void,
): ResumeImportStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === '[DONE]') return null;
  try {
    const j = JSON.parse(raw) as ResumeImportStreamEvent;
    onEvent?.(j);
    return j;
  } catch {
    return null;
  }
}

async function readResumeImportSse(
  body: ReadableStream<Uint8Array>,
  onEvent?: (event: ResumeImportStreamEvent) => void,
): Promise<ImportedPagesPayload['pages']> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPages: ImportedPagesPayload['pages'] | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    if (done) {
      buffer += decoder.decode();
      break;
    }
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const evt = processSseLine(line, onEvent);
      if (evt && 'error' in evt && evt.error) throw new Error(evt.error);
      if (evt && 'done' in evt && evt.done) finalPages = evt.pages;
      else if (evt && 'pages' in evt && evt.pages) finalPages = evt.pages;
    }
  }
  for (const line of buffer.split('\n')) {
    const evt = processSseLine(line, onEvent);
    if (evt && 'error' in evt && evt.error) throw new Error(evt.error);
    if (evt && 'done' in evt && evt.done) finalPages = evt.pages;
    else if (evt && 'pages' in evt && evt.pages) finalPages = evt.pages;
  }
  if (!finalPages?.length) throw new Error('简历识别失败');
  return finalPages;
}

export async function importResumeFromFile(
  file: File,
  onEvent?: (event: ResumeImportStreamEvent) => void,
  signal?: AbortSignal,
): Promise<ImportedPagesPayload['pages']> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/ai/resume-import', {
    method: 'POST',
    body: form,
    signal,
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const data = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(data?.error || res.statusText || '简历识别失败');
    }
    throw new Error((await res.text().catch(() => '')) || res.statusText || '简历识别失败');
  }
  if (!res.body) throw new Error('无响应体');
  return readResumeImportSse(res.body, onEvent);
}
