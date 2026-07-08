import puppeteer, { type Browser } from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';
import type { PdfExportTrace } from '@/lib/pdfExportLog';

/** 全局 Browser 单例：只 launch 一次，导出时 newPage / 关 page，不关 browser */
let globalBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
let sessionChain: Promise<unknown> = Promise.resolve();
let sessionBusy = false;
let sessionBusySince = 0;
let sessionBusyTraceId: string | null = null;

const LAUNCH_TIMEOUT_MS = 45_000;
const SESSION_TIMEOUT_MS = 120_000;
const TRANSIENT_PUPPETEER_RE =
  /detached|Target closed|Session closed|has been disconnected|Connection closed/i;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function isSharedBrowserConnected(): boolean {
  return Boolean(globalBrowser?.connected);
}

export function isPuppeteerSessionBusy(): boolean {
  return sessionBusy;
}

/** 队列卡死时强制清空（如 pm2 restart 前可手动调用） */
export function resetPuppeteerSessionQueue(trace?: PdfExportTrace): void {
  trace?.log('session queue force reset', {
    wasBusy: sessionBusy,
    busyTraceId: sessionBusyTraceId,
    busyForMs: sessionBusy ? Date.now() - sessionBusySince : 0,
  });
  sessionChain = Promise.resolve();
  sessionBusy = false;
  sessionBusySince = 0;
  sessionBusyTraceId = null;
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
    timeoutMs: LAUNCH_TIMEOUT_MS,
  });
  const browser = await withTimeout(
    puppeteer.launch(opts),
    LAUNCH_TIMEOUT_MS,
    `Chromium 启动超时（${LAUNCH_TIMEOUT_MS}ms）`,
  );
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
    const browser = await getSharedBrowser();
    const page = await browser.newPage();
    try {
      await page.goto('about:blank', {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
    } finally {
      await page.close().catch(() => {});
    }
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
  const queuedAt = Date.now();
  trace?.log('puppeteer session queued', {
    sessionBusy,
    busyTraceId: sessionBusyTraceId,
    busyForMs: sessionBusy ? queuedAt - sessionBusySince : 0,
  });

  if (sessionBusy && queuedAt - sessionBusySince > SESSION_TIMEOUT_MS) {
    trace?.log('puppeteer session queue stale, force reset');
    resetPuppeteerSessionQueue(trace);
    void resetSharedBrowser(trace);
  }

  const run = async (): Promise<T> => {
    const queueWaitMs = Date.now() - queuedAt;
    sessionBusy = true;
    sessionBusySince = Date.now();
    sessionBusyTraceId = trace?.id ?? null;
    trace?.log('puppeteer session start', { queueWaitMs });
    try {
      const result = await withTimeout(
        (async () => {
          try {
            return await fn();
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
        })(),
        SESSION_TIMEOUT_MS,
        `Puppeteer 导出超时（${SESSION_TIMEOUT_MS}ms）`,
      );
      trace?.log('puppeteer session done');
      return result;
    } finally {
      sessionBusy = false;
      sessionBusyTraceId = null;
    }
  };

  const job = sessionChain.catch(() => undefined).then(run);
  sessionChain = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}