import { parseCssColor, pdfkitTextY, pxToPt } from '@/lib/pdfkitExport/layout';
import type { PdfkitPage } from '@/lib/pdfkitExport/types';

export function glyphText(pages: PdfkitPage[]): string {
  const chars = new Set<string>(' ');
  for (const page of pages) {
    for (const run of page.runs) {
      for (const ch of run.text) chars.add(ch);
    }
  }
  return Array.from(chars).join('');
}

export function pdfkitNeedBold(pages: PdfkitPage[]): boolean {
  return pages.some((p) => p.runs.some((r) => r.fontWeight >= 600));
}

export function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const m = dataUrl.match(/^data:image\/(?:png|jpeg|jpg);base64,(.+)$/i);
  if (!m) return null;
  try {
    const b64 = m[1];
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function fitCharacterSpacing(
  doc: PDFKit.PDFDocument,
  text: string,
  targetWidthPt: number,
  extraPt: number,
): number {
  if (text.length < 2) return extraPt;
  const natural = doc.widthOfString(text);
  return extraPt + (targetWidthPt - natural) / (text.length - 1);
}

export function drawPage(
  doc: PDFKit.PDFDocument,
  page: PdfkitPage,
  fonts: { regular: string; bold: string },
) {
  const bg = parseCssColor(page.background);
  if (bg) {
    doc.rect(0, 0, pxToPt(page.width), pxToPt(page.height)).fill(bg);
  }
  for (const fill of page.fills ?? []) {
    const c = parseCssColor(fill.color);
    if (!c) continue;
    const x = pxToPt(fill.x);
    const y = pxToPt(fill.y);
    const w = pxToPt(fill.w);
    const h = pxToPt(fill.h);
    const r = pxToPt(fill.radius ?? 0);
    if (r > 0) doc.roundedRect(x, y, w, h, r).fill(c);
    else doc.rect(x, y, w, h).fill(c);
  }
  for (const disc of page.discs ?? []) {
    const c = parseCssColor(disc.color) ?? '#000000';
    doc.circle(pxToPt(disc.cx), pxToPt(disc.cy), pxToPt(disc.r)).fill(c);
  }
  for (const img of page.images) {
    if (!img.dataUrl) continue;
    try {
      // pdfkit 只认 Buffer / ArrayBuffer / data URL；Uint8Array 会当路径读，浏览器里直接失败
      doc.image(img.dataUrl, pxToPt(img.x), pxToPt(img.y), {
        width: pxToPt(img.w),
        height: pxToPt(img.h),
      });
    } catch {
      // ponytail: 坏图跳过，不阻断整份导出
    }
  }
  for (const run of page.runs) {
    const color = parseCssColor(run.color) ?? '#000000';
    const fontName = run.fontWeight >= 600 ? fonts.bold : fonts.regular;
    const sizePt = pxToPt(run.fontSize);
    doc.font(fontName).fontSize(sizePt).fillColor(color);
    const x = pxToPt(run.x);
    const y = pdfkitTextY(pxToPt(run.y), pxToPt(run.h), doc.currentLineHeight());
    const spacing = fitCharacterSpacing(
      doc,
      run.text,
      pxToPt(run.w),
      pxToPt(run.letterSpacing),
    );
    const textW = pxToPt(Math.max(run.w, 1));
    const textH = pxToPt(Math.max(run.h, 1));
    doc.text(run.text, x, y, {
      lineBreak: false,
      characterSpacing: spacing,
      oblique: Boolean(run.italic),
      wordSpacing: 0,
      textWidth: textW,
      wordCount: 1,
    } as PDFKit.Mixins.TextOptions);
    if (run.underline || run.strike) {
      const lw = Math.max(0.6, sizePt * 0.07);
      const boxTop = pxToPt(run.y);
      const boxH = pxToPt(run.h);
      doc.save();
      if (run.underline) {
        doc.rect(x, boxTop + boxH - lw, textW, lw).fill(color);
      }
      if (run.strike) {
        doc.rect(x, boxTop + boxH * 0.48 - lw / 2, textW, lw).fill(color);
      }
      doc.restore();
    }
    if (run.href) {
      doc.link(x, y, textW, textH, run.href);
    }
  }
}

export function collectPdfBytes(doc: PDFKit.PDFDocument): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      let n = 0;
      for (const c of chunks) n += c.length;
      const out = new Uint8Array(n);
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      resolve(out);
    };
    const fail = (e: unknown) => {
      if (settled) return;
      settled = true;
      reject(e instanceof Error ? e : new Error(String(e)));
    };
    doc.on('data', (c: Uint8Array) => {
      chunks.push(c instanceof Uint8Array ? c : new Uint8Array(c));
    });
    doc.on('end', finish);
    doc.on('error', fail);
  });
}

export function drawPdfkitPages(
  doc: PDFKit.PDFDocument,
  pages: PdfkitPage[],
  fonts: { regular: string; bold: string },
) {
  for (const page of pages) {
    doc.addPage({
      size: [pxToPt(page.width), pxToPt(page.height)],
      margin: 0,
    });
    drawPage(doc, page, fonts);
  }
  doc.end();
}
