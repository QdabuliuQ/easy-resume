// @vitest-environment node
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  buildDocxUint8ArrayFromPages,
  docxFrameWidthPx,
  docxTextYLiftPx,
  joinDocxRunTexts,
  mergeAdjacentDocxTextRuns,
  pickDocxFontFamily,
} from '@/lib/docxExport/buildFromPages';
import { shouldBakeDecorText } from '@/lib/pdfkitExport/collect';
import type { PdfkitPage, PdfkitTextRun } from '@/lib/pdfkitExport/types';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

const baseRun = (partial: Partial<PdfkitTextRun> & Pick<PdfkitTextRun, 'text' | 'x'>): PdfkitTextRun => ({
  y: 80,
  w: 40,
  h: 16,
  fontSize: 12,
  fontWeight: 400,
  color: '#111111',
  letterSpacing: 0,
  ...partial,
});

describe('shouldBakeDecorText', () => {
  it('default layers text on decor snap; bake only when skipDecorText', () => {
    expect(shouldBakeDecorText()).toBe(false);
    expect(shouldBakeDecorText({ skipDecorText: true })).toBe(true);
  });
});

describe('docxTextYLiftPx', () => {
  it('lifts frame top so Word glyphs align with CSS ink box', () => {
    expect(docxTextYLiftPx({ fontSize: 20, h: 24, textAscent: 15, textDescent: 4 })).toBe(2.5);
    expect(docxTextYLiftPx({ fontSize: 20, h: 24 })).toBe(0);
    expect(
      docxTextYLiftPx({
        fontSize: 20,
        h: 24,
        textAscent: 15,
        textDescent: 4,
        isHeader: true,
      }),
    ).toBe(0);
    expect(
      docxTextYLiftPx({
        fontSize: 20,
        h: 24,
        textAscent: 15,
        textDescent: 4,
        info1LineId: 'info:0',
      }),
    ).toBe(0);
  });
});

describe('pickDocxFontFamily', () => {
  it('skips system placeholders and keeps CJK family for eastAsia bold', () => {
    expect(
      pickDocxFontFamily(
        '-apple-system, BlinkMacSystemFont, "Noto Sans SC", "Microsoft YaHei", sans-serif',
      ),
    ).toBe('Noto Sans SC');
    expect(pickDocxFontFamily('Arial, sans-serif')).toBe('Microsoft YaHei');
  });
});

describe('docxFrameWidthPx', () => {
  it('uses DOM-measured css px width as-is for docx frame', () => {
    expect(docxFrameWidthPx({ w: 186.4, fontSize: 12 })).toBe(186.4);
    expect(docxFrameWidthPx({ w: 40, fontSize: 20, textWidth: 80 })).toBe(86);
    expect(docxFrameWidthPx({ w: 40, fontSize: 20, textWidth: 80, isInfo1: true })).toBe(86);
    expect(
      docxFrameWidthPx({
        w: 40,
        fontSize: 20,
        textWidth: 80,
        isInfo1: true,
        info1LineId: 'info:0',
        info1LineW: 240,
      }),
    ).toBe(240);
    expect(docxFrameWidthPx({ w: 0, fontSize: 12 })).toBe(1);
  });
});

