import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldWarmupPdfBrowser } from '@/lib/pdfExportWarmupGate';

describe('pdfExportWarmupGate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('warms up in production nodejs runtime', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.PDF_EXPORT_WARMUP;
    expect(shouldWarmupPdfBrowser()).toBe(true);
  });

  it('skips warmup in development even when PDF_EXPORT_WARMUP=1', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PDF_EXPORT_WARMUP', '1');
    expect(shouldWarmupPdfBrowser()).toBe(false);
  });

  it('skips warmup when PDF_EXPORT_WARMUP=0', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PDF_EXPORT_WARMUP', '0');
    expect(shouldWarmupPdfBrowser()).toBe(false);
  });

  it('skips warmup on edge runtime', () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('NODE_ENV', 'production');
    expect(shouldWarmupPdfBrowser()).toBe(false);
  });
});
