import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const generateInterviewQuestions = vi.fn();
const targetRoleFromResume = vi.fn();
const checkInterviewRateLimit = vi.fn();

vi.mock('@/auth', () => ({
  auth: () => auth(),
}));

vi.mock('@/lib/ai/interview/service', () => ({
  generateInterviewQuestions: (...args: unknown[]) => generateInterviewQuestions(...args),
  targetRoleFromResume: (...args: unknown[]) => targetRoleFromResume(...args),
  generateInterviewReport: vi.fn(),
}));

vi.mock('@/lib/ai/score/routeShared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/score/routeShared')>(
    '@/lib/ai/score/routeShared',
  );
  return {
    ...actual,
    checkInterviewRateLimit: (...args: unknown[]) => checkInterviewRateLimit(...args),
  };
});

import { POST as preflightPost } from '@/app/api/ai/interview/preflight/route';
import { POST as sessionPost } from '@/app/api/ai/interview/session/route';
import { POST as answerPost } from '@/app/api/ai/interview/session/[id]/answer/route';
import { POST as endPost } from '@/app/api/ai/interview/session/[id]/end/route';
import { DELETE as sessionDelete, GET as sessionGet } from '@/app/api/ai/interview/session/[id]/route';
import {
  getInterviewSession,
  saveInterviewSession,
} from '@/lib/ai/interview/sessionStore';
import type { InterviewSession } from '@/lib/ai/interview/types';
import { freshExpiry } from '@/lib/ai/interview/sessionStore';

const richResume = {
  pages: [
    {
      modules: [
        {
          type: 'job',
          id: 'j1',
          options: {
            items: [
              {
                id: 'ji1',
                company: 'Acme',
                description: '负责性能优化与组件化落地，推动首屏指标改善',
              },
            ],
          },
        },
        {
          type: 'project',
          id: 'p1',
          options: {
            items: [
              {
                id: 'pi1',
                name: '编辑器',
                description: '模块化渲染与实时预览，支持 PDF 导出',
              },
            ],
          },
        },
      ],
    },
  ],
};

async function readJson(res: Response) {
  return res.json() as Promise<{ success?: boolean; data?: unknown; error?: string }>;
}

