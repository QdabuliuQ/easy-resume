import { describe, expect, it } from 'vitest';
import { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH } from '@/lib/authPaths';

describe('authPaths', () => {
  it('uses github auth base under /api/github', () => {
    expect(AUTH_BASE_PATH).toBe('/api/github');
    expect(GITHUB_CALLBACK_PATH).toBe('/api/github/callback/github');
  });
});
