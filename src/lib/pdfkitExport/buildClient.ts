import '@/lib/pdfkitExport/browserEnv';
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import { resumeExportFontFiles } from '@/lib/resumeFont';
import {
  collectPdfBytes,
  drawPdfkitPages,
  glyphText,
  pdfkitNeedBold,
} from '@/lib/pdfkitExport/draw';
import { subsetWoff2ToSfnt } from '@/lib/pdfkitExport/subsetBrowser';
import { pxToPt } from '@/lib/pdfkitExport/layout';
import type { PdfkitExportPayload } from '@/lib/pdfkitExport/types';

const fontCache = new Map<string, Uint8Array>();

async function fetchFont(file: string): Promise<Uint8Array> {
  const cached = fontCache.get(file);
  if (cached) return cached;
  const res = await fetch(`/fonts/${file}`);
  if (!res.ok) throw new Error(`缺少字体文件 public/fonts/${file}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  fontCache.set(file, buf);
  return buf;
}

function pdfCtor(): typeof PDFDocument {
  const mod = PDFDocument as unknown as { default?: typeof PDFDocument };
  const Ctor = (mod.default ?? PDFDocument) as typeof PDFDocument;
  if (typeof Ctor !== 'function') throw new Error('pdfkit 加载失败');
  return Ctor;
}

async function buildPdfkitDocumentInBrowserInner(
  payload: PdfkitExportPayload,
): Promise<Uint8Array> {
  const pages = payload.pages;
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('没有可导出的页面');
  }
  const first = pages[0];
  const Doc = pdfCtor();
  const doc = new Doc({
    size: [pxToPt(first.width), pxToPt(first.height)],
    margin: 0,
    autoFirstPage: false,
    compress: true,
  });
  const done = collectPdfBytes(doc);
  const files = resumeExportFontFiles(payload.font);
  const text = glyphText(pages);
  const regularBuf = await subsetWoff2ToSfnt(await fetchFont(files.regular), text);
  doc.registerFont('resume-regular', regularBuf as unknown as Buffer);
  let fonts = { regular: 'resume-regular', bold: 'resume-regular' };
  if (pdfkitNeedBold(pages)) {
    const boldBuf = await subsetWoff2ToSfnt(await fetchFont(files.bold), text);
    doc.registerFont('resume-bold', boldBuf as unknown as Buffer);
    fonts = { regular: 'resume-regular', bold: 'resume-bold' };
  }
  drawPdfkitPages(doc, pages, fonts);
  return done;
}

export async function buildPdfkitDocumentInBrowser(
  payload: PdfkitExportPayload,
): Promise<Uint8Array> {
  return Promise.race([
    buildPdfkitDocumentInBrowserInner(payload),
    new Promise<Uint8Array>((_, reject) => {
      setTimeout(() => reject(new Error('PDF 生成超时')), 45_000);
    }),
  ]);
}
