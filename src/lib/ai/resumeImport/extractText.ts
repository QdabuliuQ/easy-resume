import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';

const TESSERACT_LANGS = 'chi_sim';
const TESSERACT_CACHE = path.join(process.cwd(), '.cache', 'tesseract');

const PDF_MIMES = new Set(['application/pdf']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export function isSupportedResumeImportMime(mime: string): boolean {
  const m = mime.toLowerCase().split(';')[0]?.trim() ?? '';
  return PDF_MIMES.has(m) || IMAGE_MIMES.has(m);
}

async function extractPdfText(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('pdf_parse_start');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    log?.step('pdf_parse_done', { textLen: result.text?.length ?? 0 });
    return result.text ?? '';
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractImageText(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('ocr_worker_start', { langs: TESSERACT_LANGS, cachePath: TESSERACT_CACHE });
  fs.mkdirSync(TESSERACT_CACHE, { recursive: true });
  const worker = await createWorker(TESSERACT_LANGS, 1, {
    workerBlobURL: false,
    cachePath: TESSERACT_CACHE,
  });
  log?.step('ocr_worker_ready');
  try {
    log?.step('ocr_recognize_start', { bytes: buffer.length });
    const { data } = await worker.recognize(buffer);
    log?.step('ocr_recognize_done', { textLen: data.text?.length ?? 0, confidence: data.confidence });
    return data.text ?? '';
  } finally {
    await worker.terminate();
    log?.step('ocr_worker_terminated');
  }
}

export async function extractResumeImportText(
  buffer: Buffer,
  mimeType: string,
  log?: ResumeImportLogger,
): Promise<string> {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (PDF_MIMES.has(mime)) return extractPdfText(buffer, log);
  if (IMAGE_MIMES.has(mime)) return extractImageText(buffer, log);
  throw new Error('不支持的文件类型，请上传 PDF 或 JPG/PNG/WebP 图片');
}
