import { describe, expect, it } from 'vitest';
import {
  deleteInterviewSession,
  freshExpiry,
  getInterviewSession,
  replaceOwnerActiveSession,
  saveInterviewSession,
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
});
