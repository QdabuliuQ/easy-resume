import { describe, expect, it, vi } from 'vitest';

describe('checkInterviewRateLimit', () => {
  it('skips rate limit outside production', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    const { checkInterviewRateLimit } = await import('@/lib/ai/score/routeShared');
    const r = await checkInterviewRateLimit('any-key');
    expect(r).toEqual({ allowed: true });
    vi.unstubAllEnvs();
  });
});
