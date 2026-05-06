import { fabric } from 'fabric';
import { GlobalStyle } from '../utils/common.type';
import { cssLengthToApproxPx } from '@/utils/cssLength';

export interface SectionHeaderOptions {
  title: string;
}

function headerBandPx(fontSize: number): number {
  const fs = Number(fontSize);
  const n = Number.isFinite(fs) && fs > 0 ? fs : 13;
  return Math.max(22, Math.ceil(n + 10));
}

function normHeaderType(gs: GlobalStyle): number {
  const n = Number(gs.headerType);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(7, Math.floor(n));
}

function fabricType1(title: string, color: string, fontSize: number, w: number) {
  const band = headerBandPx(fontSize);
  const line = new fabric.Rect({
    width: 5,
    height: band,
    fill: color,
    left: 0,
    top: 0,
  });
  const text = new fabric.Text(title ?? '', {
    left: 25,
    fontSize,
    lineHeight: 1,
    fontWeight: 'bold',
    fill: color,
  });
  text.set({
    top: (band - (text.height ?? 0)) / 2,
  });
  const bgRect = new fabric.Rect({
    width: w,
    height: band,
    fill: color,
    left: 0,
    top: 0,
    opacity: 0.1,
  });
  return new fabric.Group([bgRect, line, text], {
    originX: 'left',
    originY: 'top',
    width: w,
    left: 0,
    property: { type: 'sectionHeader', variant: 1, color },
  } as any);
}

function fabricType2(title: string, color: string, fontSize: number, w: number) {
  const text = new fabric.Text(title ?? '', {
    fontSize,
    lineHeight: 1,
    fontWeight: 'bold',
    fill: color,
    originX: 'center',
    left: w / 2,
    top: 0,
  });
  const band = headerBandPx(fontSize);
  const yLine = (text.height ?? band) + 6;
  const line = new fabric.Line([0, yLine, w, yLine], {
    stroke: color,
    strokeWidth: 1,
  });
  const h = yLine + 4;
  return new fabric.Group([text, line], {
    width: w,
    height: h,
    property: { type: 'sectionHeader', variant: 2, color },
  } as any);
}

function fabricType4(title: string, color: string, fontSize: number, w: number) {
  const text = new fabric.Text(title ?? '', {
    fontSize,
    lineHeight: 1,
    fontWeight: 'bold',
    fill: color,
    left: 0,
    top: 0,
  });
  const band = headerBandPx(fontSize);
  const yLine = (text.height ?? band) + 6;
  const line = new fabric.Line([0, yLine, w, yLine], {
    stroke: color,
    strokeWidth: 1,
  });
  const h = yLine + 4;
  return new fabric.Group([text, line], {
    width: w,
    height: h,
    property: { type: 'sectionHeader', variant: 4, color },
  } as any);
}

function fabricType35Approx(title: string, color: string, fontSize: number, w: number) {
  const text = new fabric.Text(title ?? '', {
    fontSize,
    lineHeight: 1,
    fontWeight: 'bold',
    fill: '#fff',
    left: 12,
    top: 4,
  });
  const band = headerBandPx(fontSize);
  const tw = (text.width ?? 80) + 28;
  const blockH = band + 4;
  const block = new fabric.Rect({
    width: Math.min(tw, w * 0.55),
    height: blockH,
    fill: color,
    left: 0,
    top: 0,
    skewX: -8,
  });
  const line = new fabric.Line([Math.min(tw, w * 0.55) + 8, blockH / 2, w, blockH / 2], {
    stroke: color,
    strokeWidth: 1,
    opacity: 0.45,
  });
  return new fabric.Group([block, text, line], {
    width: w,
    height: band + 8,
    property: { type: 'sectionHeader', variant: 35, color },
  } as any);
}

function fabricType6(title: string, color: string, fontSize: number, w: number) {
  const fs = Number(fontSize);
  const fn = Number.isFinite(fs) && fs > 0 ? fs : 13;
  const scale = fn / 13;
  const triH = Math.max(4, Math.round(6 * scale));
  const triW = Math.max(6, Math.round(9 * scale));
  const triGap = Math.max(4, Math.round(5 * scale));
  const triH2 = triH * 2;
  const tri1 = new fabric.Polygon(
    [
      { x: 0, y: triH },
      { x: triW, y: 0 },
      { x: triW, y: triH2 },
    ],
    { fill: color, left: 0, top: 4 }
  );
  const tri2 = new fabric.Polygon(
    [
      { x: 0, y: triH },
      { x: triW, y: 0 },
      { x: triW, y: triH2 },
    ],
    { fill: color, opacity: 0.4, left: triGap, top: 4 }
  );
  const textLeft = triW + triGap + 8;
  const text = new fabric.Text(title ?? '', {
    fontSize,
    fontWeight: 'bold',
    fill: color,
    left: textLeft,
    top: 4,
  });
  const band = headerBandPx(fontSize);
  const midY = (band + 4) / 2;
  const tx = textLeft + (text.width ?? 0) + 8;
  const line = new fabric.Line([tx, midY, w, midY], {
    stroke: color,
    strokeWidth: 1,
  });
  return new fabric.Group([tri1, tri2, text, line], {
    width: w,
    height: band + 8,
    property: { type: 'sectionHeader', variant: 6, color },
  } as any);
}

export default function createSectionHeader(
  props: SectionHeaderOptions,
  globalStyle: GlobalStyle
) {
  const { title } = props;
  const { color, fontSize } = globalStyle;
  const pad = globalStyle.padding ?? 0;
  const widthPx = cssLengthToApproxPx(globalStyle.width);
  const w = widthPx - pad * 2;
  const t = normHeaderType(globalStyle);
  if (t === 2) return fabricType2(title, color, fontSize, w);
  if (t === 4) return fabricType4(title, color, fontSize, w);
  if (t === 3 || t === 5) return fabricType35Approx(title, color, fontSize, w);
  if (t === 6) return fabricType6(title, color, fontSize, w);
  return fabricType1(title, color, fontSize, w);
}
