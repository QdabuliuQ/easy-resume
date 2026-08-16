import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => auth(),
}));

import {
  assertSessionOwner,
  requireInterviewAuth,
} from '@/lib/ai/interview/auth';

describe('ai interview auth', () => {
  const prev = process.env.NODE_ENV;

  afterEach(() => {
    auth.mockReset();
    vi.unstubAllEnvs();
    process.env.NODE_ENV = prev;
  });

  it('allows anonymous in non-production as dev-local', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    auth.mockResolvedValue(null);
    const gate = await requireInterviewAuth();
    expect('error' in gate).toBe(false);
    if ('error' in gate) return;
    expect(gate.ownerKey).toBe('dev-local');
    expect(gate.uid).toBeUndefined();
    expect(gate.isDev).toBe(true);
  });

  it('rejects anonymous in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    auth.mockResolvedValue(null);
    const gate = await requireInterviewAuth();
    expect('error' in gate).toBe(true);
    if (!('error' in gate)) return;
    expect(gate.error.status).toBe(401);
  });

  it('uses uid as ownerKey when logged in', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    auth.mockResolvedValue({ user: { uid: 'u-42' } });
    const gate = await requireInterviewAuth();
    expect(gate).toMatchObject({ ownerKey: 'u-42', uid: 'u-42', isDev: false });
  });

  it('assertSessionOwner returns 403 on mismatch', () => {
    expect(assertSessionOwner('a', 'a')).toBeNull();
    const forbidden = assertSessionOwner('a', 'b');
    expect(forbidden?.status).toBe(403);
  });
});
