import { buildModifyChatResult } from '@/lib/ai/modifyChat/result';
import {
  extractResumePatch,
  extractTextFromData,
  MODIFY_CHAT_DATA_START,
  type ModifyChatProtocolEnvelope,
} from '@/lib/ai/modifyChat/protocol';
import type { ModifyChatIntent, ModifyChatMessage, ModifyChatResult } from '@/lib/ai/modifyChat/types';
export type { ModifyChatMessage };
export type ModifyChatStreamStatus = 'classifying' | 'resolving_scope' | 'generating_resume' | 'parsing' | 'retry';

export type ModifyChatStreamHandlers = {
  onIntent?: (intent: ModifyChatIntent) => void;
  onText?: (content: string) => void;
  /** @deprecated use onText */
  onContent?: (content: string) => void;
  onStatus?: (status: ModifyChatStreamStatus, attempt?: number, progressBytes?: number) => void;
  onDataStart?: () => void;
  onResumePatch?: (props: { newResumeJson: unknown; summary: string }) => void;
  onProtocol?: (envelope: ModifyChatProtocolEnvelope) => void;
};

function emitText(handlers: ModifyChatStreamHandlers, content: string) {
  handlers.onText?.(content);
  handlers.onContent?.(content);
}

function processProtocolEnvelope(
  env: ModifyChatProtocolEnvelope,
  handlers: ModifyChatStreamHandlers,
  acc: { lastText: string },
): { result?: ModifyChatResult; error?: string } | null {
  handlers.onProtocol?.(env);
  if (env.error || env.code !== 0) {
    return { error: env.error ?? env.message ?? '请求失败' };
  }
  if (env.meta?.intent) handlers.onIntent?.(env.meta.intent);
  const st = env.meta?.status;
  if (st === 'classifying' || st === 'resolving_scope' || st === 'generating_resume' || st === 'parsing' || st === 'retry') {
    handlers.onStatus?.(st, env.meta?.attempt, env.meta?.progressBytes);
  }
  if (env.marker === MODIFY_CHAT_DATA_START) handlers.onDataStart?.();
  const text = extractTextFromData(env.data);
  if (text) acc.lastText = text;
  if (env.streaming && text) emitText(handlers, text);
  if (env.done) {
    const patch = extractResumePatch(env.data);
    if (patch) {
      handlers.onResumePatch?.({
        newResumeJson: patch.props.newResumeJson,
        summary: text,
      });
    } else if (text) emitText(handlers, text);
    return { result: buildModifyChatResult(env) };
  }
  return null;
}

async function readModifyChatSse(
  body: ReadableStream<Uint8Array>,
  handlers: ModifyChatStreamHandlers,
): Promise<ModifyChatResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: ModifyChatResult | null = null;
  const acc = { lastText: '' };
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
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const raw = trimmed.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const env = JSON.parse(raw) as ModifyChatProtocolEnvelope;
        const evt = processProtocolEnvelope(env, handlers, acc);
        if (evt?.error) throw new Error(evt.error);
        if (evt?.result) finalResult = evt.result;
      } catch (e) {
        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
  }
  for (const line of buffer.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const raw = trimmed.slice(5).trim();
    if (!raw || raw === '[DONE]') continue;
    try {
      const env = JSON.parse(raw) as ModifyChatProtocolEnvelope;
      const evt = processProtocolEnvelope(env, handlers, acc);
      if (evt?.error) throw new Error(evt.error);
      if (evt?.result) finalResult = evt.result;
    } catch (e) {
      if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
    }
  }
  if (!finalResult) {
    throw new Error(acc.lastText.trim() ? '响应未完成' : '模型返回为空');
  }
  if (finalResult.intent === 'modify_resume' && !finalResult.resume) {
    throw new Error('缺少完整 resume JSON');
  }
  return finalResult;
}

const CLIENT_TIMEOUT_MS = 120_000;

export async function modifyChat(
  messages: ModifyChatMessage[],
  resume?: unknown,
  signal?: AbortSignal,
  handlers?: ModifyChatStreamHandlers,
): Promise<ModifyChatResult> {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user' || !last.content.trim()) {
    throw new Error('最后一条须为用户消息');
  }
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), CLIENT_TIMEOUT_MS);
  const onParentAbort = () => ac.abort();
  if (signal) {
    if (signal.aborted) ac.abort();
    else signal.addEventListener('abort', onParentAbort, { once: true });
  }
  try {
    const res = await fetch('/api/ai/modify-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: last.content.trim(),
        history: messages.slice(0, -1),
        resume,
      }),
      signal: ac.signal,
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (ct.includes('application/json')) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || res.statusText || '发送失败');
      }
      throw new Error((await res.text().catch(() => '')) || res.statusText || '发送失败');
    }
    if (!res.body) throw new Error('无响应体');
    return await readModifyChatSse(res.body, handlers ?? {});
  } catch (e) {
    if (ac.signal.aborted && !signal?.aborted) {
      throw new Error('请求超时，请稍后重试');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onParentAbort);
  }
}
