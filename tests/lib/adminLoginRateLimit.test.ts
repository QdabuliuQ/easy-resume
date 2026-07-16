import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetAdminLoginRateLimitForTests,
  checkAdminLoginAllowed,
  clearAdminLoginFail,
  recordAdminLoginFail,
} from '@/lib/adminLoginRateLimit';

describe('adminLoginRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetAdminLoginRateLimitForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetAdminLoginRateLimitForTests();
  });

  it('allows then locks after 5 fails', () => {
    const ip = '1.2.3.4';
    expect(checkAdminLoginAllowed(ip).ok).toBe(true);
    for (let i = 0; i < 5; i++) recordAdminLoginFail(ip);
    const blocked = checkAdminLoginAllowed(ip);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('clears on success path', () => {
    const ip = '5.6.7.8';
    for (let i = 0; i < 4; i++) recordAdminLoginFail(ip);
    clearAdminLoginFail(ip);
    expect(checkAdminLoginAllowed(ip).ok).toBe(true);
  });

  it('unlocks after lock window', () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 5; i++) recordAdminLoginFail(ip);
    expect(checkAdminLoginAllowed(ip).ok).toBe(false);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(checkAdminLoginAllowed(ip).ok).toBe(true);
  });
});
