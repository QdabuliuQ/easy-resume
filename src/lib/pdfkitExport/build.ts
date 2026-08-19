import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import subsetFont from 'subset-font';
import { resumeExportFontFiles } from '@/lib/resumeFont';
import {
  collectPdfBytes,
  drawPdfkitPages,
  glyphText,
  pdfkitNeedBold,
} from '@/lib/pdfkitExport/draw';
import { pxToPt } from '@/lib/pdfkitExport/layout';
import type { PdfkitExportPayload } from '@/lib/pdfkitExport/types';

const fontBufCache = new Map<string, Buffer>();

export type BuildPdfkitOptions = {
  fontDir?: string;
  skipCustomFont?: boolean;
};

function readFontFile(fontDir: string, file: string): Buffer {
  const p = path.join(fontDir, file);
  const cached = fontBufCache.get(p);
  if (cached) return cached;
  if (!fs.existsSync(p)) {
    throw new Error(`缺少字体文件 public/fonts/${file}`);
  }
  const buf = fs.readFileSync(p);
  fontBufCache.set(p, buf);
  return buf;
}

async function subsetFace(src: Buffer, text: string): Promise<Buffer> {
  return subsetFont(src, text || ' ', { targetFormat: 'sfnt' });
}

export async function buildPdfkitDocument(
  payload: PdfkitExportPayload,
  opts: BuildPdfkitOptions = {},
): Promise<Buffer> {
  const pages = payload.pages;
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('没有可导出的页面');
  }
  const first = pages[0];
  const doc = new PDFDocument({
    size: [pxToPt(first.width), pxToPt(first.height)],
    margin: 0,
    autoFirstPage: false,
    compress: true,
  });
  const done = collectPdfBytes(doc).then((bytes) => Buffer.from(bytes));
  let fonts = { regular: 'Helvetica', bold: 'Helvetica-Bold' };
  if (!opts.skipCustomFont) {
    const fontDir = opts.fontDir ?? path.join(process.cwd(), 'public', 'fonts');
    const files = resumeExportFontFiles(payload.font);
    const text = glyphText(pages);
    const regularBuf = await subsetFace(readFontFile(fontDir, files.regular), text);
    doc.registerFont('resume-regular', regularBuf);
    fonts = { regular: 'resume-regular', bold: 'resume-regular' };
    if (pdfkitNeedBold(pages)) {
      const boldBuf = await subsetFace(readFontFile(fontDir, files.bold), text);
      doc.registerFont('resume-bold', boldBuf);
      fonts.bold = 'resume-bold';
    }
  }
  drawPdfkitPages(doc, pages, fonts);
  return done;
}
