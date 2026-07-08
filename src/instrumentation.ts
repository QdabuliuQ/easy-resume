import { shouldWarmupPdfBrowser } from '@/lib/pdfExportWarmupGate';

export async function register() {
  if (!shouldWarmupPdfBrowser()) return;

  const { warmupSharedBrowser } = await import(
    /* webpackIgnore: true */
    './lib/puppeteerSharedBrowser.js'
  );
  void warmupSharedBrowser().catch((e) => {
    console.error(
      '[pdf-export] startup warmup failed',
      e instanceof Error ? e.message : e,
    );
  });
}
