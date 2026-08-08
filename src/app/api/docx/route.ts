import { renderResumeDocx } from '@/lib/docx/renderResumeDocx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFilename(value: unknown) {
  const name = typeof value === 'string' && value.trim() ? value.trim() : 'resume.docx';
  return name.replace(/[^\w.\u4e00-\u9fff-]/g, '_');
}

function contentDisposition(filename: string) {
  const safe = safeFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_') || 'resume.docx';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.config || typeof body.config !== 'object') {
      return Response.json({ error: '需提供 config' }, { status: 400 });
    }
    const buffer = await renderResumeDocx(body.config);
    const filename = safeFilename(body.filename ?? 'resume.docx');
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition(filename),
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '导出失败' }, { status: 500 });
  }
}
