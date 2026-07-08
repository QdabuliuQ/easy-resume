import { runPdfExportWarmup } from '@/lib/pdfExportWarmup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let warmupPromise: Promise<void> | null = null;

/** 内部预热端点：instrumentation 启动后回环调用，与 /api/pdf 共享 Browser 单例 */
export async function POST() {
  if (!warmupPromise) {
    warmupPromise = runPdfExportWarmup();
  }
  await warmupPromise;
  return Response.json({ ok: true });
}
