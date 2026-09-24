import { afterEach, describe, expect, it, vi } from 'vitest';

describe('checkModifyChatRateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('skips rate limit outside production without Redis', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { checkModifyChatRateLimit } = await import('@/lib/ai/score/routeShared');
    expect(await checkModifyChatRateLimit('user-a')).toEqual({ allowed: true });
  });

  it('limits to 20 messages per calendar day in production without Redis', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-24T04:00:00+08:00').getTime() });
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { checkModifyChatRateLimit } = await import('@/lib/ai/score/routeShared');
    const key = `modify-day-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      expect((await checkModifyChatRateLimit(key)).allowed).toBe(true);
      // 避开 2 次/分钟 的短窗限流
      vi.advanceTimersByTime(61_000);
    }
    const denied = await checkModifyChatRateLimit(key);
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.message).toMatch(/每天最多 20 次/);
      expect(denied.resetIn).toBeGreaterThan(0);
    }
  });
});
