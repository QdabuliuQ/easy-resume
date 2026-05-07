import type { Page } from 'puppeteer';

const FONT_READY_MS = 12_000;

export async function loadInlineHtmlForPrint(page: Page, html: string) {
  await page.setContent(html, {
    waitUntil: 'load',
    timeout: 120_000,
  });
  await page.evaluate(
    (ms) =>
      Promise.race([
        document.fonts.ready,
        new Promise<void>((r) => setTimeout(r, ms)),
      ]),
    FONT_READY_MS,
  );
}

export async function settleFontsOrTimeout(page: Page) {
  await page.evaluate(
    (ms) =>
      Promise.race([
        document.fonts.ready,
        new Promise<void>((r) => setTimeout(r, ms)),
      ]),
    FONT_READY_MS,
  );
}
