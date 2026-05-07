import type { GlobalStyle } from '@/modules/utils/common.type';
import { mergeResumeConfig } from '@/app/api/pdf/mergeResumeConfig';
import { resumeMergedToDocxBuffer } from './resumeToDocx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFilename(name: string) {
  const s = String(name || 'export.docx').trim() || 'export.docx';
  const withExt = /\.docx$/i.test(s) ? s : `${s}.docx`;
  return withExt.replace(/[^\w.\u4e00-\u9fff-]/g, '_');
}

function contentDisposition(filename: string) {
  const fn = safeFilename(filename);
  const ascii =
    fn.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_') || 'export.docx';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fn)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { filename, config } = body as {
      filename?: string;
      config?: unknown;
    };
    if (config == null || typeof config !== 'object') {
      return Response.json({ error: '需提供 config' }, { status: 400 });
    }
    const merged = mergeResumeConfig(config);
    const buf = await resumeMergedToDocxBuffer(
      merged as {
        pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
        globalStyle: GlobalStyle;
      }
    );
    return new Response(buf, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition(
          typeof filename === 'string' ? filename : 'export.docx'
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
