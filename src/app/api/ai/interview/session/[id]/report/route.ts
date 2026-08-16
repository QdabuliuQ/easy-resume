import { createHash } from 'crypto';
import { assertSessionOwner, requireInterviewAuth } from '@/lib/ai/interview/auth';
import { generateInterviewReport } from '@/lib/ai/interview/service';
import {
  getInterviewSession,
  interviewStoreError,
  releaseReportLock,
  saveInterviewSession,
  tryAcquireReportLock,
} from '@/lib/ai/interview/sessionStore';
import type { InterviewReport } from '@/lib/ai/interview/types';
import { checkInterviewRateLimit, err, getClientIp } from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function emitReport(report: InterviewReport, emit: (data: unknown) => void) {
  emit({ type: 'report.meta', dimensions: report.dimensions });
  if (report.summary) {
    emit({ type: 'report.delta', field: 'summary', textDelta: report.summary });
  }
  for (let i = 0; i < report.actionItems.length; i++) {
    const item = report.actionItems[i]!;
    if (item.text) {
      emit({ type: 'report.delta', field: 'actionItem', index: i, textDelta: item.text });
    }
  }
  emit({ type: 'report.done', report });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireInterviewAuth();
  if ('error' in gate) return gate.error;

  const storeErr = interviewStoreError();
  if (storeErr) return err(storeErr, 503);

  const rateKey = gate.uid || createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  const rate = await checkInterviewRateLimit(rateKey, 'report');
  if (!rate.allowed) return err(rate.message, 429, rate.resetIn);

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
      const emit = (data: unknown) => {
        try {
          controller.enqueue(sseLine(data));
        } catch {
          /* client gone */
        }
      };
      let locked = false;
      try {
        if (session.report) {
          emitReport(session.report, emit);
          return;
        }

        if (req.signal.aborted) return;

        locked = await tryAcquireReportLock(id);
        if (!locked) {
          emit({ type: 'error', message: '报告正在生成中，请稍后再试', retryable: true });
          return;
        }

        if (req.signal.aborted) return;

        session.status = 'reporting';
        await saveInterviewSession(session);
        emit({ type: 'report.progress', stage: 'generating' });

        // 客户端已断开则不启动 LLM（避免二次/无效扣费）
        if (req.signal.aborted) return;

        let report: InterviewReport;
        try {
          report = await generateInterviewReport({
            targetRole: session.targetRole,
            difficulty: session.difficulty || 'medium',
            questions: session.questions,
            answers: session.answers,
          });
        } catch (e) {
          emit({ type: 'error', message: e instanceof Error ? e.message : '报告生成失败', retryable: true });
          return;
        }

        session.report = report;
        session.status = 'done';
        await saveInterviewSession(session);

        if (req.signal.aborted) return;
        emitReport(report, emit);
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
        if (locked) await releaseReportLock(id);
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
