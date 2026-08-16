import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteInterviewSession,
  freshExpiry,
  getInterviewSession,
  releaseReportLock,
  replaceOwnerActiveSession,
  saveInterviewSession,
  tryAcquireReportLock,
} from '@/lib/ai/interview/sessionStore';
import type { InterviewSession } from '@/lib/ai/interview/types';

function makeSession(partial: Partial<InterviewSession> & Pick<InterviewSession, 'id' | 'ownerKey'>): InterviewSession {
  const now = Date.now();
  return {
    resume: { pages: [] },
    targetRole: '',
    difficulty: 'medium',
    questionCount: 5,
    questions: [],
    answers: [],
    currentIndex: 0,
    status: 'active',
    createdAt: now,
    expiresAt: freshExpiry(now),
    ...partial,
  };
}

describe('ai interview sessionStore (memory)', () => {
  it('saves and loads session', async () => {
    const s = makeSession({ id: 'sess-a', ownerKey: 'owner-a' });
    await saveInterviewSession(s);
    const got = await getInterviewSession('sess-a');
    expect(got?.id).toBe('sess-a');
    expect(got?.ownerKey).toBe('owner-a');
  });

  it('strips info1 from resume on save', async () => {
    const s = makeSession({
      id: 'sess-strip',
      ownerKey: 'owner-strip',
      resume: {
        pages: [
          {
            modules: [
              { type: 'info1', id: 'i1', options: { name: '秘密' } },
              { type: 'job', id: 'j1', options: { items: [] } },
            ],
          },
        ],
      },
    });
    await saveInterviewSession(s);
    const got = await getInterviewSession('sess-strip');
    const mods = (got?.resume as { pages: { modules: { type: string }[] }[] }).pages[0].modules;
    expect(mods.every((m) => m.type !== 'info1')).toBe(true);
    expect(mods.some((m) => m.type === 'job')).toBe(true);
  });

  it('returns null for expired session', async () => {
    const s = makeSession({
      id: 'sess-expired',
      ownerKey: 'owner-b',
      expiresAt: Date.now() - 1000,
    });
    await saveInterviewSession(s);
    expect(await getInterviewSession('sess-expired')).toBeNull();
  });

  it('replaceOwnerActiveSession drops previous active session', async () => {
    const first = makeSession({ id: 'sess-1', ownerKey: 'owner-c' });
    const second = makeSession({ id: 'sess-2', ownerKey: 'owner-c' });
    await saveInterviewSession(first);
    await replaceOwnerActiveSession('owner-c', second);
    expect(await getInterviewSession('sess-1')).toBeNull();
    expect((await getInterviewSession('sess-2'))?.id).toBe('sess-2');
  });

  it('deleteInterviewSession removes entry', async () => {
    const s = makeSession({ id: 'sess-del', ownerKey: 'owner-d' });
    await saveInterviewSession(s);
    await deleteInterviewSession('sess-del', 'owner-d');
    expect(await getInterviewSession('sess-del')).toBeNull();
  });

  it('report lock is exclusive until release', async () => {
    const id = `lock-${Date.now()}`;
    expect(await tryAcquireReportLock(id)).toBe(true);
    expect(await tryAcquireReportLock(id)).toBe(false);
    await releaseReportLock(id);
    expect(await tryAcquireReportLock(id)).toBe(true);
    await releaseReportLock(id);
  });

  it('interviewStoreError is null outside production', async () => {
    const { interviewStoreError } = await import('@/lib/ai/interview/sessionStore');
    expect(interviewStoreError()).toBeNull();
  });

  it('interviewStoreError requires redis in production', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { interviewStoreError } = await import('@/lib/ai/interview/sessionStore');
    expect(interviewStoreError()).toMatch(/Upstash/);
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
