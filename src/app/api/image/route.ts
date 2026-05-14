import defaultResume from '@/json/resume.defaults';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { getSharedBrowser, withPuppeteerSession } from '@/lib/puppeteerSharedBrowser';
import {
  loadInlineHtmlForStaticExport,
  settleFontsOrTimeout,
} from '../pdf/loadInlineHtmlForPrint';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { mergeResumeConfig } from '../pdf/mergeResumeConfig';
import { renderResumePngHtml } from '../pdf/renderResumeHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JPEG_QUALITY = 90;

type PrintMeta = {
  paperWidth: string;
};

async function generateJpegFromPage(
  pageHtml: string | null,
  pageUrl: string | null,
  printMeta?: PrintMeta | null
) {
  return withPuppeteerSession(async () => {
    const browser = await getSharedBrowser();
    const page = await browser.newPage();
    try {
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
        await loadInlineHtmlForStaticExport(page, pageHtml);
      } else if (pageUrl) {
        await page.setJavaScriptEnabled(true);
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await settleFontsOrTimeout(page);
      } else {
        throw new Error('缺少 html 或 url');
      }
      const shotOpts = {
        type: 'jpeg' as const,
        quality: JPEG_QUALITY,
        omitBackground: false,
      };
      const root = await page.$('.png-page');
      const buf = root
        ? await root.screenshot(shotOpts)
        : await page.screenshot({ ...shotOpts, fullPage: true });
      return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as Uint8Array);
    } finally {
      await page.close().catch(() => {});
    }
  });
}

function safeFilename(name: string) {
  const s = String(name || 'export.jpg').trim() || 'export.jpg';
  return s.replace(/[^\w.\u4e00-\u9fff-]/g, '_');
}

function contentDisposition(filename: string) {
  const fn = safeFilename(filename);
  const ascii =
    fn.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_') || 'export.jpg';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fn)}`;
}

/** POST JSON: { config?, html?, url?, filename? } — 与 /api/pdf 一致，返回 JPEG */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestOrigin = new URL(req.url).origin;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const { url, html, filename, config, locale } = body as {
      url?: string;
      html?: string;
      filename?: string;
      config?: unknown;
      locale?: string;
    };

    let pageHtml: string | null = null;
    let pageUrl: string | null = null;
    let printMeta: PrintMeta | null = null;

    if (config != null && typeof config === 'object') {
      const merged = mergeResumeConfig(config);
      pageHtml = renderResumePngHtml(
        merged as {
          pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
          exportPages?: Array<{ moduleMargin?: number; modules?: unknown[] }>;
          globalStyle: GlobalStyle;
        },
        {
          assetOrigin: requestOrigin,
          basePath,
          locale: locale === 'en' ? 'en' : 'zh',
        }
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

    const jpeg = await generateJpegFromPage(pageHtml, pageUrl, printMeta);
    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': contentDisposition(
          typeof filename === 'string' ? filename : 'export.jpg'
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
