import {
  Document,
  AlignmentType,
  FrameAnchorType,
  FrameWrap,
  HeightRule,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
  TextWrappingType,
  VerticalPositionRelativeFrom,
} from 'docx';
import { dataUrlToBytes } from '@/lib/pdfkitExport/draw';
import { parseCssColor, pxToPt } from '@/lib/pdfkitExport/layout';
import type { PdfkitFillRun, PdfkitImageRun, PdfkitPage, PdfkitTextRun } from '@/lib/pdfkitExport/types';
import {
  embedFontsInDocx,
  type DocxEmbedFontFace,
} from '@/lib/docxExport/embedFonts';

export type BuildDocxOptions = {
  /** 简历所选字体族名（写入 rFonts）；优先于 run.fontFamily */
  fontFamily?: string;
  /** 子集 TTF 嵌入，否则 Word 无本地字体时会回退 */
  embedFonts?: DocxEmbedFontFace;
};

/** 96dpi CSS px → twip */
const PX_TO_TWIP = 15;
/** 96dpi CSS px → EMU（浮动图定位） */
const PX_TO_EMU = 9525;
/** 仅合并普通文本中几乎贴住的碎片；info1 另按整行合并。 */
const MERGE_TOUCH_GAP_PX = 2;
/** Word 的字体 shaping 与浏览器可能有亚像素差异，给 Frame 留少量安全宽度。 */
const DOCX_TEXT_WIDTH_SAFETY_PX = 6;

function pxTwip(px: number): number {
  return Math.max(1, Math.round(px * PX_TO_TWIP));
}

function pxEmu(px: number): number {
  return Math.max(0, Math.round(px * PX_TO_EMU));
}

function cssColorToHex(color: string): string | null {
  const hex = parseCssColor(color);
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.slice(1).toUpperCase();
}

function imageType(dataUrl: string): 'png' | 'jpg' {
  return /^data:image\/jpe?g/i.test(dataUrl) ? 'jpg' : 'png';
}

/** 生成 1x1 纯色 BMP，作为 Word/LibreOffice 都能渲染的浮动背景图。 */
function solidColorBmp(color: string): Uint8Array | null {
  const hex = cssColorToHex(color);
  if (!hex) return null;
  const bytes = new Uint8Array(58);
  const view = new DataView(bytes.buffer);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, bytes.length, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, 1, true);
  view.setInt32(22, 1, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, 4, true);
  bytes[54] = b;
  bytes[55] = g;
  bytes[56] = r;
  return bytes;
}

