'use client';
import { snapdom } from '@zumer/snapdom';
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
import { prepareResumeSnapSubtree } from '@/lib/resumeSnapPrepare';
import { cropImageBlob } from '@/lib/imageCropWorkerClient';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ResumeImageExportPage from '@/views/export/resumeImageExportPage';
import { resumePrimaryFontFamily } from '@/lib/resumeFont';

type SnapOpts = {
  config: unknown;
  filename: string;
  locale: string;
  messages: Record<string, unknown>;
};

let snapRuntimeWarmed = false;

const SNAP_HOST_STYLE =
  'position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#fff;opacity:0.01;pointer-events:none;';

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
    const cropped = await cropImageBlob({
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
    return cropped;
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

async function snapElementToJpg(
  el: HTMLElement,
  filename: string,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
) {
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
  const blob = await cropJpegBorder(rawBlob, 5);
  const base = filename.replace(/\.[^.]+$/, '') || 'export';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${base}.jpg`;
  a.click();
  URL.revokeObjectURL(url);
}

async function mountExportPageAndSnap(
  opts: SnapOpts,
  gs: GlobalStyle,
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
) {
  const host = document.createElement('div');
  host.setAttribute('data-resume-image-export-host', '');
  host.style.cssText = SNAP_HOST_STYLE;
  document.body.appendChild(host);
  const root = createRoot(host);
  const origin = window.location.origin;
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
    await snapElementToJpg(pageEl, opts.filename, gs, localFonts);
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function downloadResumeJpegViaSnapdom(opts: SnapOpts): Promise<void> {
  const cfg = opts.config as Record<string, unknown>;
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    (cfg?.globalStyle ?? {}) as Partial<GlobalStyle>,
  );
  const origin = window.location.origin;
  const fontId = resumeFontForExport(gs.resumeFont);
  const localFonts = resumeSnapLocalFonts(origin, fontId);
  await preloadResumeFontsForSnap(origin, gs.resumeFont ?? 'system');
  await mountExportPageAndSnap(opts, gs, localFonts);
}

/**
 * Idle warm-up for export runtime. It avoids any network fetch and only primes
 * browser/runtime paths so the first real export has less startup overhead.
 */
export function warmupResumeImageExportRuntime(resumeFont: unknown): void {
  if (snapRuntimeWarmed || typeof window === 'undefined') {
    return;
  }

  // Touch snapdom symbol so bundlers/runtime keep this path hot in memory.
  void snapdom;

  const fid = resumeFontForExport(resumeFont);
  const family = resumePrimaryFontFamily(fid);
  if (typeof document !== 'undefined' && 'fonts' in document) {
    void document.fonts.check(`400 16px "${family}"`);
    void document.fonts.check(`700 16px "${family}"`);
  }

  // Trigger minimal layout work once during idle time.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
  probe.textContent = '.';
  document.body.appendChild(probe);
  void probe.getBoundingClientRect();
  probe.remove();

  snapRuntimeWarmed = true;
}
