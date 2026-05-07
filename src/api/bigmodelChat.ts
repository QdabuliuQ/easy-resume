import { withBasePath } from '@/lib/withBasePath';
const BIGMODEL_CHAT_COMPLETIONS_URL = withBasePath('/api/bigmodel/v4/chat/completions');
const CHATANYWHERE_CHAT_COMPLETIONS_URL = withBasePath('/api/chatanywhere/v1/chat/completions');
function formatNestedError(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const o = err as { message?: unknown; code?: unknown };
    const msg = typeof o.message === 'string' ? o.message : '';
    const code = o.code !== undefined && o.code !== null ? String(o.code) : '';
    if (msg && code) return `[${code}] ${msg}`;
    if (msg) return msg;
    if (code) return `[${code}]`;
  }
  return '';
}
export function formatBigmodelResponseError(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  if (typeof d.error === 'string') return d.error;
  if (d.error !== undefined && d.error !== null) {
    const inner = formatNestedError(d.error);
    if (inner) return inner;
  }
  if (typeof d.msg === 'string') return d.msg;
  return '';
}
function httpErrorMessage(data: unknown): string {
  return formatBigmodelResponseError(data);
}
async function postChatCompletionsJsonOnce(
  url: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, stream: false }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(httpErrorMessage(data) || res.statusText || '请求失败');
  }
  return data;
}
export async function postBigmodelChatCompletions(
  body: Record<string, unknown>
): Promise<unknown> {
  try {
    return await postChatCompletionsJsonOnce(BIGMODEL_CHAT_COMPLETIONS_URL, body);
  } catch {
    return await postChatCompletionsJsonOnce(CHATANYWHERE_CHAT_COMPLETIONS_URL, {
      ...body,
      model: 'deepseek-v4-flash',
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
    });
  }
}
function processSseDataLine(line: string, onDelta?: (s: string) => void): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return '';
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === '[DONE]') return '';
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (j.error !== undefined && j.error !== null) {
      const msg = formatBigmodelResponseError(j) || '上游错误';
      throw new Error(msg);
    }
    const choices = j.choices as unknown[] | undefined;
    const c0 = (choices?.[0] ?? null) as Record<string, unknown> | null;
    if (!c0) return '';
    const delta = c0.delta as Record<string, unknown> | undefined;
    const piece = delta?.content;
    if (typeof piece === 'string' && piece.length > 0) {
      onDelta?.(piece);
      return piece;
    }
  } catch (e) {
    if (e instanceof SyntaxError) return '';
    if (e instanceof Error && e.message) throw e;
  }
  return '';
}
export async function readSseToAssistantText(
  body: ReadableStream<Uint8Array> | null,
  onDelta?: (s: string) => void
): Promise<string> {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
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
      full += processSseDataLine(line, onDelta);
    }
  }
  for (const line of buffer.split('\n')) {
    full += processSseDataLine(line, onDelta);
  }
  return full;
}
async function postChatCompletionsStreamOnce(
  url: string,
  body: Record<string, unknown>,
  onDelta?: (s: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const data: unknown = await res.json().catch(() => null);
      throw new Error(httpErrorMessage(data) || res.statusText || '请求失败');
    }
    const t = await res.text().catch(() => '');
    throw new Error(t || res.statusText || '请求失败');
  }
  if (!res.body) throw new Error('无响应体');
  return readSseToAssistantText(res.body, onDelta);
}
export async function postBigmodelChatCompletionsStream(
  body: Record<string, unknown>,
  onDelta?: (s: string) => void
): Promise<string> {
  const { stream: _drop, ...rest } = body;
  const streamBody: Record<string, unknown> = { ...rest, stream: true };
  try {
    return await postChatCompletionsStreamOnce(
      BIGMODEL_CHAT_COMPLETIONS_URL,
      streamBody,
      onDelta
    );
  } catch {
    return await postChatCompletionsStreamOnce(
      CHATANYWHERE_CHAT_COMPLETIONS_URL,
      {
        ...rest,
        model: 'deepseek-v4-flash',
        stream: true,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      },
      onDelta
    );
  }
}
export function chatCompletionAssistantContent(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const o = data as Record<string, unknown>;
  const choices = o.choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';
  const first = choices[0];
  if (!first || typeof first !== 'object') return '';
  const msg = (first as Record<string, unknown>).message;
  if (!msg || typeof msg !== 'object') return '';
  const content = (msg as Record<string, unknown>).content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const p = part as Record<string, unknown>;
      if (typeof p.text === 'string') parts.push(p.text);
    }
    return parts.join('');
  }
  return '';
}
