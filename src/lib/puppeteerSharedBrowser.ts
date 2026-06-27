import puppeteer, { type Browser } from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';
import type { PdfExportTrace } from '@/lib/pdfExportLog';

/** 全局 Browser 单例：只 launch 一次，导出时 newPage / 关 page，不关 browser */
let globalBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
let sessionChain: Promise<unknown> = Promise.resolve();

const TRANSIENT_PUPPETEER_RE =
  /detached|Target closed|Session closed|has been disconnected|Connection closed/i;

export function isSharedBrowserConnected(): boolean {
  return Boolean(globalBrowser?.connected);
}

export async function resetSharedBrowser(trace?: PdfExportTrace): Promise<void> {
  trace?.log('browser reset');
  const browser = globalBrowser;
  globalBrowser = null;
  launchPromise = null;
  if (browser?.connected) await browser.close().catch(() => {});
}

async function launchGlobalBrowser(trace?: PdfExportTrace): Promise<Browser> {
  const opts = getPuppeteerLaunchOptions();
  trace?.log('browser.launch start', {
    executablePath: opts.executablePath ?? 'bundled',
  });
  const browser = await puppeteer.launch(opts);
  trace?.log('browser.launch done');
  browser.once('disconnected', () => {
    globalBrowser = null;
    launchPromise = null;
  });
  globalBrowser = browser;
  return browser;
}

/** 获取全局 Browser；并发请求共享同一次 launch */
export async function getSharedBrowser(trace?: PdfExportTrace): Promise<Browser> {
  if (globalBrowser?.connected) {
    trace?.log('browser reuse connected instance');
    return globalBrowser;
  }
  if (!launchPromise) {
    launchPromise = launchGlobalBrowser(trace).catch((e) => {
      launchPromise = null;
      globalBrowser = null;
      trace?.log('browser.launch failed', {
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    });
  } else {
    trace?.log('browser await in-flight launch');
  }
  return launchPromise;
}

/** 应用启动时预热，避免首次 PDF 导出冷启动 Chromium */
export async function warmupSharedBrowser(): Promise<void> {
  console.info('[pdf-export] warmup browser start');
  try {
    await getSharedBrowser();
    console.info('[pdf-export] warmup browser ok');
  } catch (e) {
    console.error('[pdf-export] warmup browser failed', e instanceof Error ? e.message : e);
    throw e;
  }
}

/** 串行执行 Puppeteer 任务；每次仅 newPage，完成后关 page；遇瞬时错误重置 browser 并重试一次 */
export function withPuppeteerSession<T>(
  fn: () => Promise<T>,
  trace?: PdfExportTrace,
): Promise<T> {
  trace?.log('puppeteer session queued');
  const job = sessionChain.then(async (): Promise<T> => {
    trace?.log('puppeteer session start');
    try {
      const result = await fn();
      trace?.log('puppeteer session done');
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      trace?.log('puppeteer session error', { error: msg });
      if (TRANSIENT_PUPPETEER_RE.test(msg)) {
        trace?.log('puppeteer session retry after transient error');
        await resetSharedBrowser(trace);
        return await fn();
      }
      throw e;
    }
  });
  sessionChain = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}
