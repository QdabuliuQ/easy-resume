import { getSharedBrowser, withPuppeteerSession } from '@/lib/puppeteerSharedBrowser';
import { gotoExportResumeAndWait } from '@/lib/puppeteerWaitExportReady';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { prepareReactExport } from '../export/reactPrintMeta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function generatePdfFromExportUrl(
  exportUrl: string,
  meta: { paperWidth: string; paperHeight: string; pageCount: number },
) {
  return withPuppeteerSession(async () => {
    const browser = await getSharedBrowser();
    const page = await browser.newPage();
    try {
      const pageWPx = cssLengthToApproxPx(meta.paperWidth);
      const pageHPx = cssLengthToApproxPx(meta.paperHeight);
      const vw = Math.min(2400, Math.ceil(pageWPx));
      const vh = Math.min(16384, Math.ceil(meta.pageCount * pageHPx));
      await page.setViewport({
        width: vw,
        height: Math.max(vh, Math.ceil(pageHPx)),
        deviceScaleFactor: 1,
      });
      await gotoExportResumeAndWait(page, exportUrl);
      return await page.pdf({
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: meta.paperWidth,
        height: meta.paperHeight,
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        scale: 1,
      });
    } finally {
      await page.close().catch(() => {});
    }
  });
}

function safeFilename(name: string) {
  const s = String(name || 'export.pdf').trim() || 'export.pdf';
  return s.replace(/[^\w.\u4e00-\u9fff-]/g, '_');
}

function contentDisposition(filename: string) {
  const fn = safeFilename(filename);
  const ascii =
    fn.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_') || 'export.pdf';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fn)}`;
}

/** POST JSON: { config, filename?, locale? } — 画布同源 React 导出页 + Puppeteer */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestOrigin = new URL(req.url).origin;
    const { filename, config, locale } = body as {
      filename?: string;
      config?: unknown;
      locale?: string;
    };
    if (config == null || typeof config !== 'object') {
      return Response.json({ error: '需提供 config' }, { status: 400 });
    }
    const { meta } = prepareReactExport(config, requestOrigin, locale);
    const pdf = await generatePdfFromExportUrl(meta.exportUrl, meta);
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition(
          typeof filename === 'string' ? filename : 'export.pdf',
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
