import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('loadResumeTemplates', () => {
  const prevFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
  });

  it('maps previewImage from public API on client', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          list: [
            {
              id: 'fe',
              title: '前端',
              previewImage: 'https://cdn.example.com/fe.jpg',
              config: { name: '前端', globalStyle: {}, pages: [{ modules: [] }] },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as any;

    // force client branch
    const origWindow = globalThis.window;
    (globalThis as any).window = {};
    try {
      const { loadResumeTemplates } = await import('@/lib/loadResumeTemplates');
      const list = await loadResumeTemplates({ lite: true });
      expect(list[0]?.previewImage).toBe('https://cdn.example.com/fe.jpg');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/templates?lite=1', { cache: 'no-store' });
    } finally {
      if (origWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = origWindow;
    }
  });
});
