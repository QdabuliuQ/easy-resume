import { baiduOcrImage, baiduOcrPdf } from '@/lib/ai/resumeImport/baiduOcr';
import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';

const PDF_MIMES = new Set(['application/pdf']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const BAIDU_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export function isSupportedResumeImportMime(mime: string): boolean {
  const m = mime.toLowerCase().split(';')[0]?.trim() ?? '';
  return PDF_MIMES.has(m) || IMAGE_MIMES.has(m);
}

export async function extractResumeImportText(
  buffer: Buffer,
  mimeType: string,
  log?: ResumeImportLogger,
): Promise<string> {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (PDF_MIMES.has(mime)) return baiduOcrPdf(buffer, log);
  if (BAIDU_IMAGE_MIMES.has(mime)) return baiduOcrImage(buffer, log);
  if (IMAGE_MIMES.has(mime)) {
    throw new Error('WebP 格式百度 OCR 不支持，请上传 JPG 或 PNG');
  }
  throw new Error('不支持的文件类型，请上传 PDF 或 JPG/PNG 图片');
}
