import { afterEach, describe, expect, it, vi } from 'vitest';

describe('checkInterviewRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('skips rate limit outside production', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { checkInterviewRateLimit } = await import('@/lib/ai/score/routeShared');
    const r = await checkInterviewRateLimit('any-key');
    expect(r).toEqual({ allowed: true });
  });

  it('uses in-memory bucket in production without Redis', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { checkInterviewRateLimit } = await import('@/lib/ai/score/routeShared');
    const key = `mem-session-${Date.now()}`;
    for (let i = 0; i < 2; i++) {
      const r = await checkInterviewRateLimit(key, 'session');
      expect(r.allowed).toBe(true);
    }
    const denied = await checkInterviewRateLimit(key, 'session');
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.message).toMatch(/1 分钟/);
      expect(denied.resetIn).toBeGreaterThan(0);
    }
  });

  it('rate-limits report kind separately', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { checkInterviewRateLimit } = await import('@/lib/ai/score/routeShared');
    const key = `mem-report-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      expect((await checkInterviewRateLimit(key, 'report')).allowed).toBe(true);
    }
    expect((await checkInterviewRateLimit(key, 'report')).allowed).toBe(false);
  });
});
