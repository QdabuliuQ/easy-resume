import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createExportSession,
  getExportSession,
} from '@/lib/exportSessionStore';

const g = globalThis as typeof globalThis & {
  __easyResumeExportSessions?: Map<string, unknown>;
};

describe('exportSessionStore', () => {
  beforeEach(() => {
    g.__easyResumeExportSessions = new Map();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete g.__easyResumeExportSessions;
  });

  it('creates and retrieves session', () => {
    const token = createExportSession({ pages: [] }, 'zh');
    expect(token).toBeTruthy();
    const s = getExportSession(token);
    expect(s?.locale).toBe('zh');
    expect(s?.config).toEqual({ pages: [] });
  });

  it('returns null for unknown token', () => {
    expect(getExportSession('missing')).toBeNull();
  });

  it('expires session after TTL', () => {
    const token = createExportSession({ x: 1 }, 'en');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(getExportSession(token)).toBeNull();
  });

  it('prunes expired sessions on create', () => {
    const t1 = createExportSession({ a: 1 }, 'zh');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    createExportSession({ b: 2 }, 'zh');
    expect(getExportSession(t1)).toBeNull();
  });
});
