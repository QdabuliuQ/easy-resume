import puppeteer from 'puppeteer';
import defaultResume from '@/json/resume';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { loadInlineHtmlForPrint, settleFontsOrTimeout } from './loadInlineHtmlForPrint';
import { mergeResumeConfig } from './mergeResumeConfig';
import { renderResumeDocumentHtml } from './renderResumeHtml';
import { cssLengthToApproxPx } from '@/utils/cssLength';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PrintMeta = {
  paperWidth: string;
  paperHeight: string;
  pageCount: number;
};

async function generatePdfFromPage(
  pageHtml: string | null,
  pageUrl: string | null,
  printMeta?: PrintMeta | null
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    if (printMeta?.paperWidth && printMeta?.paperHeight) {
      const pageWPx = cssLengthToApproxPx(printMeta.paperWidth);
      const pageHPx = cssLengthToApproxPx(printMeta.paperHeight);
      const vw = Math.min(2400, Math.ceil(pageWPx));
      const vh = Math.min(
        16384,
        Math.ceil(printMeta.pageCount * pageHPx)
      );
      await page.setViewport({
        width: vw,
        height: Math.max(vh, Math.ceil(pageHPx)),
        deviceScaleFactor: 1,
      });
    }
    if (pageHtml) {
      await loadInlineHtmlForPrint(page, pageHtml);
    } else if (pageUrl) {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await settleFontsOrTimeout(page);
    } else {
      throw new Error('缺少 html 或 url');
    }
    const paperW =
      printMeta?.paperWidth || String(defaultResume.globalStyle.width);
    const paperH =
      printMeta?.paperHeight || String(defaultResume.globalStyle.height);
    return await page.pdf({
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: paperW,
      height: paperH,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 1,
    });
  } finally {
    await browser.close();
  }
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

/** POST JSON: { config?: object, html?: string, url?: string, filename?: string } — 优先 config，其次 html，再次 url */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, html, filename, config } = body as {
      url?: string;
      html?: string;
      filename?: string;
      config?: unknown;
    };

    let pageHtml: string | null = null;
    let pageUrl: string | null = null;
    let printMeta: PrintMeta | null = null;

    if (config != null && typeof config === 'object') {
      const merged = mergeResumeConfig(config);
      pageHtml = renderResumeDocumentHtml(
        merged as {
          pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
          globalStyle: GlobalStyle;
        }
      );
      const gs = (merged as { globalStyle?: GlobalStyle }).globalStyle;
      const n =
        Array.isArray(merged.pages) && merged.pages.length > 0
          ? merged.pages.length
          : 1;
      printMeta = {
        paperWidth: String(gs?.width ?? defaultResume.globalStyle.width),
        paperHeight: String(gs?.height ?? defaultResume.globalStyle.height),
        pageCount: n,
      };
    } else if (typeof html === 'string' && html.trim()) {
      pageHtml = html;
    } else if (typeof url === 'string' && url.trim()) {
      pageUrl = url.trim();
    } else {
      return Response.json(
        { error: '需提供 config（推荐）、html 或 url' },
        { status: 400 }
      );
    }

    const pdf = await generatePdfFromPage(pageHtml, pageUrl, printMeta);
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition(
          typeof filename === 'string' ? filename : 'export.pdf'
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}

/** GET: ?url=完整地址（兼容旧用法；推荐 POST + config） */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) {
    return Response.json({ error: '缺少查询参数 url' }, { status: 400 });
  }
  try {
    const pdf = await generatePdfFromPage(null, url, null);
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="export.pdf"',
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
