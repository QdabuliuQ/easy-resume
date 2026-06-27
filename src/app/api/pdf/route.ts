import { createPdfExportTrace } from '@/lib/pdfExportLog';
import { getSharedBrowser, warmupSharedBrowser, withPuppeteerSession } from '@/lib/puppeteerSharedBrowser';
import { gotoExportResumeAndWait } from '@/lib/puppeteerWaitExportReady';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { prepareReactExport } from '../export/reactPrintMeta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

if (process.env.NODE_ENV === 'production') {
  void warmupSharedBrowser().catch((e) => {
    console.error('[pdf-export] warmup on module load failed', e instanceof Error ? e.message : e);
  });
}

async function generatePdfFromExportUrl(
  exportUrl: string,
  meta: { paperWidth: string; paperHeight: string; pageCount: number },
  trace: ReturnType<typeof createPdfExportTrace>,
) {
  return withPuppeteerSession(async () => {
    trace.log('getSharedBrowser');
    const browser = await getSharedBrowser(trace);
    trace.log('browser.newPage');
    const page = await browser.newPage();
    try {
      const pageWPx = cssLengthToApproxPx(meta.paperWidth);
      const pageHPx = cssLengthToApproxPx(meta.paperHeight);
      const vw = Math.min(2400, Math.ceil(pageWPx));
      const vh = Math.min(16384, Math.ceil(meta.pageCount * pageHPx));
      trace.log('page.setViewport', { vw, vh, pageCount: meta.pageCount });
      await page.setViewport({
        width: vw,
        height: Math.max(vh, Math.ceil(pageHPx)),
        deviceScaleFactor: 1,
      });
      await gotoExportResumeAndWait(page, exportUrl, trace);
      trace.log('page.pdf start', {
        paperWidth: meta.paperWidth,
        paperHeight: meta.paperHeight,
      });
      const pdf = await page.pdf({
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: meta.paperWidth,
        height: meta.paperHeight,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        scale: 1,
      });
      trace.log('page.pdf done', { bytes: pdf.byteLength });
      return pdf;
    } finally {
      trace.log('page.close');
      await page.close().catch(() => {});
    }
  }, trace);
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
  const trace = createPdfExportTrace();
  try {
    trace.log('request start', {
      url: req.url,
      nodeEnv: process.env.NODE_ENV,
    });
    const body = await req.json().catch(() => ({}));
    const requestOrigin = new URL(req.url).origin;
    const { filename, config, locale } = body as {
      filename?: string;
      config?: unknown;
      locale?: string;
    };
    if (config == null || typeof config !== 'object') {
      trace.log('invalid config');
      return Response.json({ error: '需提供 config' }, { status: 400 });
    }
    const { meta } = prepareReactExport(config, requestOrigin, locale);
    trace.log('export prepared', {
      exportUrl: meta.exportUrl,
      pageCount: meta.pageCount,
      paperWidth: meta.paperWidth,
      paperHeight: meta.paperHeight,
      requestOrigin,
    });
    const pdf = await generatePdfFromExportUrl(meta.exportUrl, meta, trace);
    trace.log('response ok', { bytes: pdf.byteLength });
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
    const stack = e instanceof Error ? e.stack : undefined;
    trace.log('request failed', { error: msg, stack });
    console.error(`[pdf-export:${trace.id}] failed`, e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
