'use client';
import { snapdom } from '@zumer/snapdom';
import { jsPDF } from 'jspdf';
import { NextIntlClientProvider } from 'next-intl';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import defaultResume from '@/json/resume.defaults';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import {
  preloadResumeFontsForSnap,
  resumeFontForExport,
  resumeSnapLocalFonts,
} from '@/lib/resumeFont';
import { globalStylePageDimensions, cssLengthToPx } from '@/lib/resumePageSize';
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
  /** 模板预览：只截第一页定高纸张 */
  firstPageOnly?: boolean;
};

let snapRuntimeWarmed = false;
let snapRuntimeWarmPromise: Promise<void> | null = null;

function forcePagePaperSize(el: HTMLElement, gs: GlobalStyle) {
  const { width, height } = globalStylePageDimensions(gs);
  const w = Math.max(320, Math.round(cssLengthToPx(width)));
  const h = Math.max(320, Math.round(cssLengthToPx(height)));
  const continuous = el.hasAttribute('data-resume-export-continuous');
  el.style.setProperty('width', `${w}px`, 'important');
  el.style.setProperty('min-width', `${w}px`, 'important');
  el.style.setProperty('max-width', 'none', 'important');
  el.style.setProperty('transform', 'none', 'important');
  el.style.setProperty('zoom', '1', 'important');
  if (continuous) {
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('min-height', '0', 'important');
    el.style.removeProperty('max-height');
  } else {
    // 定高纸张：保证导出图为纸张比例（默认 A4 210×297）
    el.style.setProperty('height', `${h}px`, 'important');
    el.style.setProperty('min-height', `${h}px`, 'important');
    el.style.setProperty('max-height', `${h}px`, 'important');
  }
  return { w, h };
}

function assertSnapSize(el: HTMLElement, min = 200) {
  const w = Math.max(el.offsetWidth, Math.round(el.getBoundingClientRect().width));
  const h = Math.max(el.offsetHeight, Math.round(el.getBoundingClientRect().height));
  if (w < min || h < min) {
    throw new Error(`导出区域尺寸异常 (${w}×${h})`);
  }
}

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

async function cropRasterBorder(
  blob: Blob,
  borderPx = 1,
  type: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality = 0.92,
): Promise<Blob> {
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
      type,
      quality,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 等图片 / 字体就绪后再 snap（与 pdfkit 导出一致） */
async function waitResumeSnapReady(root: HTMLElement) {
  const doc = root.ownerDocument;
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }
      if (img.naturalWidth > 0) {
        try {
          await img.decode();
        } catch {
          /* ignore */
        }
      }
    }),
  );
  try {
    await doc.fonts.ready;
  } catch {
    /* ignore */
  }
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

