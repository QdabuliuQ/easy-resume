import { createHash, randomUUID } from 'crypto';
import { requireInterviewAuth } from '@/lib/ai/interview/auth';
import { preflightFromResume, resolveInterviewResume } from '@/lib/ai/interview/resolveResume';
import { generateInterviewQuestions, targetRoleFromResume } from '@/lib/ai/interview/service';
import { freshExpiry, replaceOwnerActiveSession } from '@/lib/ai/interview/sessionStore';
import { clampQuestionCount, normalizeInterviewDifficulty, type InterviewSession } from '@/lib/ai/interview/types';
import { checkInterviewRateLimit, err, getClientIp, ok } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const rateKey = gate.uid || createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  const rate = await checkInterviewRateLimit(rateKey);
  if (!rate.allowed) return err(rate.message, 429, rate.resetIn);

  let body: {
    resumeId?: string;
    resume?: unknown;
    questionCount?: number;
    difficulty?: string;
  };
  try {
    body = await req.json();
  } catch {
    return err('请求体必须是 JSON', 400);
  }

  const resolved = await resolveInterviewResume({
    uid: gate.uid,
    isDev: gate.isDev,
    resumeId: body.resumeId,
    resume: body.resume,
  });
  if ('error' in resolved) return err(resolved.error, resolved.status);

  const pf = preflightFromResume(resolved.resume);
  if (!pf.ok) return err(pf.message || '无法开始面试', 400);

  const questionCount = clampQuestionCount(body.questionCount);
  const difficulty = normalizeInterviewDifficulty(body.difficulty);
  const targetRole = targetRoleFromResume(resolved.resume);

  let questions;
  try {
    questions = await generateInterviewQuestions({
      resume: resolved.resume,
      anchors: pf.anchors,
      questionCount,
      targetRole,
      difficulty,
    });
  } catch (e) {
    console.error('[interview/session]', e);
    return err(e instanceof Error ? e.message : '出题失败', 500);
  }

  const now = Date.now();
  const session: InterviewSession = {
    id: randomUUID(),
    ownerKey: gate.ownerKey,
    resumeId: resolved.resumeId,
    resume: resolved.resume,
    targetRole,
    difficulty,
    questionCount,
    questions,
    answers: [],
    currentIndex: 0,
    status: 'active',
    createdAt: now,
    expiresAt: freshExpiry(now),
  };
  await replaceOwnerActiveSession(gate.ownerKey, session);

  return ok({
    sessionId: session.id,
    questionCount: session.questions.length,
    difficulty: session.difficulty,
    question: session.questions[0],
    progress: { index: 0, total: session.questions.length },
  });
}
