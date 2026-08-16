import { createHash } from 'crypto';
import { assertSessionOwner, requireInterviewAuth } from '@/lib/ai/interview/auth';
import {
  getInterviewSession,
  interviewStoreError,
  saveInterviewSession,
} from '@/lib/ai/interview/sessionStore';
import { INTERVIEW_ANSWER_MAX_CHARS } from '@/lib/ai/interview/types';
import { checkInterviewRateLimit, err, getClientIp, ok } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const storeErr = interviewStoreError();
  if (storeErr) return err(storeErr, 503);

  const rateKey = gate.uid || createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  const rate = await checkInterviewRateLimit(rateKey, 'answer');
  if (!rate.allowed) return err(rate.message, 429, rate.resetIn);

  const id = params.id?.trim();
  if (!id) return err('缺少 sessionId', 400);

  const session = await getInterviewSession(id);
  if (!session) return err('会话不存在或已过期', 404);
  const forbidden = assertSessionOwner(session.ownerKey, gate.ownerKey);
  if (forbidden) return forbidden;
  if (session.status !== 'active') return err('会话已结束', 400);

  let body: { questionId?: string; text?: string; skipped?: boolean };
  try {
    body = await req.json();
  } catch {
    return err('请求体必须是 JSON', 400);
  }

  const current = session.questions[session.currentIndex];
  if (!current) return err('没有待答题目', 400);
  if (body.questionId && body.questionId !== current.id) {
    return err('题目已过期，请刷新会话', 409);
  }

  const skipped = Boolean(body.skipped);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!skipped && text.length < 2) return err('请先作答或选择跳过', 400);
  if (!skipped && text.length > INTERVIEW_ANSWER_MAX_CHARS) {
    return err(`作答过长，最多 ${INTERVIEW_ANSWER_MAX_CHARS} 字`, 400);
  }

  session.answers.push({
    questionId: current.id,
    text: skipped ? undefined : text,
    skipped,
  });
  session.currentIndex += 1;

  if (session.currentIndex >= session.questions.length) {
    session.status = 'reporting';
    await saveInterviewSession(session);
    return ok({
      phase: 'reporting' as const,
      progress: { index: session.questions.length, total: session.questions.length },
    });
  }

  await saveInterviewSession(session);
  const next = session.questions[session.currentIndex]!;
  return ok({
    phase: 'question' as const,
    question: next,
    progress: { index: session.currentIndex, total: session.questions.length },
  });
}