async function assertImageMinSize(blob: Blob, minW = 240, minH = 320) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error('预览图解码失败'));
      node.src = url;
    });
    if (img.naturalWidth < minW || img.naturalHeight < minH) {
      throw new Error(
        `预览图尺寸异常 ${img.naturalWidth}×${img.naturalHeight}（简历未正确渲染）`,
      );
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

type SnapRasterOpts = {
  format: 'jpeg' | 'webp';
  quality: number;
  /** 导出目标宽（优先）；未设则用 scale */
  width?: number;
  scale?: number;
};

async function snapElementToRasterBlob(
  el: HTMLElement,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
  opts: SnapRasterOpts,
): Promise<Blob> {
  forcePagePaperSize(el, gs);
  el.offsetWidth; // force layout
  assertSnapSize(el);
  await waitResumeSnapReady(el);
  prepareResumeSnapSubtree(el, gs);
  // prepare 改了 font-family / 行高，再等字体与布局稳定
  try {
    await el.ownerDocument.fonts.ready;
  } catch {
    /* ignore */
  }
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
  assertSnapSize(el);
  const result = await snapdom(el, {
    ...(opts.width ? { width: opts.width } : { scale: opts.scale ?? 2 }),
    embedFonts: true,
    localFonts,
    backgroundColor: gs.backgroundColor ?? '#ffffff',
    fast: false,
    outerTransforms: false,
  });
  // type 用 jpeg/webp；勿用 jpg（会变成 image/jpg）
  const rawBlob = await result.toBlob({ type: opts.format, quality: opts.quality });
  if (!rawBlob || rawBlob.size < 1024) {
    throw new Error('预览图生成失败（空文件）');
  }
  const mime = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
  const out = await cropRasterBorder(rawBlob, 2, mime, opts.quality);
  await assertImageMinSize(out);
  return out;
}

/** 用户导出：高清 JPEG */
function snapElementToJpgBlob(
  el: HTMLElement,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
) {
  return snapElementToRasterBlob(el, gs, localFonts, {
    format: 'jpeg',
    quality: 0.92,
    scale: 2,
  });
}

/** 模板预览：与 exportImage 同 scale，WebP 便于上传 */
function snapElementToPreviewWebpBlob(
  el: HTMLElement,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
) {
  return snapElementToRasterBlob(el, gs, localFonts, {
    format: 'webp',
    quality: 0.88,
    scale: 2,
  });
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
  const cfg = prepareConfigForSnapExport(config) as Record<string, unknown>;
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    (cfg?.globalStyle ?? {}) as Partial<GlobalStyle>,
  );
  const origin = window.location.origin;
  const fontId = resumeFontForExport(gs.resumeFont);
  const localFonts = resumeSnapLocalFonts(origin, fontId);
  return { gs, localFonts, origin, config: cfg };
}

/** 与编辑页 exportImage 一致：合并默认样式、解析头像 ref、保留 exportPages；图片导出强制 A4 */
export function prepareConfigForSnapExport(
  config: unknown,
  exportPages?: unknown[] | null,
): unknown {
  const raw = resolveResumeAvatarRefsDeep(config) as Record<string, unknown>;
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    (raw?.globalStyle ?? {}) as Partial<GlobalStyle>,
  );
  return JSON.parse(
    JSON.stringify({
      ...raw,
      globalStyle: { ...gs, pageSize: 'A4' },
      ...(exportPages != null ? { exportPages } : {}),
    }),
  );
}

/** 屏外 host：复用主文档样式，强制浅色；宽高由内容撑开 */
const SNAP_HOST_STYLE = [
  'position:fixed',
  'left:-100000px',
  'top:0',
  'z-index:-1',
  'overflow:visible',
  'opacity:1',
  'pointer-events:none',
  'width:max-content',
  'background:#fff',
  'color-scheme:light',
].join(';');

