import puppeteer, { type Browser } from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';

let sharedBrowser: Browser | null = null;
let connectPromise: Promise<Browser> | null = null;
let sessionChain: Promise<unknown> = Promise.resolve();

const TRANSIENT_PUPPETEER_RE =
  /detached|Target closed|Session closed|has been disconnected|Connection closed/i;

export async function resetSharedBrowser(): Promise<void> {
  const b = sharedBrowser;
  sharedBrowser = null;
  connectPromise = null;
  if (b?.connected) await b.close().catch(() => {});
}

export async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser?.connected) return sharedBrowser;
  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
        browser.once('disconnected', () => {
          sharedBrowser = null;
          connectPromise = null;
        });
        sharedBrowser = browser;
        return browser;
      } catch (e) {
        connectPromise = null;
        sharedBrowser = null;
        throw e;
      }
    })();
  }
  return connectPromise;
}

/** 串行执行 Puppeteer 任务，避免多 Tab 与单进程 Chromium 下 frame detached；遇瞬时错误重置浏览器并重试一次 */
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
    () => undefined
  );
  return job;
}

if (process.env.NODE_ENV === 'production') {
  void getSharedBrowser().catch(() => undefined);
}
