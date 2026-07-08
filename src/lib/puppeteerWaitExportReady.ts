import type { Page } from 'puppeteer';
import { settleFontsOrTimeout } from '@/app/api/pdf/loadInlineHtmlForPrint';
import type { PdfExportTrace } from '@/lib/pdfExportLog';

const READY_SEL = '[data-export-ready="true"]';
const ERR_SEL = '[data-export-error]';
const NAV_TIMEOUT_MS = 60_000;
const READY_TIMEOUT_MS = 45_000;
const BLOCKED_FONT_HOST_RE = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;

export async function gotoExportResumeAndWait(
  page: Page,
  url: string,
  trace?: PdfExportTrace,
) {
  trace?.log('page.goto start', { url, navTimeoutMs: NAV_TIMEOUT_MS });
  await page.setJavaScriptEnabled(true);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (BLOCKED_FONT_HOST_RE.test(req.url())) {
      req.abort();
      return;
    }
    req.continue();
  });
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
  trace?.log('page.goto done', {
    status: response?.status(),
    ok: response?.ok(),
  });

  const errEl = await page.$(ERR_SEL);
  if (errEl) {
    const msg = await page.$eval(ERR_SEL, (el) => el.textContent?.trim() || 'export page error');
    trace?.log('export page error element', { msg });
    throw new Error(msg);
  }

  trace?.log('wait export ready', { selector: READY_SEL, timeoutMs: READY_TIMEOUT_MS });
  try {
    await page.waitForSelector(READY_SEL, { timeout: READY_TIMEOUT_MS });
  } catch (e) {
    const hint = await page
      .evaluate(() => {
        const root = document.querySelector('[data-export-ready]');
        const state = root?.getAttribute('data-export-ready') ?? 'missing';
        const err = document.querySelector('[data-export-error]')?.textContent?.trim();
        const title = document.title;
        return { state, err: err || null, title };
      })
      .catch(() => ({ state: 'evaluate-failed', err: null, title: '' }));
    trace?.log('export ready timeout', hint);
    const base = e instanceof Error ? e.message : String(e);
    const hintText = hint.err
      ? `error: ${hint.err}`
      : `ready=${hint.state} title=${hint.title}`;
    throw new Error(`${base} (${hintText})`);
  }
  trace?.log('export ready ok');

  trace?.log('settle fonts start');
  await settleFontsOrTimeout(page);
  trace?.log('settle fonts done');
}