async function withResumeSnapMount<T>(
  opts: {
    config: unknown;
    locale: string;
    messages: Record<string, unknown>;
    origin: string;
    gs: GlobalStyle;
    mode?: 'full' | 'firstPage';
    render: 'image' | 'print';
  },
  run: (pageEls: HTMLElement[]) => Promise<T>,
): Promise<T> {
  const { width } = globalStylePageDimensions(opts.gs);
  const paperW = Math.max(320, Math.round(cssLengthToPx(width)));
  const host = document.createElement('div');
  host.setAttribute('data-resume-image-export-host', '');
  host.setAttribute('aria-hidden', 'true');
  host.dataset.theme = 'light';
  host.style.cssText = SNAP_HOST_STYLE;
  document.body.appendChild(host);

  // 只预取字体字节给 snapdom localFonts；不往主文档注入 @font-face / FontFace
  await preloadResumeFontsForSnap(opts.origin, opts.gs.resumeFont ?? 'system');
  const mount = document.createElement('div');
  host.appendChild(mount);
  const root = createRoot(mount);
  try {
    flushSync(() => {
      root.render(
        <NextIntlClientProvider locale={opts.locale} messages={opts.messages}>
          <div style={{ width: paperW, background: '#fff', colorScheme: 'light' }}>
            {opts.render === 'print' ? (
              <ResumePrintView
                config={opts.config}
                assetOrigin={opts.origin}
                exportMode='pdf'
                snapTarget
                injectFonts={false}
              />
            ) : (
              <ResumeImageExportPage
                config={opts.config}
                assetOrigin={opts.origin}
                mode={opts.mode ?? 'full'}
                continuous={(opts.mode ?? 'full') === 'full'}
                injectFonts={false}
              />
            )}
          </div>
        </NextIntlClientProvider>,
      );
    });
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const pageEls = Array.from(host.querySelectorAll<HTMLElement>('[data-resume-export-page]'));
    if (!pageEls.length) throw new Error('导出 Page 未渲染');
    for (const el of pageEls) forcePagePaperSize(el, opts.gs);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    return await run(pageEls);
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function downloadResumeJpegViaSnapdom(opts: SnapOpts): Promise<void> {
  const { gs, localFonts, origin, config } = await prepareSnapContext(opts.config);
  const jpg = await withResumeSnapMount(
    {
      config,
      locale: opts.locale,
      messages: opts.messages,
      origin,
      gs,
      mode: 'full',
      render: 'image',
    },
    async (pages) => snapElementToJpgBlob(pages[0]!, gs, localFonts),
  );
  const base = opts.filename.replace(/\.[^.]+$/, '') || 'export';
  triggerDownload(jpg, `${base}.jpg`);
}

/** 编辑页 exportImage 同路径，返回 Blob（供模板预览等复用） */
export async function renderResumeImageBlobViaSnapdom(
  opts: Omit<SnapOpts, 'filename'>,
): Promise<Blob> {
  const { gs, localFonts, origin, config } = await prepareSnapContext(opts.config);
  return withResumeSnapMount(
    {
      config,
      locale: opts.locale,
      messages: opts.messages,
      origin,
      gs,
      mode: opts.firstPageOnly === false ? 'full' : 'firstPage',
      render: 'image',
    },
    async (pages) => snapElementToJpgBlob(pages[0]!, gs, localFonts),
  );
}

/** 模板预览图：WebP（压缩友好，不影响用户 JPEG 导出） */
export async function renderResumePreviewBlobViaSnapdom(
  opts: Omit<SnapOpts, 'filename'>,
): Promise<Blob> {
  const { gs, localFonts, origin, config } = await prepareSnapContext(opts.config);
  return withResumeSnapMount(
    {
      config,
      locale: opts.locale,
      messages: opts.messages,
      origin,
      gs,
      mode: opts.firstPageOnly === false ? 'full' : 'firstPage',
      render: 'image',
    },
    async (pages) => snapElementToPreviewWebpBlob(pages[0]!, gs, localFonts),
  );
}

export async function downloadResumeImagePdfViaSnapdom(opts: SnapOpts): Promise<void> {
  const { gs, localFonts, origin, config } = await prepareSnapContext(opts.config);
  const dims = globalStylePageDimensions(gs);
  const wMm = cssLengthToMm(dims.width);
  const hMm = cssLengthToMm(dims.height);
  await withResumeSnapMount(
    {
      config,
      locale: opts.locale,
      messages: opts.messages,
      origin,
      gs,
      render: 'print',
    },
    async (pages) => {
      const pdf = new jsPDF({
        orientation: wMm > hMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [wMm, hMm],
        compress: true,
      });
      for (let i = 0; i < pages.length; i += 1) {
        const jpg = await snapElementToJpgBlob(pages[i]!, gs, localFonts);
        const buf = new Uint8Array(await jpg.arrayBuffer());
        if (i > 0) pdf.addPage([wMm, hMm], wMm > hMm ? 'landscape' : 'portrait');
        pdf.addImage(buf, 'JPEG', 0, 0, wMm, hMm);
      }
      const base = opts.filename.replace(/\.[^.]+$/, '') || 'export';
      triggerDownload(pdf.output('blob'), `${base}.pdf`);
    },
  );
}

/**
 * Idle warm-up：只预热 snap 运行时，不预拉完整 woff2。
 * 完整字体改在真正导出时再拉，避免和编辑器切片抢带宽。
 */
export function warmupResumeImageExportRuntime(_resumeFont: unknown): void {
  void _resumeFont;
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
