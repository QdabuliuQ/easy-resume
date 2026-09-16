'use client';
import type { PdfkitExportPayload } from '@/lib/pdfkitExport/types';

type Pending = {
  resolve: (value: ArrayBuffer) => void;
  reject: (error: Error) => void;
};

type WorkerResponse =
  | { type: 'result'; id: number; buffer: ArrayBuffer }
  | { type: 'error'; id: number; error?: string };

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, Pending>();

function getPdfkitWorker(): Worker | null {
  if (typeof window === 'undefined' || !('Worker' in window)) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./pdfkit.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.type === 'error' && response.id == null) return;
      const request = pending.get(response.id);
      if (!request) return;
      pending.delete(response.id);
      if (response.type === 'result') request.resolve(response.buffer);
      else request.reject(new Error(response.error || 'PDF 生成失败'));
    };
    worker.onerror = (event) => {
      const error = new Error(event.message || 'PDFKit Worker 运行失败');
      pending.forEach((request) => request.reject(error));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

export function preloadPdfkitWorker(): void {
  const pdfWorker = getPdfkitWorker();
  if (pdfWorker) {
    pdfWorker.postMessage({ type: 'warmup' });
    return;
  }
  // Older browsers without module Worker support retain the existing fallback.
  void import('@/lib/pdfkitExport/buildClient');
}

async function buildOnMainThread(payload: PdfkitExportPayload): Promise<ArrayBuffer> {
  const { buildPdfkitDocumentInBrowser } = await import('@/lib/pdfkitExport/buildClient');
  const pdf = await buildPdfkitDocumentInBrowser(payload);
  return pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
}

export async function buildPdfkitBlob(payload: PdfkitExportPayload): Promise<Blob> {
  const pdfWorker = getPdfkitWorker();
  const buf = pdfWorker
    ? await new Promise<ArrayBuffer>((resolve, reject) => {
        const id = nextRequestId++;
        pending.set(id, { resolve, reject });
        pdfWorker.postMessage({ type: 'build', id, payload });
      }).catch(() => buildOnMainThread(payload))
    : await buildOnMainThread(payload);
  return new Blob([buf], { type: 'application/pdf' });
}
