/**
 * POST /api/ai/polish — 简历富文本 AI 润色（SSE 流式）
 *
 * 调用链：
 *   编辑器 RichTextEditor → src/api/polishDescription.ts → 本路由
 *   → LangChain（src/lib/ai/polish/service.ts）→ ChatAnywhere
 *
 * 环境变量：
 *   XFYUN_MAAS_API_KEY — 讯飞星辰 Coding Plan（优先）
 *   CHATANYWHERE_API_KEY — 降级备用
 *
 * 请求体（JSON）：
 *   type: 'job' | 'project' | 'education' | 'skill'
 *   richTextHtml: string — 当前 Quill 富文本 HTML
 *   intentPosts?: string — 意向职位（来自 info1 模块，用于匹配 JD 关键词）
 *   context?: object — 模块上下文，字段因 type 而异：
 *     job:       { company, time, postDepartment, city }
 *     project:   { projectName, role }
 *     education: { school, degree, major, city, schoolTypeTags, academy, studyTime }
 *     skill:     无 context
 *
 * 响应（text/event-stream）：
 *   data: {"html":"<ul>..."}           — 流式增量，html 为截至当前的完整 HTML
 *   data: {"done":true,"html":"..."}   — 结束帧，html 为 sanitize 后的最终结果
 *   data: {"error":"..."}              — 出错时推送，随后连接关闭
 *
 * 客户端解析见 src/api/polishDescription.ts
 */
import { z } from 'zod';
import crypto from 'crypto';
import { linkAbortSignal } from '@/lib/ai/abortSignal';
import { checkPolishRateLimit, getClientIp } from '@/lib/ai/score/routeShared';
import { streamPolishDescription } from '@/lib/ai/polish/service';
import { MIN_POLISH_PLAIN_LENGTH, type PolishRequest } from '@/lib/ai/polish/types';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

/** LangChain / Puppeteer 等同理，必须在 Node 运行时执行 */
export const runtime = 'nodejs';
/** 禁用静态缓存，每次请求实时调用 LLM */
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// 请求体 Zod 校验（按 type 区分 context 结构）
// ---------------------------------------------------------------------------

/** 工作经历模块附加上下文 */
const contextJobSchema = z.object({
  company: z.string().optional().default(''),
  time: z.string().optional().default(''),
  postDepartment: z.string().optional().default(''),
  city: z.string().optional().default(''),
});

/** 项目经历模块附加上下文 */
const contextProjectSchema = z.object({
  projectName: z.string().optional().default(''),
  role: z.string().optional().default(''),
});

/** 教育经历模块附加上下文 */
const contextEducationSchema = z.object({
  school: z.string().optional().default(''),
  degree: z.string().optional().default(''),
  major: z.string().optional().default(''),
  city: z.string().optional().default(''),
  schoolTypeTags: z.string().optional().default(''),
  academy: z.string().optional().default(''),
  studyTime: z.string().optional().default(''),
});

const contextOtherSchema = z.object({
  moduleTitle: z.string().optional().default(''),
});

const polishRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('job'),
    richTextHtml: z.string(),
    intentPosts: z.string().optional().default(''),
    context: contextJobSchema,
  }),
  z.object({
    type: z.literal('project'),
    richTextHtml: z.string(),
    intentPosts: z.string().optional().default(''),
    context: contextProjectSchema,
  }),
  z.object({
    type: z.literal('education'),
    richTextHtml: z.string(),
    intentPosts: z.string().optional().default(''),
    context: contextEducationSchema,
  }),
  z.object({
    type: z.literal('skill'),
    richTextHtml: z.string(),
    intentPosts: z.string().optional().default(''),
  }),
  z.object({
    type: z.literal('other'),
    richTextHtml: z.string(),
    intentPosts: z.string().optional().default(''),
    context: contextOtherSchema,
  }),
]);

// ---------------------------------------------------------------------------
// SSE 辅助
// ---------------------------------------------------------------------------

/** 编码单条 SSE 事件：`data: {...}\n\n` */
function sseLine(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ---------------------------------------------------------------------------
// POST /api/ai/polish
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  // ---------- 1. 解析并校验请求体 ----------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求体必须是合法 JSON' }, { status: 400 });
  }
  const parsed = polishRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: '参数无效' }, { status: 400 });
  }
  const reqData = parsed.data as PolishRequest;

  const plainLen = plainTextFromRichHtml(reqData.richTextHtml).length;
  if (plainLen < MIN_POLISH_PLAIN_LENGTH) {
    return Response.json(
      { error: `润色内容至少 ${MIN_POLISH_PLAIN_LENGTH} 个字` },
      { status: 400 },
    );
  }

  const ipHash = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  const rate = await checkPolishRateLimit(ipHash);
  if (!rate.allowed) {
    return Response.json(
      { error: rate.message },
      { status: 429, headers: { 'Retry-After': String(rate.resetIn) } },
    );
  }

  // ---------- 2. 建立 SSE 流，LangChain 逐 token 回调推送 ----------
  const abortController = linkAbortSignal(req.signal);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        if (abortController.signal.aborted) return;
        try {
          controller.enqueue(sseLine(data));
        } catch {
          abortController.abort();
        }
      };
      try {
        const html = await streamPolishDescription(
          reqData,
          (htmlSoFar) => emit({ html: htmlSoFar }),
          abortController.signal,
        );
        emit({ done: true, html });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (abortController.signal.aborted) return;
        const msg = e instanceof Error ? e.message : String(e);
        emit({ error: msg });
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  // ---------- 3. 返回 SSE 响应 ----------
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      /** 告知 Nginx 不要缓冲 SSE，否则客户端看不到流式效果 */
      'X-Accel-Buffering': 'no',
    },
  });
}
