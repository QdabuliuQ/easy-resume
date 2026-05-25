import type { PolishRequest } from '@/lib/ai/polish/types';

function processSseLine(
  line: string,
  onStreamingHtml?: (html: string) => void,
): { html?: string; error?: string } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === '[DONE]') return null;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.error === 'string' && j.error) {
      return { error: j.error };
    }
    if (typeof j.html === 'string') {
      onStreamingHtml?.(j.html);
      return { html: j.html };
    }
  } catch {
    return null;
  }
  return null;
}

async function readPolishSse(
  body: ReadableStream<Uint8Array>,
  onStreamingHtml?: (html: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalHtml = '';
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
      const evt = processSseLine(line, onStreamingHtml);
      if (evt?.error) throw new Error(evt.error);
      if (evt?.html) finalHtml = evt.html;
    }
  }
  for (const line of buffer.split('\n')) {
    const evt = processSseLine(line, onStreamingHtml);
    if (evt?.error) throw new Error(evt.error);
    if (evt?.html) finalHtml = evt.html;
  }
  return finalHtml;
}

export async function polishDescription(
  req: PolishRequest,
  onStreamingHtml?: (htmlSoFar: string) => void,
): Promise<string> {
  const res = await fetch('/api/ai/polish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || res.statusText || '润色失败');
    }
    throw new Error((await res.text().catch(() => '')) || res.statusText || '润色失败');
  }
  if (!res.body) throw new Error('无响应体');
  const html = await readPolishSse(res.body, onStreamingHtml);
  if (!html.trim()) throw new Error('模型返回为空');
  return html;
}
