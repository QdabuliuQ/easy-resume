import { shouldWarmupPdfBrowser } from '@/lib/pdfExportWarmupGate';

const WARMUP_PATH = '/api/pdf/warmup';
const RETRY_MS = 500;
const MAX_RETRIES = 24;

async function triggerPdfExportWarmup(): Promise<void> {
  const port = process.env.PORT ?? '3010';
  const url = `http://127.0.0.1:${port}${WARMUP_PATH}`;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        console.info('[pdf-export] startup warmup triggered');
        return;
      }
    } catch {
      // server may not be listening yet
    }
    await new Promise((r) => setTimeout(r, RETRY_MS));
  }
  console.error('[pdf-export] startup warmup trigger failed after retries');
}

export async function register() {
  if (!shouldWarmupPdfBrowser()) return;
  void triggerPdfExportWarmup();
}
