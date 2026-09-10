import { afterEach, describe, expect, it, vi } from 'vitest';

describe('preloadResumeFontsForSnap isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('does not add FontFace to the editor document', async () => {
    const add = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      })),
    );
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        add,
        load: vi.fn(async () => []),
        ready: Promise.resolve(),
      },
    });

    const { preloadResumeFontsForSnap } = await import('@/lib/resumeFont');
    await preloadResumeFontsForSnap('https://example.com', 'noto-sans-sc', document);
    expect(add).not.toHaveBeenCalled();
  });
});
