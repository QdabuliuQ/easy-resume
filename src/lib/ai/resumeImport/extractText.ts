import { baiduOcrImage, baiduOcrPdf } from '@/lib/ai/resumeImport/baiduOcr';
import {
  extractPdfEmbeddedText,
  isPdfEmbeddedTextUsable,
} from '@/lib/ai/resumeImport/extractPdfText';
import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';

const PDF_MIMES = new Set(['application/pdf']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export function isSupportedResumeImportMime(mime: string): boolean {
  const m = mime.toLowerCase().split(';')[0]?.trim() ?? '';
  return PDF_MIMES.has(m) || IMAGE_MIMES.has(m);
}

async function extractPdfText(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('pdf_embedded_start', { bytes: buffer.length });
  try {
    const embedded = await extractPdfEmbeddedText(buffer);
    if (isPdfEmbeddedTextUsable(embedded)) {
      log?.step('pdf_embedded_done', { textLen: embedded.length, via: 'embedded' });
      return embedded;
    }
    log?.step('pdf_embedded_skip', { textLen: embedded.length, reason: 'too_short_or_empty' });
  } catch (e) {
    log?.step('pdf_embedded_failed', {
      error: e instanceof Error ? e.message : String(e),
    });
  }
  log?.step('pdf_ocr_fallback');
  return baiduOcrPdf(buffer, log);
}

export async function extractResumeImportText(
  buffer: Buffer,
  mimeType: string,
  log?: ResumeImportLogger,
): Promise<string> {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (PDF_MIMES.has(mime)) return extractPdfText(buffer, log);
  if (IMAGE_MIMES.has(mime)) return baiduOcrImage(buffer, log);
  throw new Error('不支持的文件类型，请上传 PDF 或 JPG/PNG 图片');
}
