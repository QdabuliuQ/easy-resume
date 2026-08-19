'use client';
import type { PdfkitExportPayload } from '@/lib/pdfkitExport/types';

export function preloadPdfkitWorker(): void {
  void import('@/lib/pdfkitExport/buildClient');
}

async function buildOnMainThread(payload: PdfkitExportPayload): Promise<ArrayBuffer> {
  const { buildPdfkitDocumentInBrowser } = await import('@/lib/pdfkitExport/buildClient');
  const pdf = await buildPdfkitDocumentInBrowser(payload);
  return pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
}

export async function buildPdfkitBlob(payload: PdfkitExportPayload): Promise<Blob> {
  const buf = await buildOnMainThread(payload);
  return new Blob([buf], { type: 'application/pdf' });
}
