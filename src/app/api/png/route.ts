import puppeteer from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';
import defaultResume from '@/json/resume';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { loadInlineHtmlForPrint, settleFontsOrTimeout } from '../pdf/loadInlineHtmlForPrint';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { mergeResumeConfig } from '../pdf/mergeResumeConfig';
import { renderResumePngHtml } from '../pdf/renderResumeHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PrintMeta = {
  paperWidth: string;
};

async function generatePngFromPage(
  pageHtml: string | null,
  pageUrl: string | null,
  printMeta?: PrintMeta | null
) {
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  try {
    const page = await browser.newPage();
    // viewport 宽度精确对应页面宽度，高度给一个足够大的初始值；
    // fullPage:true 截图时会按实际内容高度捕获，不受 viewport.height 限制
    const pageWPx = printMeta?.paperWidth
      ? cssLengthToApproxPx(printMeta.paperWidth)
      : cssLengthToApproxPx(globalStylePageDimensions(defaultResume.globalStyle).width);
    const vw = Math.min(2400, Math.ceil(pageWPx));
    await page.setViewport({
      width: vw,
      height: 1200,
      deviceScaleFactor: 2,
    });
    if (pageHtml) {
      await loadInlineHtmlForPrint(page, pageHtml);
    } else if (pageUrl) {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await settleFontsOrTimeout(page);
    } else {
      throw new Error('缺少 html 或 url');
    }
    const root = await page.$('.png-page');
    const png = root
      ? await root.screenshot({ type: 'png', omitBackground: false })
      : await page.screenshot({
          type: 'png',
          fullPage: true,
          omitBackground: false,
        });
    return png;
  } finally {
    await browser.close();
  }
}

function safeFilename(name: string) {
  const s = String(name || 'export.png').trim() || 'export.png';
  return s.replace(/[^\w.\u4e00-\u9fff-]/g, '_');
}

function contentDisposition(filename: string) {
  const fn = safeFilename(filename);
  const ascii =
    fn.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_') || 'export.png';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fn)}`;
}

/** POST JSON: { config?: object, html?: string, url?: string, filename?: string } — 与 /api/pdf 一致，返回 PNG */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestOrigin = new URL(req.url).origin;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
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
      pageHtml = renderResumePngHtml(
        merged as {
          pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
          globalStyle: GlobalStyle;
        },
        { assetOrigin: requestOrigin, basePath }
      );
      const gs = (merged as { globalStyle?: GlobalStyle }).globalStyle;
      const dim = globalStylePageDimensions(gs ?? defaultResume.globalStyle);
      printMeta = {
        paperWidth: dim.width,
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

    const png = await generatePngFromPage(pageHtml, pageUrl, printMeta);
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': contentDisposition(
          typeof filename === 'string' ? filename : 'export.png'
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
