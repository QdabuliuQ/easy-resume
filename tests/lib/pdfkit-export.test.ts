// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildPdfkitDocument } from '@/lib/pdfkitExport/build';
import {
  boxFullyInside,
  boxTopInsideClip,
  boxVerticallyInside,
  cssBorderRadiusPx,
  cssHasClipPath,
  cssPseudoIsVisual,
  cssRichTextFlags,
  discLeftOfLine,
  flushToPageEdge,
  groupTextNodeIntoLineRuns,
  intersectBoxes,
  isDiscGlyph,
  imageMimeFromSrc,
  normalizePdfHref,
  objectFitCrop,
  orRichTextFlags,
  parseCssBeforeContent,
  parseCssColor,
  pdfkitTextY,
  pxToPt,
  tagRichTextFlags,
  type LineRect,
} from '@/lib/pdfkitExport/layout';

function lineGetRects(
  breakAt: number,
  charW = 8,
  lineH = 16,
): (start: number, end: number) => LineRect[] {
  return (start, end) => {
    if (end <= start) return [];
    if (start < breakAt && end > breakAt) {
      return [
        { top: 0, left: start * charW, width: (breakAt - start) * charW, height: lineH },
        { top: lineH, left: 0, width: (end - breakAt) * charW, height: lineH },
      ];
    }
    if (end <= breakAt) {
      return [
        { top: 0, left: start * charW, width: (end - start) * charW, height: lineH },
      ];
    }
    return [
      {
        top: lineH,
        left: (start - breakAt) * charW,
        width: (end - start) * charW,
        height: lineH,
      },
    ];
  };
}

