import type { Page } from 'puppeteer';

const FONT_READY_MS = 2_000;

async function waitFontsReady(page: Page) {
  await page.evaluate(
    (ms) =>
      Promise.race([
        (async () => {
          const families = ['Noto Sans SC', 'Noto Serif SC'];
          await Promise.all(
            families.flatMap((family) => [
              document.fonts.load(`400 16px "${family}"`),
              document.fonts.load(`700 16px "${family}"`),
            ]),
          );
          await document.fonts.ready;
        })(),
        new Promise<void>((r) => setTimeout(r, ms)),
      ]),
    FONT_READY_MS,
  );
}

/** 先关 JS 注入静态 HTML，再开 JS 等 Web 字体（与 PDF/图片导出一致） */
export async function loadInlineHtmlForStaticExport(page: Page, html: string) {
  await page.setJavaScriptEnabled(false);
  await page.setContent(html, {
    waitUntil: 'load',
    timeout: 120_000,
  });
  await page.setJavaScriptEnabled(true);
  await waitFontsReady(page);
}

export async function loadInlineHtmlForPrint(page: Page, html: string) {
  await page.setJavaScriptEnabled(true);
  await page.setContent(html, {
    waitUntil: 'load',
    timeout: 120_000,
  });
  await waitFontsReady(page);
}

export async function settleFontsOrTimeout(page: Page) {
  await waitFontsReady(page);
}