function roundedColorSvg(color: string, w: number, h: number, radius: number): Uint8Array | null {
  const hex = cssColorToHex(color);
  if (!hex) return null;
  const rx = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="#${hex}"/></svg>`;
  return new TextEncoder().encode(xml);
}

/** Word 中文加粗依赖 eastAsia 字体名；跳过系统无衬线占位 */
export function pickDocxFontFamily(cssFontFamily?: string): string {
  const parts = String(cssFontFamily ?? '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  const skip =
    /^(?:-apple-system|BlinkMacSystemFont|system-ui|Segoe UI|Roboto|Helvetica Neue|Helvetica|Arial|sans-serif|serif|monospace)$/i;
  for (const p of parts) {
    if (!skip.test(p)) return p;
  }
  return 'Microsoft YaHei';
}

/**
 * 根据浏览器 Canvas 实际字形边界计算 Frame 顶边上移量。
 *
 * run.y 是 DOM 文本矩形的顶部，Frame 内部使用 EXACT 行高时会把字形
 * 放在线盒中间。用 ascent/descent 还原字形在行盒中的留白，避免所有
 * 字体都套用同一个固定比例。
 */
export function docxTextYLiftPx(
  run: Pick<PdfkitTextRun, 'fontSize' | 'h' | 'textAscent' | 'textDescent' | 'isHeader' | 'info1LineId'>,
): number {
  // info1 的 Frame 顶部必须严格等于浏览器行容器顶部；行内对齐交给
  // Word 段落 alignment，不能再把整个 Frame 按字形基线上移。
  if (run.isHeader || run.info1LineId) return 0;
  const ascent = Number(run.textAscent);
  const descent = Number(run.textDescent);
  if (!Number.isFinite(ascent) || !Number.isFinite(descent) || ascent <= 0 || descent < 0) {
    return 0;
  }
  const inkHeight = ascent + descent;
  const lineHeight = Math.max(run.h, run.fontSize * 1.15);
  return Math.max(0, (lineHeight - inkHeight) / 2);
}

/**
 * DOM 盒宽和 Canvas 实测字宽取最大值，避免 Word 使用同一字体时因
 * shaping/四舍五入差异把文字裁在 Frame 边界内。
 */
export function docxFrameWidthPx(
  run: Pick<PdfkitTextRun, 'w' | 'fontSize' | 'textWidth' | 'isInfo1' | 'info1LineId' | 'info1LineW'>,
): number {
  if (run.info1LineId && Number.isFinite(run.info1LineW) && (run.info1LineW ?? 0) > 0) {
    return Math.max(1, run.info1LineW!);
  }
  const measured = Number(run.textWidth);
  const safety = Math.max(DOCX_TEXT_WIDTH_SAFETY_PX, run.fontSize * 0.12);
  const measuredWithSafety = Number.isFinite(measured) && measured > 0
    ? measured + safety
    : 0;
  return Math.max(1, run.w, measuredWithSafety);
}

function isPipeRun(text: string): boolean {
  return text.replace(/\u00a0/g, ' ').trim() === '|';
}

function mergeInfo1LineRuns(runs: PdfkitTextRun[]): PdfkitTextRun[] {
  const infoRuns = runs.filter((run) => run.isInfo1);
  if (infoRuns.length <= 1) return infoRuns;
  const keyed = new Map<string, PdfkitTextRun[]>();
  const fallback: PdfkitTextRun[] = [];
  for (const run of infoRuns) {
    if (run.info1LineId) {
      const line = keyed.get(run.info1LineId) ?? [];
      line.push(run);
      keyed.set(run.info1LineId, line);
    } else {
      fallback.push(run);
    }
  }
  const lines: PdfkitTextRun[][] = Array.from(keyed.values());
  if (fallback.length) {
    const sorted = [...fallback].sort((a, b) => a.y - b.y || a.x - b.x);
    for (const run of sorted) {
      const line = lines.find((candidate) =>
        !candidate[0]?.info1LineId && Math.abs(run.y - candidate[0]!.y) <= Math.max(4, run.fontSize * 0.45),
      );
      if (line) line.push(run);
      else lines.push([run]);
    }
  }
  return lines.map((line) => {
    line.sort((a, b) => a.x - b.x);
    const first = line[0]!;
    const last = line[line.length - 1]!;
    const hasLineBox = first.info1LineId && Number.isFinite(first.info1LineW) && Number.isFinite(first.info1LineH);
    return {
      ...first,
      text: joinDocxRunTexts(line),
      x: hasLineBox ? first.info1LineX! : first.x,
      y: hasLineBox ? first.info1LineY! : Math.min(...line.map((run) => run.y)),
      w: hasLineBox ? first.info1LineW! : Math.max(last.x + last.w - first.x, 1),
      h: hasLineBox ? first.info1LineH! : Math.max(...line.map((run) => run.h)),
      textWidth: Math.max(
        hasLineBox ? first.info1LineW! : last.x + last.w - first.x,
        line.reduce((sum, run) => sum + (Number(run.textWidth) || run.w), 0),
      ),
    };
  });
}

/** 贴合碎片拼接（不插入空格）；含 `|` 的不参与合并 */
export function joinDocxRunTexts(runs: PdfkitTextRun[]): string {
  return runs.map((r) => r.text).join('');
}

/**
 * 仅合并同行且几乎贴住的 text 碎片（同一字段被拆成多 node 时）。
 * 不跨 `|`；info1 在这里按整行保留字段顺序和间隔符。
 */
export function mergeAdjacentDocxTextRuns(runs: PdfkitTextRun[]): PdfkitTextRun[] {
  if (runs.length <= 1) return runs;
  const info1Lines = mergeInfo1LineRuns(runs);
  const nonInfo1Runs = runs.filter((run) => !run.isInfo1);
  const sorted = [...nonInfo1Runs].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: PdfkitTextRun[][] = [];
  for (const run of sorted) {
    const line = lines[lines.length - 1];
    const yTol = Math.max(4, run.fontSize * 0.45);
    if (!line || Math.abs(run.y - line[0].y) > yTol) {
      lines.push([run]);
    } else {
      line.push(run);
    }
  }
  const out: PdfkitTextRun[] = [];
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
    const clusters: PdfkitTextRun[][] = [];
    for (const run of line) {
      const cur = clusters[clusters.length - 1];
      if (!cur) {
        clusters.push([run]);
        continue;
      }
      const prev = cur[cur.length - 1];
      const gap = run.x - (prev.x + prev.w);
      const join =
        !isPipeRun(prev.text) &&
        !isPipeRun(run.text) &&
        gap <= MERGE_TOUCH_GAP_PX;
      if (join) cur.push(run);
      else clusters.push([run]);
    }
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        out.push(cluster[0]);
        continue;
      }
      const first = cluster[0];
      const last = cluster[cluster.length - 1];
      out.push({
        ...first,
        text: joinDocxRunTexts(cluster),
        x: first.x,
        y: Math.min(...cluster.map((r) => r.y)),
        w: Math.max(last.x + last.w - first.x, 4),
        h: Math.max(...cluster.map((r) => r.h)),
        ...(cluster.some((r) => r.textWidth != null)
          ? {
              textWidth: cluster.reduce(
                (sum, r) => sum + (Number(r.textWidth) || r.w),
                0,
              ),
            }
          : {}),
      });
    }
  }
  return [...out, ...info1Lines].sort((a, b) => a.y - b.y || a.x - b.x);
}

function textParagraph(run: PdfkitTextRun, fontFamily?: string): Paragraph {
  const color = cssColorToHex(run.color) ?? '000000';
  const size = Math.max(12, Math.round(pxToPt(run.fontSize) * 2));
  const frameW = docxFrameWidthPx(run);
  const frameH = Math.max(run.h, run.fontSize * 1.15);
  const y = Math.max(0, run.y - docxTextYLiftPx(run));
  const lineTwip = pxTwip(frameH);
  const bold = run.fontWeight >= 600;
  const family = fontFamily || pickDocxFontFamily(run.fontFamily);
  return new Paragraph({
    alignment:
      run.info1LineAlign === 'center'
        ? AlignmentType.CENTER
        : run.info1LineAlign === 'right'
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT,
    frame: {
      type: 'absolute',
      position: { x: pxTwip(run.x), y: pxTwip(y) },
      width: pxTwip(frameW),
      height: pxTwip(frameH),
      anchor: {
        horizontal: FrameAnchorType.PAGE,
        vertical: FrameAnchorType.PAGE,
      },
      wrap: FrameWrap.NONE,
      rule: HeightRule.EXACT,
      space: { horizontal: 0, vertical: 0 },
    },
    indent: { left: 0, right: 0, firstLine: 0, hanging: 0 },
    spacing: {
      before: 0,
      after: 0,
      line: lineTwip,
      lineRule: LineRuleType.EXACT,
    },
    children: [
      new TextRun({
        text: run.text,
        size,
        bold,
        boldComplexScript: bold,
        font: {
          ascii: family,
          hAnsi: family,
          eastAsia: family,
          cs: family,
        },
        italics: Boolean(run.italic),
        underline: run.underline ? {} : undefined,
        strike: Boolean(run.strike),
        color,
        snapToGrid: false,
        ...(run.letterSpacing
          ? { characterSpacing: Math.round(run.letterSpacing * PX_TO_TWIP) }
          : {}),
      }),
    ],
  });
}

function imageParagraph(img: PdfkitImageRun, zIndex: number): Paragraph | null {
  const bytes = dataUrlToBytes(img.dataUrl);
  if (!bytes) return null;
  const w = Math.max(1, Math.round(img.w));
  const h = Math.max(1, Math.round(img.h));
  return new Paragraph({
    children: [
      new ImageRun({
        type: imageType(img.dataUrl),
        data: bytes,
        transformation: { width: w, height: h },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            offset: pxEmu(img.x),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: pxEmu(img.y),
          },
          allowOverlap: true,
          behindDocument: true,
          wrap: { type: TextWrappingType.NONE },
          zIndex,
        },
      }),
    ],
  });
}

function fillParagraph(fill: PdfkitFillRun): Paragraph | null {
  const data = solidColorBmp(fill.color);
  if (!data) return null;
  const w = Math.max(1, Math.round(fill.w));
  const h = Math.max(1, Math.round(fill.h));
  const svg = fill.radius && fill.radius > 0
    ? roundedColorSvg(fill.color, w, h, fill.radius)
    : null;
  return new Paragraph({
    children: [
      new ImageRun({
        ...(svg
          ? { type: 'svg' as const, data: svg, fallback: { type: 'bmp' as const, data } }
          : { type: 'bmp' as const, data }),
        transformation: { width: w, height: h },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            offset: pxEmu(fill.x),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: pxEmu(fill.y),
          },
          allowOverlap: true,
          behindDocument: true,
          wrap: { type: TextWrappingType.NONE },
          // zIndex=0 会被 docx 回退成图片高度（相当于置顶），必须显式给出
          // 一个正常层级；背景先写入，后续头像图片自然位于其上方。
          zIndex: 1,
        },
      }),
    ],
  });
}

function pageChildren(page: PdfkitPage, fontFamily?: string): Paragraph[] {
  const out: Paragraph[] = [];
  let z = 1;
  for (const fill of page.fills ?? []) {
    const p = fillParagraph(fill);
    if (p) out.push(p);
  }
  for (const img of page.images) {
    const p = imageParagraph(img, z);
    z += 1;
    if (p) out.push(p);
  }
  for (const run of mergeAdjacentDocxTextRuns(page.runs.filter((r) => r.text))) {
    out.push(textParagraph(run, fontFamily));
  }
  if (!out.length) out.push(new Paragraph({ children: [] }));
  return out;
}

function buildDocument(pages: PdfkitPage[], fontFamily?: string): Document {
  if (!pages.length) {
    return new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun('')] })] }],
    });
  }
  return new Document({
    sections: pages.map((page) => ({
      properties: {
        page: {
          size: {
            width: pxTwip(page.width),
            height: pxTwip(page.height),
          },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: pageChildren(page, fontFamily),
    })),
  });
}

async function packDocx(
  pages: PdfkitPage[],
  opts?: BuildDocxOptions,
): Promise<Uint8Array> {
  const family = opts?.fontFamily?.trim() || undefined;
  const bytes = Uint8Array.from(await Packer.toBuffer(buildDocument(pages, family)));
  if (!opts?.embedFonts?.regular?.length) return bytes;
  try {
    return await embedFontsInDocx(bytes, {
      family: opts.embedFonts.family || family || 'Microsoft YaHei',
      regular: opts.embedFonts.regular,
      bold: opts.embedFonts.bold,
    });
  } catch {
    return bytes;
  }
}

export async function buildDocxFromPages(
  pages: PdfkitPage[],
  opts?: BuildDocxOptions,
): Promise<Blob> {
  const bytes = await packDocx(pages, opts);
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function buildDocxUint8ArrayFromPages(
  pages: PdfkitPage[],
  opts?: BuildDocxOptions,
): Promise<Uint8Array> {
  return packDocx(pages, opts);
}
