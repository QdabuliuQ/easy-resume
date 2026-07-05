import { extractText, getDocumentProxy } from 'unpdf';

/** ponytail: 扫描件内嵌文本通常极短，低于此阈值走 OCR */
export const MIN_USABLE_PDF_EMBEDDED_TEXT_LEN = 50;

export function isPdfEmbeddedTextUsable(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length < MIN_USABLE_PDF_EMBEDDED_TEXT_LEN) return false;
  const meaningful = (t.match(/[\p{L}\p{N}]/gu) ?? []).length;
  return meaningful >= MIN_USABLE_PDF_EMBEDDED_TEXT_LEN * 0.4;
}

export async function extractPdfEmbeddedText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/\r\n/g, '\n').trim();
}
