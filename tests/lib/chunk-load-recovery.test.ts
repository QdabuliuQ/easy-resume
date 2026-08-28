import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_KEY,
  clearChunkReloadMark,
  isChunkLoadError,
  isNextStaticChunkScript,
  reloadForChunkError,
  shouldReloadForChunkError,
} from '@/lib/chunkLoadRecovery';

describe('chunkLoadRecovery', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('detects chunk load errors', () => {
    expect(isChunkLoadError(new Error('Loading chunk 4272 failed.'))).toBe(true);
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'x' })).toBe(false);
    expect(isChunkLoadError(new Error('network'))).toBe(false);
  });

  it('reloads once within cooldown window', () => {
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    expect(reloadForChunkError()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads when cooldown expired', () => {
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    sessionStorage.setItem(
      CHUNK_RELOAD_KEY,
      String(Date.now() - CHUNK_RELOAD_COOLDOWN_MS - 1),
    );
    expect(reloadForChunkError()).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('clears reload mark after successful load', () => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    clearChunkReloadMark();
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
    expect(shouldReloadForChunkError()).toBe(true);
  });

  it('matches next static chunk scripts', () => {
    expect(
      isNextStaticChunkScript('https://resume.qdabuliuq.cn/_next/static/chunks/4272.js'),
    ).toBe(true);
    expect(isNextStaticChunkScript('/assets/app.js')).toBe(false);
  });
});
