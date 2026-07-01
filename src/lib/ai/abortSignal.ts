export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  return e instanceof Error && e.name === 'AbortError';
}

/** 将 LLM / Redis 等外部 fetch 错误转为可读文案 */
export function formatExternalError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const causeMsg = e.cause instanceof Error ? e.cause.message : String(e.cause ?? '');
  const detail = `${e.message} ${causeMsg} ${e.stack ?? ''}`;
  if (
    detail.includes('127.0.0.1:443') ||
    detail.includes('@xenova/transformers') ||
    detail.includes('huggingface')
  ) {
    return '本地 RAG 模型无法下载（HuggingFace 被代理拦截），已自动降级；若仍失败请关闭失效 VPN/代理后重试';
  }
  if (e.message === 'fetch failed') {
    const hint = causeMsg || '网络连接失败';
    return `AI 服务连接失败（${hint}），请检查网络或代理配置`;
  }
  if (causeMsg && !e.message.includes(causeMsg)) return `${e.message}（${causeMsg}）`;
  return e.message;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

/** 将上游 signal（如 req.signal）链接到本地 AbortController */
export function linkAbortSignal(parent?: AbortSignal): AbortController {
  const ac = new AbortController();
  if (!parent) return ac;
  if (parent.aborted) {
    ac.abort();
    return ac;
  }
  const onAbort = () => ac.abort();
  parent.addEventListener('abort', onAbort, { once: true });
  return ac;
}

/** 消费 LLM 流；signal 触发时调用 iterator.return 终止底层请求 */
export async function consumeAsyncIterable<T>(
  iterable: AsyncIterable<T>,
  onItem: (item: T) => void,
  signal?: AbortSignal,
): Promise<void> {
  const iter = iterable[Symbol.asyncIterator]();
  try {
    while (true) {
      throwIfAborted(signal);
      const step = await iter.next();
      if (step.done) break;
      throwIfAborted(signal);
      onItem(step.value);
    }
  } catch (e) {
    throwIfAborted(signal);
    throw e;
  } finally {
    if (signal?.aborted && typeof iter.return === 'function') {
      await iter.return(undefined as never).catch(() => undefined);
    }
  }
}
