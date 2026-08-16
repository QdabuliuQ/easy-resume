import { assertSessionOwner, requireInterviewAuth } from '@/lib/ai/interview/auth';
import { generateInterviewReport } from '@/lib/ai/interview/service';
import { getInterviewSession, saveInterviewSession } from '@/lib/ai/interview/sessionStore';
import type { InterviewReport } from '@/lib/ai/interview/types';
import { err } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** 假流式：按字切 summary / actionItems，先推 meta。 */
async function fakeStreamReport(
  report: InterviewReport,
  emit: (data: unknown) => void,
  signal?: AbortSignal,
) {
  emit({
    type: 'report.meta',
    dimensions: report.dimensions,
  });
  for (const ch of report.summary) {
    if (signal?.aborted) return;
    emit({ type: 'report.delta', field: 'summary', textDelta: ch });
    await sleep(12);
  }
  for (let i = 0; i < report.actionItems.length; i++) {
    const item = report.actionItems[i]!;
    for (const ch of item.text) {
      if (signal?.aborted) return;
      emit({ type: 'report.delta', field: 'actionItem', index: i, textDelta: ch });
      await sleep(10);
    }
  }
  emit({ type: 'report.done', report });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const id = params.id?.trim();
  if (!id) return err('缺少 sessionId', 400);

  const session = await getInterviewSession(id);
  if (!session) return err('会话不存在或已过期', 404);
  const forbidden = assertSessionOwner(session.ownerKey, gate.ownerKey);
  if (forbidden) return forbidden;

  if (session.answers.length === 0 && session.status === 'active') {
    return err('尚无作答，无法生成报告', 400);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (data: unknown) => controller.enqueue(sseLine(data));
      try {
        if (session.report) {
          await fakeStreamReport(session.report, emit, req.signal);
          controller.close();
          return;
        }

        session.status = 'reporting';
        await saveInterviewSession(session);

        let report: InterviewReport;
        try {
          report = await generateInterviewReport({
            resume: session.resume,
            targetRole: session.targetRole,
            difficulty: session.difficulty || 'medium',
            questions: session.questions,
            answers: session.answers,
          });
        } catch (e) {
          emit({ type: 'error', message: e instanceof Error ? e.message : '报告生成失败', retryable: true });
          controller.close();
          return;
        }

        session.report = report;
        session.status = 'done';
        await saveInterviewSession(session);
        await fakeStreamReport(report, emit, req.signal);
      } catch (e) {
        try {
          emit({
            type: 'error',
            message: e instanceof Error ? e.message : '报告流失败',
            retryable: true,
          });
        } catch {
          /* ignore */
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
