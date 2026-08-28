export const CHUNK_RELOAD_KEY = 'easy-resume:chunk-reload-at';
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

export function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false;
  if (reason instanceof Error) {
    if (reason.name === 'ChunkLoadError') return true;
    const msg = reason.message;
    return (
      /Loading chunk \d+ failed/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg)
    );
  }
  if (typeof reason === 'string') {
    return (
      /Loading chunk \d+ failed/i.test(reason) ||
      /ChunkLoadError/i.test(reason) ||
      /Failed to fetch dynamically imported module/i.test(reason)
    );
  }
  return false;
}

export function shouldReloadForChunkError(now = Date.now()): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!last) return true;
    const at = Number.parseInt(last, 10);
    return !Number.isFinite(at) || now - at >= CHUNK_RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markChunkReload(now = Date.now()): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  } catch {
    /* ignore */
  }
}

export function clearChunkReloadMark(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

export function reloadForChunkError(now = Date.now()): boolean {
  if (!shouldReloadForChunkError(now)) return false;
  markChunkReload(now);
  window.location.reload();
  return true;
}

export function isNextStaticChunkScript(src: string): boolean {
  return src.includes('/_next/static/chunks/');
}
