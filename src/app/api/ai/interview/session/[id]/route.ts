import { assertSessionOwner, requireInterviewAuth } from '@/lib/ai/interview/auth';
import { getInterviewSession } from '@/lib/ai/interview/sessionStore';
import { err, ok } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const id = params.id?.trim();
  if (!id) return err('缺少 sessionId', 400);

  const session = await getInterviewSession(id);
  if (!session) return err('会话不存在或已过期', 404);
  const forbidden = assertSessionOwner(session.ownerKey, gate.ownerKey);
  if (forbidden) return forbidden;

  const q = session.questions[session.currentIndex];
  return ok({
    sessionId: session.id,
    status: session.status,
    questionCount: session.questions.length,
    currentIndex: session.currentIndex,
    question: session.status === 'active' ? q : null,
    progress: { index: session.currentIndex, total: session.questions.length },
    answered: session.answers.length,
    report: session.report || null,
  });
}