describe('ai interview API', () => {
  const prevNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    auth.mockReset();
    generateInterviewQuestions.mockReset();
    targetRoleFromResume.mockReset();
    checkInterviewRateLimit.mockReset();
    checkInterviewRateLimit.mockResolvedValue({ allowed: true });
    vi.stubEnv('NODE_ENV', 'development');
    auth.mockResolvedValue(null);
    targetRoleFromResume.mockReturnValue('前端工程师');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NODE_ENV = prevNodeEnv;
  });

  it('preflight returns anchors for diggable resume', async () => {
    const res = await preflightPost(
      new Request('http://localhost/api/ai/interview/preflight', {
        method: 'POST',
        body: JSON.stringify({ resume: richResume }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ ok: true });
    expect((body.data as { anchorCount: number }).anchorCount).toBeGreaterThanOrEqual(2);
  });

  it('preflight rejects thin resume', async () => {
    const res = await preflightPost(
      new Request('http://localhost/api/ai/interview/preflight', {
        method: 'POST',
        body: JSON.stringify({ resume: { pages: [] } }),
      }),
    );
    const body = await readJson(res);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ ok: false });
  });

  it('session create returns first question with difficulty', async () => {
    generateInterviewQuestions.mockResolvedValueOnce([
      {
        id: 'q1',
        index: 0,
        text: '你在 Acme 如何做性能优化？',
        anchor: { moduleType: 'job', label: 'Acme', excerpt: '...' },
        depth: 'L1',
      },
      {
        id: 'q2',
        index: 1,
        text: '编辑器项目里你的贡献边界？',
        anchor: { moduleType: 'project', label: '编辑器', excerpt: '...' },
        depth: 'L1',
      },
    ]);

    const res = await sessionPost(
      new Request('http://localhost/api/ai/interview/session', {
        method: 'POST',
        body: JSON.stringify({
          resume: richResume,
          questionCount: 5,
          difficulty: 'hard',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.success).toBe(true);
    const data = body.data as {
      sessionId: string;
      difficulty: string;
      question: { id: string; text: string };
      progress: { index: number; total: number };
    };
    expect(data.sessionId).toBeTruthy();
    expect(data.difficulty).toBe('hard');
    expect(data.question.id).toBe('q1');
    expect(data.progress).toEqual({ index: 0, total: 2 });
    expect(generateInterviewQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        difficulty: 'hard',
        targetRole: '前端工程师',
        questionCount: 5,
      }),
    );

    const stored = await getInterviewSession(data.sessionId);
    expect(stored?.difficulty).toBe('hard');
    expect(stored?.targetRole).toBe('前端工程师');
  });

  it('answer advances and end moves to reporting', async () => {
    const now = Date.now();
    const session: InterviewSession = {
      id: 'api-sess-1',
      ownerKey: 'dev-local',
      resume: richResume,
      targetRole: '前端',
      difficulty: 'medium',
      questionCount: 2,
      questions: [
        {
          id: 'q1',
          index: 0,
          text: '题1',
          anchor: { moduleType: 'job', label: 'A', excerpt: '足够长的摘要文本内容' },
          depth: 'L1',
        },
        {
          id: 'q2',
          index: 1,
          text: '题2',
          anchor: { moduleType: 'project', label: 'B', excerpt: '足够长的摘要文本内容' },
          depth: 'L1',
        },
      ],
      answers: [],
      currentIndex: 0,
      status: 'active',
      createdAt: now,
      expiresAt: freshExpiry(now),
    };
    await saveInterviewSession(session);

    const ans1 = await answerPost(
      new Request('http://localhost/api/ai/interview/session/api-sess-1/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: 'q1', text: '这是我的回答内容' }),
      }),
      { params: { id: 'api-sess-1' } },
    );
    expect(ans1.status).toBe(200);
    const d1 = (await readJson(ans1)).data as { phase: string; question?: { id: string } };
    expect(d1.phase).toBe('question');
    expect(d1.question?.id).toBe('q2');

    const ans2 = await answerPost(
      new Request('http://localhost/api/ai/interview/session/api-sess-1/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: 'q2', skipped: true }),
      }),
      { params: { id: 'api-sess-1' } },
    );
    const d2 = (await readJson(ans2)).data as { phase: string };
    expect(d2.phase).toBe('reporting');

    const got = await sessionGet(new Request('http://localhost'), {
      params: { id: 'api-sess-1' },
    });
    const g = (await readJson(got)).data as { status: string; answered: number };
    expect(g.status).toBe('reporting');
    expect(g.answered).toBe(2);
  });

  it('rejects oversized answer', async () => {
    const now = Date.now();
    await saveInterviewSession({
      id: 'api-sess-long',
      ownerKey: 'dev-local',
      resume: richResume,
      targetRole: '前端',
      difficulty: 'medium',
      questionCount: 1,
      questions: [
        {
          id: 'q1',
          index: 0,
          text: '题1',
          anchor: { moduleType: 'job', label: 'A', excerpt: '足够长的摘要文本内容' },
          depth: 'L1',
        },
      ],
      answers: [],
      currentIndex: 0,
      status: 'active',
      createdAt: now,
      expiresAt: freshExpiry(now),
    });
    const res = await answerPost(
      new Request('http://localhost/api/ai/interview/session/api-sess-long/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: 'q1', text: '字'.repeat(4001) }),
      }),
      { params: { id: 'api-sess-long' } },
    );
    expect(res.status).toBe(400);
    expect((await readJson(res)).error).toMatch(/过长/);
  });

  it('end marks session reporting', async () => {
    const now = Date.now();
    await saveInterviewSession({
      id: 'api-sess-end',
      ownerKey: 'dev-local',
      resume: richResume,
      targetRole: '',
      difficulty: 'easy',
      questionCount: 5,
      questions: [
        {
          id: 'q1',
          index: 0,
          text: '题',
          anchor: { moduleType: 'job', label: 'A', excerpt: '足够长的摘要文本内容' },
          depth: 'L1',
        },
      ],
      answers: [{ questionId: 'q1', text: '答' }],
      currentIndex: 0,
      status: 'active',
      createdAt: now,
      expiresAt: freshExpiry(now),
    });

    const res = await endPost(new Request('http://localhost', { method: 'POST' }), {
      params: { id: 'api-sess-end' },
    });
    expect(res.status).toBe(200);
    expect((await readJson(res)).data).toMatchObject({ phase: 'reporting' });
    expect((await getInterviewSession('api-sess-end'))?.status).toBe('reporting');
  });

  it('DELETE abandons session', async () => {
    const now = Date.now();
    await saveInterviewSession({
      id: 'api-sess-abandon',
      ownerKey: 'dev-local',
      resume: richResume,
      targetRole: '',
      difficulty: 'medium',
      questionCount: 5,
      questions: [
        {
          id: 'q1',
          index: 0,
          text: '题',
          anchor: { moduleType: 'job', label: 'A', excerpt: '足够长的摘要文本内容' },
          depth: 'L1',
        },
      ],
      answers: [{ questionId: 'q1', text: '答一半' }],
      currentIndex: 1,
      status: 'active',
      createdAt: now,
      expiresAt: freshExpiry(now),
    });

    const res = await sessionDelete(new Request('http://localhost', { method: 'DELETE' }), {
      params: { id: 'api-sess-abandon' },
    });
    expect(res.status).toBe(200);
    expect((await readJson(res)).data).toMatchObject({ abandoned: true });
    expect(await getInterviewSession('api-sess-abandon')).toBeNull();
  });

  it('production anonymous session is 401', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    auth.mockResolvedValue(null);
    const res = await sessionPost(
      new Request('http://localhost/api/ai/interview/session', {
        method: 'POST',
        body: JSON.stringify({ resume: richResume }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
