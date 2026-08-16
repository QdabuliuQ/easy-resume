import crypto from 'crypto';
import { requireInterviewAuth } from '@/lib/ai/interview/auth';
import { preflightFromResume, resolveInterviewResume } from '@/lib/ai/interview/resolveResume';
import { checkInterviewRateLimit, err, getClientIp, ok } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const rateKey = gate.uid || crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  const rate = await checkInterviewRateLimit(rateKey);
  if (!rate.allowed) return err(rate.message, 429, rate.resetIn);

  let body: { resumeId?: string; resume?: unknown };
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
  return ok({
    ok: pf.ok,
    message: pf.message,
    anchorCount: pf.anchors.length,
    anchors: pf.anchors.slice(0, 12).map((a) => ({
      moduleType: a.moduleType,
      label: a.label,
      excerpt: a.excerpt,
    })),
  });
}
