import puppeteer, { type Browser } from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';

/** 全局 Browser 单例：只 launch 一次，导出时 newPage / 关 page，不关 browser */
let globalBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
let sessionChain: Promise<unknown> = Promise.resolve();

const TRANSIENT_PUPPETEER_RE =
  /detached|Target closed|Session closed|has been disconnected|Connection closed/i;

export function isSharedBrowserConnected(): boolean {
  return Boolean(globalBrowser?.connected);
}

export async function resetSharedBrowser(): Promise<void> {
  const browser = globalBrowser;
  globalBrowser = null;
  launchPromise = null;
  if (browser?.connected) await browser.close().catch(() => {});
}

async function launchGlobalBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  browser.once('disconnected', () => {
    globalBrowser = null;
    launchPromise = null;
  });
  globalBrowser = browser;
  return browser;
}

/** 获取全局 Browser；并发请求共享同一次 launch */
export async function getSharedBrowser(): Promise<Browser> {
  if (globalBrowser?.connected) return globalBrowser;
  if (!launchPromise) {
    launchPromise = launchGlobalBrowser().catch((e) => {
      launchPromise = null;
      globalBrowser = null;
      throw e;
    });
  }
  return launchPromise;
}

/** 应用启动时预热，避免首次 PDF 导出冷启动 Chromium */
export async function warmupSharedBrowser(): Promise<void> {
  await getSharedBrowser();
}

/** 串行执行 Puppeteer 任务；每次仅 newPage，完成后关 page；遇瞬时错误重置 browser 并重试一次 */
export function withPuppeteerSession<T>(fn: () => Promise<T>): Promise<T> {
  const job = sessionChain.then(async (): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (TRANSIENT_PUPPETEER_RE.test(msg)) {
        await resetSharedBrowser();
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
