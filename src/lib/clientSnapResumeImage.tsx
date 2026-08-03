'use client';
import { snapdom } from '@zumer/snapdom';
import { jsPDF } from 'jspdf';
import { NextIntlClientProvider } from 'next-intl';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import defaultResume from '@/json/resume.defaults';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import {
  preloadResumeFontsForSnap,
  resumeFontForExport,
  resumeSnapLocalFonts,
} from '@/lib/resumeFont';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { prepareResumeSnapSubtree } from '@/lib/resumeSnapPrepare';
import { cropImageBlob } from '@/lib/imageCropWorkerClient';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ResumeImageExportPage from '@/views/export/resumeImageExportPage';
import ResumePrintView from '@/views/export/resumePrintView';

type SnapOpts = {
  config: unknown;
  filename: string;
  locale: string;
  messages: Record<string, unknown>;
};

let snapRuntimeWarmed = false;
let snapRuntimeWarmPromise: Promise<void> | null = null;

const SNAP_HOST_STYLE =
  'position:fixed;left:-100000px;top:0;z-index:-1;overflow:visible;opacity:1;pointer-events:none;width:max-content;';

function cssLengthToMm(value: string): number {
  const s = String(value).trim().toLowerCase();
  const m = s.match(/^([\d.]+)\s*(mm|cm|in|pt|px)?$/);
  if (!m) return 210;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n)) return 210;
  switch (m[2] || 'mm') {
    case 'cm':
      return n * 10;
    case 'in':
      return n * 25.4;
    case 'pt':
      return (n * 25.4) / 72;
    case 'px':
      return (n * 25.4) / 96;
    case 'mm':
    default:
      return n;
  }
}

async function cropJpegBorder(blob: Blob, borderPx = 1): Promise<Blob> {
  if (borderPx <= 0) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error('导出图片解码失败'));
      node.src = url;
    });
    const sw = Math.floor(img.naturalWidth);
    const sh = Math.floor(img.naturalHeight);
    const dw = sw - borderPx * 2;
    const dh = sh - borderPx * 2;
    if (dw < 8 || dh < 8) return blob;
    return cropImageBlob({
      source: blob,
      sx: borderPx,
      sy: borderPx,
      sw: dw,
      sh: dh,
      dw,
      dh,
      type: 'image/jpeg',
      quality: 0.92,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function assertSnapSize(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    throw new Error(
      `导出区域尺寸异常 (${Math.round(rect.width)}×${Math.round(rect.height)})`,
    );
  }
}

async function snapElementToJpgBlob(
  el: HTMLElement,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
): Promise<Blob> {
  assertSnapSize(el);
  prepareResumeSnapSubtree(el, gs);
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
  const result = await snapdom(el, {
    scale: 2,
    embedFonts: true,
    localFonts,
    backgroundColor: gs.backgroundColor ?? '#ffffff',
    fast: false,
    outerTransforms: false,
  });
  const rawBlob = await result.toBlob({ type: 'jpg', quality: 0.92 });
  return cropJpegBorder(rawBlob, 5);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function prepareSnapContext(config: unknown) {
  const cfg = config as Record<string, unknown>;
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    (cfg?.globalStyle ?? {}) as Partial<GlobalStyle>,
  );
  const origin = window.location.origin;
  const fontId = resumeFontForExport(gs.resumeFont);
  const localFonts = resumeSnapLocalFonts(origin, fontId);
  await preloadResumeFontsForSnap(origin, gs.resumeFont ?? 'system');
  return { gs, localFonts, origin };
}

export async function downloadResumeJpegViaSnapdom(opts: SnapOpts): Promise<void> {
  const { gs, localFonts, origin } = await prepareSnapContext(opts.config);
  const host = document.createElement('div');
  host.setAttribute('data-resume-image-export-host', '');
  host.style.cssText = SNAP_HOST_STYLE;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <NextIntlClientProvider locale={opts.locale} messages={opts.messages}>
          <div style={{ width: 'fit-content' }}>
            <ResumeImageExportPage config={opts.config} assetOrigin={origin} />
          </div>
        </NextIntlClientProvider>,
      );
    });
    const pageEl = host.querySelector('[data-resume-export-page]');
    if (!pageEl || !(pageEl instanceof HTMLElement)) {
      throw new Error('导出 Page 未渲染');
    }
    const jpg = await snapElementToJpgBlob(pageEl, gs, localFonts);
    const base = opts.filename.replace(/\.[^.]+$/, '') || 'export';
    triggerDownload(jpg, `${base}.jpg`);
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function downloadResumeImagePdfViaSnapdom(opts: SnapOpts): Promise<void> {
  const { gs, localFonts, origin } = await prepareSnapContext(opts.config);
  const dims = globalStylePageDimensions(gs);
  const wMm = cssLengthToMm(dims.width);
  const hMm = cssLengthToMm(dims.height);
  const host = document.createElement('div');
  host.setAttribute('data-resume-image-export-host', '');
  host.style.cssText = SNAP_HOST_STYLE;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <NextIntlClientProvider locale={opts.locale} messages={opts.messages}>
          <div style={{ width: 'fit-content' }}>
            <ResumePrintView
              config={opts.config}
              assetOrigin={origin}
              exportMode='pdf'
              snapTarget
            />
          </div>
        </NextIntlClientProvider>,
      );
    });
    const pages = Array.from(
      host.querySelectorAll<HTMLElement>('[data-resume-export-page]'),
    );
    if (!pages.length) throw new Error('导出 Page 未渲染');
    const pdf = new jsPDF({
      orientation: wMm > hMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [wMm, hMm],
      compress: true,
    });
    for (let i = 0; i < pages.length; i += 1) {
      const jpg = await snapElementToJpgBlob(pages[i], gs, localFonts);
      const buf = new Uint8Array(await jpg.arrayBuffer());
      if (i > 0) pdf.addPage([wMm, hMm], wMm > hMm ? 'landscape' : 'portrait');
      pdf.addImage(buf, 'JPEG', 0, 0, wMm, hMm);
    }
    const base = opts.filename.replace(/\.[^.]+$/, '') || 'export';
    triggerDownload(pdf.output('blob'), `${base}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}

/**
 * Idle warm-up：只预热 snap 运行时，不预拉完整 woff2。
 * 完整字体改在真正导出时再拉，避免和编辑器切片抢带宽。
 */
export function warmupResumeImageExportRuntime(_resumeFont: unknown): void {
  if (typeof window === 'undefined' || snapRuntimeWarmed) {
    return;
  }
  if (snapRuntimeWarmPromise) return;

  snapRuntimeWarmPromise = (async () => {
    try {
      void snapdom;
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
      probe.textContent = '.';
      document.body.appendChild(probe);
      void probe.getBoundingClientRect();
      probe.remove();
      snapRuntimeWarmed = true;
    } finally {
      snapRuntimeWarmPromise = null;
    }
  })();
}
