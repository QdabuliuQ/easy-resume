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
import {
  getCachedSubset,
  setCachedSubset,
  subsetCacheKey,
} from '@/lib/pdfkitExport/subsetCache';
import { pxToPt } from '@/lib/pdfkitExport/layout';
import type { PdfkitExportPayload } from '@/lib/pdfkitExport/types';

const fontCache = new Map<string, Uint8Array>();
/** hb/wawoff2 单实例：子集串行；cache hit 可并行 */
let subsetTail: Promise<unknown> = Promise.resolve();

function withSubsetLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = subsetTail.then(fn, fn);
  subsetTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function fetchFont(file: string): Promise<Uint8Array> {
  const cached = fontCache.get(file);
  if (cached) return cached;
  const res = await fetch(`/fonts/${file}`);
  if (!res.ok) throw new Error(`缺少字体文件 public/fonts/${file}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  fontCache.set(file, buf);
  return buf;
}

async function subsetFace(file: string, text: string): Promise<Uint8Array> {
  const key = subsetCacheKey(file, text);
  const hit = await getCachedSubset(key);
  if (hit) return hit;
  return withSubsetLock(async () => {
    const again = await getCachedSubset(key);
    if (again) return again;
    const out = await subsetWoff2ToSfnt(await fetchFont(file), text);
    setCachedSubset(key, out);
    return out;
  });
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
    // 快速导出：跳过流压缩，换体积换时间
    compress: false,
  });
  const done = collectPdfBytes(doc);
  const files = resumeExportFontFiles(payload.font);
  const text = glyphText(pages);
  const needBold = pdfkitNeedBold(pages);
  // hb/wawoff2 单实例不可并发子集；粗体 fetch 与 regular 子集重叠
  const regularP = subsetFace(files.regular, text);
  const boldP = needBold ? subsetFace(files.bold, text) : null;
  // 先 kick bold 的 cache/fetch，再 await regular（cache miss 时 bold fetch 可重叠）
  const regularBuf = await regularP;
  doc.registerFont('resume-regular', regularBuf as unknown as Buffer);
  let fonts = { regular: 'resume-regular', bold: 'resume-regular' };
  if (boldP) {
    const boldBuf = await boldP;
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
