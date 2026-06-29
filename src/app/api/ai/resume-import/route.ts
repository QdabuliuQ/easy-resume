/**
 * POST /api/ai/resume-import — PDF/图片简历识别（SSE 流式返回 pages）
 *
 * 响应（text/event-stream）：
 *   data: {"phase":"extract","status":"..."}  — 提取阶段
 *   data: {"phase":"llm","status":"..."}      — LLM 阶段
 *   data: {"pages":[...]}                     — 流式增量 pages
 *   data: {"done":true,"pages":[...]}         — 结束帧
 *   data: {"error":"..."}                     — 出错
 */
import crypto from 'crypto';
import { type NextRequest } from 'next/server';
import { createResumeImportLogger } from '@/lib/ai/resumeImport/logger';
import { streamResumeFileToPages } from '@/lib/ai/resumeImport/service';
import type { ResumeImportStreamEvent } from '@/lib/ai/resumeImport/streamTypes';
import {
  validateResumeImportFile,
  resumeImportFileValidationMessage,
} from '@/lib/ai/resumeImport/fileLimits';
import {
  checkResumeImportRateLimit,
  err,
  getClientIp,
} from '@/lib/ai/score/routeShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const reqId = crypto.randomBytes(4).toString('hex');
  const log = createResumeImportLogger(reqId);
  try {
    log.step('request_start');
    const ipHash = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
    const rate = await checkResumeImportRateLimit(ipHash);
    if (!rate.allowed) {
      log.step('rate_limited', { resetIn: rate.resetIn });
      return err(rate.message, 429, rate.resetIn);
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return err('请上传 file 字段（PDF 或图片）', 400);
    }
    const mime = file.type || 'application/octet-stream';
    const fileCheck = validateResumeImportFile({ size: file.size, type: mime, name: file.name });
    if (!fileCheck.ok) {
      return err(resumeImportFileValidationMessage(fileCheck), 400);
    }

    log.step('file_received', { name: file.name, mime, size: file.size, kind: fileCheck.kind });
    const buffer = Buffer.from(await file.arrayBuffer());
    log.step('file_buffered', { bytes: buffer.length });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (evt: ResumeImportStreamEvent) => {
          controller.enqueue(sseLine(evt));
        };
        try {
          const pages = await streamResumeFileToPages(buffer, mime, log, push);
          push({ done: true, pages });
          log.step('request_success', { pageCount: pages.length });
        } catch (e) {
          const message = e instanceof Error ? e.message : '未知错误';
          log.step('parse_failed', { error: message });
          push({ error: `简历识别失败：${message}` });
        } finally {
          controller.close();
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
  } catch (e) {
    console.error('[resume-import]', reqId, e);
    const message = e instanceof Error ? e.message : '未知错误';
    return err(`服务异常：${message}`, 500);
  }
}
