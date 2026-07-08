import { warmupSharedBrowser } from '@/lib/puppeteerSharedBrowser';

/** 生产启动时预热 Puppeteer；失败仅打日志，不阻断服务 */
export async function runPdfExportWarmup(): Promise<void> {
  try {
    await warmupSharedBrowser();
  } catch (e) {
    console.error(
      '[pdf-export] startup warmup failed',
      e instanceof Error ? e.message : e,
    );
  }
}
