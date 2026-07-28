import { describe, expect, it } from 'vitest';
import { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH, QQ_CALLBACK_PATH } from '@/lib/authPaths';

describe('authPaths', () => {
  it('uses auth base under /api/auth', () => {
    expect(AUTH_BASE_PATH).toBe('/api/auth');
    expect(GITHUB_CALLBACK_PATH).toBe('/api/auth/callback/github');
    expect(QQ_CALLBACK_PATH).toBe('/api/auth/callback/qq');
  });
});
