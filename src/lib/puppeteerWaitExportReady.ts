import type { Page } from 'puppeteer';
import { settleFontsOrTimeout } from '@/app/api/pdf/loadInlineHtmlForPrint';

const READY_SEL = '[data-export-ready="true"]';
const ERR_SEL = '[data-export-error]';
const NAV_TIMEOUT_MS = 60_000;
const READY_TIMEOUT_MS = 45_000;

export async function gotoExportResumeAndWait(page: Page, url: string) {
  await page.setJavaScriptEnabled(true);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  const errEl = await page.$(ERR_SEL);
  if (errEl) {
    const msg = await page.$eval(ERR_SEL, (el) => el.textContent?.trim() || 'export page error');
    throw new Error(msg);
  }
  try {
    await page.waitForSelector(READY_SEL, { timeout: READY_TIMEOUT_MS });
  } catch (e) {
    const hint = await page
      .evaluate(() => {
        const root = document.querySelector('[data-export-ready]');
        const state = root?.getAttribute('data-export-ready') ?? 'missing';
        const err = document.querySelector('[data-export-error]')?.textContent?.trim();
        return err ? `error: ${err}` : `ready=${state}`;
      })
      .catch(() => '');
    const base = e instanceof Error ? e.message : String(e);
    throw new Error(hint ? `${base} (${hint})` : base);
  }
  await settleFontsOrTimeout(page);
}
