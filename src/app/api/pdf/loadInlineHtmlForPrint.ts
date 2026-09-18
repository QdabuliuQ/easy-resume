import type { Page } from 'puppeteer';

const FONT_READY_MS = 2_000;

async function waitFontsReady(page: Page) {
  await page.evaluate(
    (ms) =>
      Promise.race([
        (async () => {
          // 只预加载当前导出页声明的字体。之前固定请求两套 Noto 字体，
          // 使用其他简历字体时会产生不必要的网络请求和字体解析开销。
          const faces = Array.from(document.fonts);
          await Promise.all(
            faces.map((face) =>
              document.fonts.load(
                `${face.style || 'normal'} ${face.weight || '400'} 16px ${face.family}`,
              ),
            ),
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