describe('mergeAdjacentDocxTextRuns', () => {
  it('merges info fields and pipe separators into one line run', () => {
    const merged = mergeAdjacentDocxTextRuns([
      baseRun({ text: '13511223344', x: 100, w: 90, isInfo1: true }),
      baseRun({ text: '\u00a0\u00a0|\u00a0\u00a0', x: 200, w: 24, isInfo1: true }),
      baseRun({ text: 'a@b.com', x: 234, w: 70, isInfo1: true }),
      baseRun({ text: '\u00a0\u00a0|\u00a0\u00a0', x: 314, w: 24, isInfo1: true }),
      baseRun({ text: '深圳', x: 348, w: 28, isInfo1: true }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.text).toBe('13511223344\u00a0\u00a0|\u00a0\u00a0a@b.com\u00a0\u00a0|\u00a0\u00a0深圳');
  });

  it('uses the real info1 row box for position and width', () => {
    const merged = mergeAdjacentDocxTextRuns([
      baseRun({
        text: '左',
        x: 110,
        w: 12,
        y: 80,
        isInfo1: true,
        info1LineId: 'info:0',
        info1LineX: 100,
        info1LineY: 78,
        info1LineW: 260,
        info1LineH: 20,
        info1LineAlign: 'right',
      }),
      baseRun({
        text: '\u00a0|\u00a0',
        x: 122,
        w: 20,
        y: 80,
        isInfo1: true,
        info1LineId: 'info:0',
        info1LineX: 100,
        info1LineY: 78,
        info1LineW: 260,
        info1LineH: 20,
        info1LineAlign: 'right',
      }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      x: 100,
      y: 78,
      w: 260,
      h: 20,
      info1LineAlign: 'right',
      text: '左\u00a0|\u00a0',
    });
  });

  it('merges only touching fragments inside one field (e.g. salary)', () => {
    const merged = mergeAdjacentDocxTextRuns([
      baseRun({ text: '18k', x: 100, w: 24 }),
      baseRun({ text: '\u00a0-\u00a0', x: 124, w: 12 }),
      baseRun({ text: '28k', x: 136, w: 24 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe('18k\u00a0-\u00a028k');
    expect(merged[0].w).toBe(60);
  });

  it('carries measured width across merged text fragments', () => {
    const merged = mergeAdjacentDocxTextRuns([
      baseRun({ text: '18k', x: 100, w: 24, textWidth: 26 }),
      baseRun({ text: '\u00a0-\u00a0', x: 124, w: 12, textWidth: 14 }),
      baseRun({ text: '28k', x: 136, w: 24, textWidth: 27 }),
    ]);
    expect(merged[0]?.textWidth).toBe(67);
  });

  it('does not merge far-apart runs on the same baseline without a pipe', () => {
    const merged = mergeAdjacentDocxTextRuns([
      baseRun({ text: '左侧', x: 40, w: 30 }),
      baseRun({ text: '右侧正文', x: 320, w: 60 }),
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe('joinDocxRunTexts', () => {
  it('concatenates touching fragments without inserting spaces', () => {
    expect(
      joinDocxRunTexts([
        baseRun({ text: '18k', x: 0, w: 24 }),
        baseRun({ text: '\u00a0-\u00a0', x: 24, w: 12 }),
        baseRun({ text: '28k', x: 36, w: 24 }),
      ]),
    ).toBe('18k\u00a0-\u00a028k');
  });
});

describe('buildDocxUint8ArrayFromPages', () => {
  it('builds a zip/docx from pdfkit-like pages (text + header/avatar images)', async () => {
    const page: PdfkitPage = {
      width: 794,
      height: 1123,
      background: '#ffffff',
      runs: [
        {
          text: '张三',
          x: 80,
          y: 40,
          w: 120,
          h: 28,
          fontSize: 22,
          fontWeight: 700,
          color: '#111111',
          letterSpacing: 0,
          fontFamily: 'Noto Sans SC, sans-serif',
        },
        {
          text: '工作经历正文可选择',
          x: 80,
          y: 200,
          w: 280,
          h: 18,
          fontSize: 12,
          fontWeight: 400,
          color: '#333333',
          letterSpacing: 0,
        },
      ],
      images: [
        {
          x: 40,
          y: 120,
          w: 700,
          h: 36,
          dataUrl: TINY_PNG,
        },
        {
          x: 640,
          y: 36,
          w: 72,
          h: 72,
          dataUrl: TINY_PNG,
        },
      ],
      fills: [{ x: 0, y: 0, w: 794, h: 8, color: '#1a9b8e' }],
    };
    const bytes = await buildDocxUint8ArrayFromPages([page]);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('w:val="33"');
    expect(xml).toContain('w:w="1800"');
    // 没有 Canvas 度量时采用零回退偏移，Frame 顶边与 DOM y 保持一致。
    expect(xml).toContain(`w:y="${Math.round(40 * 15)}"`);
    expect(xml).toContain('w:hSpace="0"');
    expect(xml).toContain('w:vSpace="0"');
    const nameAt = xml.indexOf('张三');
    expect(nameAt).toBeGreaterThan(0);
    const nameRun = xml.slice(Math.max(0, nameAt - 280), nameAt);
    expect(nameRun).toContain('<w:b');
    expect(nameRun).toContain('w:eastAsia="Noto Sans SC"');
  });

  it('writes configured resume font family into rFonts', async () => {
    const page: PdfkitPage = {
      width: 794,
      height: 1123,
      background: '#ffffff',
      runs: [
        baseRun({ text: '字体测试', x: 40, w: 80, y: 40, fontFamily: 'Arial' }),
      ],
      images: [],
      fills: [],
    };
    const bytes = await buildDocxUint8ArrayFromPages([page], {
      fontFamily: '月星楷',
    });
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('w:eastAsia="月星楷"');
    expect(xml).not.toContain('w:eastAsia="Arial"');
  });

  it('exports page fills as floating bitmap backgrounds', async () => {
    const bytes = await buildDocxUint8ArrayFromPages([
      {
        width: 794,
        height: 1123,
        background: '#ffffff',
        runs: [],
        images: [],
        fills: [{ x: 0, y: 0, w: 240, h: 1123, color: '#1a9b8e', radius: 120 }],
      },
    ]);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('wp:anchor');
    expect(xml).toContain(`cx="${240 * 9525}"`);
    expect(xml).toContain(`cy="${1123 * 9525}"`);
    expect(Object.keys(zip.files).some((name) => name.endsWith('.bmp'))).toBe(true);
    expect(Object.keys(zip.files).some((name) => name.endsWith('.svg'))).toBe(true);
  });

  it('exports info fields as one frame per line', async () => {
    const page: PdfkitPage = {
      width: 794,
      height: 1123,
      background: '#ffffff',
      runs: [
        baseRun({ text: '13511223344', x: 200, w: 90, y: 60, isInfo1: true, info1LineId: 'info:0', info1LineX: 180, info1LineY: 58, info1LineW: 360, info1LineH: 20, info1LineAlign: 'right' }),
        baseRun({ text: '\u00a0\u00a0|\u00a0\u00a0', x: 300, w: 24, y: 60, isInfo1: true, info1LineId: 'info:0', info1LineX: 180, info1LineY: 58, info1LineW: 360, info1LineH: 20, info1LineAlign: 'right' }),
        baseRun({ text: 'a@b.com', x: 334, w: 70, y: 60, isInfo1: true, info1LineId: 'info:0', info1LineX: 180, info1LineY: 58, info1LineW: 360, info1LineH: 20, info1LineAlign: 'right' }),
      ],
      images: [],
      fills: [],
    };
    const bytes = await buildDocxUint8ArrayFromPages([page]);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('13511223344');
    expect(xml).toContain('a@b.com');
    expect(xml).toContain('13511223344');
    expect(xml).toContain('a@b.com');
    expect(xml.split('<w:framePr').length - 1).toBe(1);
    expect(xml).toContain(`w:x="${180 * 15}"`);
    expect(xml).toContain(`w:y="${58 * 15}"`);
    expect(xml).toContain(`w:w="${360 * 15}"`);
    expect(xml).toContain('<w:jc w:val="right"');
  });
});
