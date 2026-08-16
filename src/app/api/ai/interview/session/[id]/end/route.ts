import { assertSessionOwner, requireInterviewAuth } from '@/lib/ai/interview/auth';
import {
  getInterviewSession,
  interviewStoreError,
  saveInterviewSession,
} from '@/lib/ai/interview/sessionStore';
import { err, ok } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const storeErr = interviewStoreError();
  if (storeErr) return err(storeErr, 503);

  const id = params.id?.trim();
  if (!id) return err('缺少 sessionId', 400);

  const session = await getInterviewSession(id);
  if (!session) return err('会话不存在或已过期', 404);
  const forbidden = assertSessionOwner(session.ownerKey, gate.ownerKey);
  if (forbidden) return forbidden;

  if (session.status === 'done' && session.report) {
    return ok({ phase: 'reporting' as const, alreadyDone: true });
  }

  session.status = 'reporting';
  await saveInterviewSession(session);
  return ok({ phase: 'reporting' as const });
}