describe('pdfkitExport layout', () => {
  it('splits a wrapping text node into two line runs', () => {
    const runs = groupTextNodeIntoLineRuns('abcdefghij', lineGetRects(5));
    expect(runs).toEqual([
      { text: 'abcde', x: 0, y: 0, w: 40, h: 16 },
      { text: 'fghij', x: 0, y: 16, w: 40, h: 16 },
    ]);
  });

  it('skips zero-size glyphs then keeps the rest', () => {
    const getRects = (start: number, end: number): LineRect[] => {
      if (start < 2 && end <= 2) return [{ top: 0, left: 0, width: 0, height: 0 }];
      if (start < 2) {
        return [{ top: 0, left: 0, width: (end - 2) * 8, height: 16 }];
      }
      return [{ top: 0, left: (start - 2) * 8, width: (end - start) * 8, height: 16 }];
    };
    const runs = groupTextNodeIntoLineRuns('  hi', getRects);
    expect(runs).toEqual([{ text: 'hi', x: 0, y: 0, w: 16, h: 16 }]);
  });

  it('parseCssColor / pxToPt', () => {
    expect(parseCssColor('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(parseCssColor('rgba(0,0,0,0)')).toBeNull();
    expect(parseCssColor('#abc')).toBe('#aabbcc');
    expect(pxToPt(96)).toBe(72);
  });

  it('caps tag / pill border-radius to half the short side', () => {
    expect(cssBorderRadiusPx('5px', 40, 18)).toBe(5);
    expect(cssBorderRadiusPx('9999px', 40, 18)).toBe(9);
    expect(cssBorderRadiusPx('50%', 20, 20)).toBe(10);
    expect(cssBorderRadiusPx('0px', 40, 18)).toBe(0);
  });

  it('raises CJK text when font em-box is taller than the CSS line box', () => {
    expect(pdfkitTextY(10, 13, 18.824)).toBeCloseTo(10 + (13 - 18.824) / 2, 5);
    expect(pdfkitTextY(10, 16, 16)).toBe(10);
  });

  it('parseCssBeforeContent unquotes and decodes escapes', () => {
    expect(parseCssBeforeContent('"\\2022"')).toBe('•');
    expect(parseCssBeforeContent("'1. '")).toBe('1. ');
    expect(parseCssBeforeContent('none')).toBeNull();
    expect(parseCssBeforeContent('counter(list-0)')).toBeNull();
  });

  it('keeps only boxes fully inside the page clip', () => {
    const clip = { x: 0, y: 0, w: 100, h: 50 };
    expect(boxFullyInside({ x: 0, y: 0, w: 100, h: 16 }, clip)).toBe(true);
    expect(boxFullyInside({ x: 0, y: 40, w: 100, h: 16 }, clip)).toBe(false);
    expect(intersectBoxes({ x: 0, y: 40, w: 20, h: 20 }, clip)).toEqual({
      x: 0,
      y: 40,
      w: 20,
      h: 10,
    });
  });

  it('keeps horizontally overflowing text if vertically on the page', () => {
    const clip = { x: 0, y: 0, w: 100, h: 50 };
    expect(boxVerticallyInside({ x: 80, y: 8, w: 40, h: 16 }, clip)).toBe(true);
    expect(boxVerticallyInside({ x: 0, y: 40, w: 40, h: 16 }, clip)).toBe(false);
  });

  it('keeps a line whose top is on the page even if the bottom crosses the seam', () => {
    const clip = { x: 0, y: 0, w: 100, h: 50 };
    expect(boxTopInsideClip({ x: 0, y: 40, w: 40, h: 16 }, clip)).toBe(true);
    expect(boxTopInsideClip({ x: 0, y: -2, w: 40, h: 16 }, clip)).toBe(true);
    expect(boxTopInsideClip({ x: 0, y: 50, w: 40, h: 16 }, clip)).toBe(false);
  });

  it('detects clip-path that fills cannot draw', () => {
    expect(cssHasClipPath({ clipPath: 'none' })).toBe(false);
    expect(cssHasClipPath({ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' })).toBe(true);
    expect(cssHasClipPath({ clipPath: 'none', webkitClipPath: 'polygon(0 0, 1px 0, 1px 1px)' })).toBe(
      true,
    );
  });

  it('detects quill rich-text decorations', () => {
    expect(
      cssRichTextFlags({
        fontStyle: 'italic',
        textDecorationLine: 'underline line-through',
      }),
    ).toEqual({ italic: true, underline: true, strike: true });
    expect(cssRichTextFlags({ fontStyle: 'normal', textDecoration: 'none' })).toEqual({
      italic: false,
      underline: false,
      strike: false,
    });
    expect(tagRichTextFlags('s')).toEqual({ italic: false, underline: false, strike: true });
    expect(tagRichTextFlags('strike')).toEqual({ italic: false, underline: false, strike: true });
    expect(tagRichTextFlags('DEL')).toEqual({ italic: false, underline: false, strike: true });
    expect(
      orRichTextFlags(tagRichTextFlags('SPAN'), tagRichTextFlags('S')),
    ).toEqual({ italic: false, underline: false, strike: true });
  });

  it('keeps only http(s)/mailto links for pdf annotations', () => {
    expect(normalizePdfHref('https://example.com/a')).toBe('https://example.com/a');
    expect(normalizePdfHref('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizePdfHref('javascript:alert(1)')).toBeUndefined();
    expect(normalizePdfHref('/relative')).toBeUndefined();
  });

  it('flushes a 1px hairline to the page edge', () => {
    const page = { x: 0, y: 0, w: 100, h: 80 };
    expect(flushToPageEdge({ x: 1, y: 1.5, w: 98, h: 20 }, page)).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 21.5,
    });
  });

  it('crops object-cover to the destination aspect', () => {
    const crop = objectFitCrop(200, 100, 90, 126, 'cover');
    expect(crop.sw / crop.sh).toBeCloseTo(90 / 126, 5);
    expect(crop.sh).toBe(100);
    expect(crop.sx).toBeCloseTo((200 - crop.sw) / 2, 5);
  });

  it('keeps png avatar mime and defaults others to jpeg', () => {
    expect(imageMimeFromSrc('data:image/png;base64,aaa')).toBe('image/png');
    expect(imageMimeFromSrc('https://cdn.example/a.png')).toBe('image/png');
    expect(imageMimeFromSrc('data:image/jpeg;base64,aaa')).toBe('image/jpeg');
    expect(imageMimeFromSrc('https://cdn.example/a.jpg')).toBe('image/jpeg');
  });

  it('treats quoted empty / glyph content as a visual pseudo', () => {
    expect(
      cssPseudoIsVisual({ content: '""', display: 'block', visibility: 'visible' }),
    ).toBe(true);
    expect(
      cssPseudoIsVisual({
        content: '"\\2022"',
        display: 'inline',
        visibility: 'visible',
      }),
    ).toBe(true);
    expect(
      cssPseudoIsVisual({ content: 'none', display: 'block', visibility: 'visible' }),
    ).toBe(false);
    expect(
      cssPseudoIsVisual({
        content: '"•"',
        display: 'inline',
        visibility: 'visible',
        opacity: '0',
      }),
    ).toBe(false);
  });

  it('places a disc left of the first text line, vertically centered', () => {
    expect(isDiscGlyph('•')).toBe(true);
    const r = Math.max(1.15, 12 * 0.14);
    expect(discLeftOfLine({ left: 40, top: 20, height: 18 }, 12, 3.6)).toEqual({
      cx: 40 - 3.6 - r,
      cy: 29,
      r,
    });
  });
});

describe('pdfkitExport draw helpers', () => {
  it('collects unique glyphs and decodes image data urls', async () => {
    const { dataUrlToBytes, glyphText, pdfkitNeedBold } = await import(
      '@/lib/pdfkitExport/draw'
    );
    expect(
      glyphText([
        {
          width: 1,
          height: 1,
          background: '#fff',
          runs: [
            {
              text: '你好',
              x: 0,
              y: 0,
              w: 1,
              h: 1,
              fontSize: 12,
              fontWeight: 400,
              color: '#000',
              letterSpacing: 0,
            },
          ],
          images: [],
        },
      ]),
    ).toContain('你');
    expect(
      pdfkitNeedBold([
        {
          width: 1,
          height: 1,
          background: '#fff',
          runs: [
            {
              text: 'A',
              x: 0,
              y: 0,
              w: 1,
              h: 1,
              fontSize: 12,
              fontWeight: 700,
              color: '#000',
              letterSpacing: 0,
            },
          ],
          images: [],
        },
      ]),
    ).toBe(true);
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    expect(dataUrlToBytes(png)?.byteLength).toBeGreaterThan(8);
  });
});

describe('subsetCache', () => {
  it('fingerprints glyphs order-independently', async () => {
    const { fingerprintGlyphs, subsetCacheKey, getCachedSubset, setCachedSubset } =
      await import('@/lib/pdfkitExport/subsetCache');
    expect(fingerprintGlyphs('你a好')).toBe(fingerprintGlyphs('好你a'));
    expect(subsetCacheKey('a.woff2', '你')).not.toBe(subsetCacheKey('b.woff2', '你'));
    const key = subsetCacheKey('demo.woff2', '测');
    const buf = new Uint8Array([1, 2, 3, 4]);
    setCachedSubset(key, buf);
    expect(await getCachedSubset(key)).toEqual(buf);
  });
});

describe('subsetWoff2ToSfnt', () => {
  it('subsets CJK woff2 with browser hb-subset wasm', async () => {
    const { existsSync } = await import('fs');
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const fontFile = join(process.cwd(), 'public/fonts/NotoSansSC-Regular.woff2');
    const wasmFile = join(process.cwd(), 'public/wasm/hb-subset.wasm');
    if (!existsSync(fontFile) || !existsSync(wasmFile)) return;
    const font = await readFile(fontFile);
    const wasm = await readFile(wasmFile);
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const s = String(input);
      if (s.includes('hb-subset.wasm')) {
        return new Response(wasm, { headers: { 'Content-Type': 'application/wasm' } });
      }
      return origFetch(input);
    }) as typeof fetch;
    try {
      const { subsetWoff2ToSfnt } = await import('@/lib/pdfkitExport/subsetBrowser');
      const out = await subsetWoff2ToSfnt(new Uint8Array(font), '你好Hello');
      expect(out.byteLength).toBeGreaterThan(200);
      expect(out.byteLength).toBeLessThan(80_000);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('buildPdfkitDocumentInBrowser', () => {
  it('writes a PDF with standalone pdfkit and subset fonts', async () => {
    const { existsSync } = await import('fs');
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const fontFile = join(process.cwd(), 'public/fonts/NotoSansSC-Regular.woff2');
    const wasmFile = join(process.cwd(), 'public/wasm/hb-subset.wasm');
    if (!existsSync(fontFile) || !existsSync(wasmFile)) return;
    const font = await readFile(fontFile);
    const wasm = await readFile(wasmFile);
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const s = String(input);
      if (s.includes('hb-subset.wasm')) {
        return new Response(wasm, { headers: { 'Content-Type': 'application/wasm' } });
      }
      if (s.includes('/fonts/')) {
        return new Response(font, { headers: { 'Content-Type': 'font/woff2' } });
      }
      return origFetch(input);
    }) as typeof fetch;
    try {
      const { buildPdfkitDocumentInBrowser } = await import(
        '@/lib/pdfkitExport/buildClient'
      );
      const pdf = await buildPdfkitDocumentInBrowser({
        font: 'noto-sans-sc',
        pages: [
          {
            width: 200,
            height: 80,
            background: '#ffffff',
            runs: [
              {
                text: '你好',
                x: 8,
                y: 8,
                w: 40,
                h: 16,
                fontSize: 12,
                fontWeight: 400,
                color: '#000',
                letterSpacing: 0,
              },
            ],
            images: [],
            fills: [],
          },
        ],
      });
      expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe('%PDF-');
      expect(pdf.byteLength).toBeGreaterThan(500);
      expect(pdf.byteLength).toBeLessThan(200_000);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('buildPdfkitDocument', () => {
  it('subsets CJK woff2 when local fonts exist', async () => {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    const fontFile = join(process.cwd(), 'public/fonts/NotoSansSC-Regular.woff2');
    if (!existsSync(fontFile)) return;
    const buf = await buildPdfkitDocument({
      font: 'noto-sans-sc',
      pages: [
        {
          width: 200,
          height: 80,
          background: '#ffffff',
          runs: [
            {
              text: '你好',
              x: 8,
              y: 8,
              w: 40,
              h: 16,
              fontSize: 12,
              fontWeight: 400,
              color: '#000',
              letterSpacing: 0,
            },
          ],
          images: [],
          fills: [],
        },
      ],
    });
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.length).toBeLessThan(200_000);
  });

  it('writes a PDF from measured ascii runs', async () => {
    const buf = await buildPdfkitDocument(
      {
        font: 'noto-sans-sc',
        pages: [
          {
            width: 794,
            height: 1123,
            background: '#ffffff',
            runs: [
              {
                text: 'Hello',
                x: 24,
                y: 32,
                w: 40,
                h: 16,
                fontSize: 12,
                fontWeight: 700,
                color: 'rgb(0, 0, 0)',
                letterSpacing: 0,
                italic: true,
                underline: true,
                strike: true,
                href: 'https://example.com',
              },
            ],
            images: [],
            fills: [{ x: 0, y: 0, w: 40, h: 1123, color: '#1f4e79' }],
            discs: [{ cx: 20, cy: 40, r: 2, color: '#000000' }],
          },
        ],
      },
      { skipCustomFont: true },
    );
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(200);
  });

  it('embeds png data-url images as xobjects', async () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    const buf = await buildPdfkitDocument(
      {
        font: 'noto-sans-sc',
        pages: [
          {
            width: 200,
            height: 80,
            background: '#ffffff',
            runs: [],
            images: [{ x: 8, y: 8, w: 24, h: 24, dataUrl: png }],
          },
        ],
      },
      { skipCustomFont: true },
    );
    const text = buf.toString('latin1');
    expect(text).toContain('/Subtype /Image');
  });
});
