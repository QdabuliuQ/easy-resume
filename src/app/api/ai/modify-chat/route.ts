import crypto from 'crypto';
import { z } from 'zod';
import { linkAbortSignal, formatExternalError } from '@/lib/ai/abortSignal';
import { buildModifyChatMessages, MODIFY_CHAT_MAX_MESSAGES } from '@/lib/ai/modifyChat/shared';
import {
  getModifyChatBodySizeError,
  MODIFY_CHAT_MAX_BODY_BYTES,
} from '@/lib/ai/modifyChat/limits';
import { errorEnvelope, extractResumePatch, type ModifyChatProtocolEnvelope } from '@/lib/ai/modifyChat/protocol';
import { sanitizeResumeHtmlFields } from '@/lib/ai/modifyChat/sanitizeResume';
import { streamModifyChatPipeline } from '@/lib/ai/modifyChat/service';
import { checkModifyChatRateLimit, getClientIp, parseEncryptedRequestBody } from '@/lib/ai/score/routeShared';
import { getResumeImportValidationError } from '@/lib/validateResumeImportJson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const historySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  }),
).max(MODIFY_CHAT_MAX_MESSAGES - 1);

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  history: historySchema.optional().default([]),
  resume: z.unknown().optional(),
});

function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const len = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(len) && len > MODIFY_CHAT_MAX_BODY_BYTES) {
      return Response.json(
        { error: `请求体过大，最大允许 ${MODIFY_CHAT_MAX_BODY_BYTES / 1024}KB` },
        { status: 413 },
      );
    }
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: '请求体必须是合法 JSON' }, { status: 400 });
  }
  const decrypted = parseEncryptedRequestBody(raw);
  if (decrypted instanceof Response) {
    const errBody = (await decrypted.json().catch(() => null)) as { error?: string } | null;
    return Response.json({ error: errBody?.error || '请求体无效' }, { status: 400 });
  }
  const body = decrypted;
  const bodySizeErr = getModifyChatBodySizeError(body);
  if (bodySizeErr) {
    return Response.json({ error: bodySizeErr }, { status: 413 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: '参数无效' }, { status: 400 });
  }
  const resumeSizeErr = getModifyChatBodySizeError(body, parsed.data);
  if (resumeSizeErr) {
    return Response.json({ error: resumeSizeErr }, { status: 413 });
  }
  const ipHash = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  let rate: Awaited<ReturnType<typeof checkModifyChatRateLimit>>;
  try {
    rate = await checkModifyChatRateLimit(ipHash);
  } catch (e) {
    console.error('[modifyChat] rate limit check failed:', e);
    return Response.json({ error: '服务暂时不可用，请稍后重试' }, { status: 503 });
  }
  if (!rate.allowed) {
    return Response.json(
      { error: rate.message },
      { status: 429, headers: { 'Retry-After': String(rate.resetIn) } },
    );
  }
  const messages = buildModifyChatMessages(parsed.data.message, parsed.data.history);
  const abortController = linkAbortSignal(req.signal);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (data: ModifyChatProtocolEnvelope) => {
        if (abortController.signal.aborted) return;
        try {
          controller.enqueue(sseLine(data));
        } catch {
          abortController.abort();
        }
      };
      try {
        await streamModifyChatPipeline(
          messages,
          parsed.data.resume,
          (evt) => {
            if (abortController.signal.aborted) return;
            if (evt.error || evt.code !== 0) {
              emit(errorEnvelope(evt.error ?? evt.message ?? '请求失败'));
              return;
            }
            const patch = extractResumePatch(evt.data);
            if (patch?.props.newResumeJson) {
              patch.props.newResumeJson = sanitizeResumeHtmlFields(patch.props.newResumeJson);
              const validationErr = getResumeImportValidationError(patch.props.newResumeJson);
              if (validationErr) {
                emit(errorEnvelope(`简历结构校验失败：${validationErr}`));
                return;
              }
            }
            emit(evt);
          },
          abortController.signal,
        );
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (abortController.signal.aborted) return;
        const msg = formatExternalError(e);
        emit(errorEnvelope(msg));
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
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
