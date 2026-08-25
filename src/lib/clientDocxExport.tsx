'use client';
import { snapdom } from '@zumer/snapdom';
import { NextIntlClientProvider } from 'next-intl';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import defaultResume from '@/json/resume.defaults';
import { buildDocxFromPages } from '@/lib/docxExport/buildFromPages';
import { collectPdfkitPages, PDFKIT_SNAP_SCALE } from '@/lib/pdfkitExport/collect';
import { glyphText, pdfkitNeedBold } from '@/lib/pdfkitExport/draw';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import {
  normResumeFont,
  preloadResumeFontsForSnap,
  resumeExportFontFiles,
  resumeFontForExport,
  resumeSnapLocalFonts,
} from '@/lib/resumeFont';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ResumePrintView from '@/views/export/resumePrintView';

type Opts = {
  config: unknown;
  filename: string;
  locale: string;
  messages: Record<string, unknown>;
};

const HOST_STYLE =
  'position:fixed;left:-100000px;top:0;z-index:-1;overflow:visible;opacity:1;pointer-events:none;width:max-content;';

let docxWarmPromise: Promise<void> | null = null;

/** 编辑页空闲预热：本模块 chunk / wasm / 字体 / hb（与 pdfkit 共用资源） */
export function warmupDocxExportRuntime(resumeFont?: string): void {
  if (typeof window === 'undefined') return;
  if (docxWarmPromise) return;
  const font = normResumeFont(resumeFont);
  const fontId = resumeFontForExport(font);
  const files = resumeExportFontFiles(fontId);
  const origin = window.location.origin;
  docxWarmPromise = (async () => {
    void fetch('/wasm/hb-subset.wasm');
    void fetch(`/fonts/${files.regular}`);
    void fetch(`/fonts/${files.bold}`);
    void preloadResumeFontsForSnap(origin, font);
    const { preloadHbSubset } = await import('@/lib/pdfkitExport/subsetBrowser');
    await preloadHbSubset();
  })().catch(() => {
    docxWarmPromise = null;
  });
}

async function waitPaint(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return undefined;
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    }),
  );
  await document.fonts.ready;
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}

function makeElementSnapper(
  localFonts: ReturnType<typeof resumeSnapLocalFonts>,
): (el: HTMLElement, opts?: { embedFonts?: boolean }) => Promise<string | null> {
  return async (el, opts) => {
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width < 0.5 || rect.height < 0.5) return null;
      const embedFonts = Boolean(opts?.embedFonts);
      const result = await snapdom(el, {
        scale: PDFKIT_SNAP_SCALE,
        embedFonts,
        ...(embedFonts ? { localFonts } : {}),
        backgroundColor: 'transparent',
        fast: true,
        outerTransforms: false,
      });
      const blob = await result.toBlob({ type: 'png' });
      return blobToDataUrl(blob);
    } catch {
      return null;
    }
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchFontFile(file: string): Promise<Uint8Array> {
  const res = await fetch(`/fonts/${file}`);
  if (!res.ok) throw new Error(`缺少字体文件 public/fonts/${file}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function subsetDocxFonts(
  fontId: ReturnType<typeof resumeFontForExport>,
  pages: Awaited<ReturnType<typeof collectPdfkitPages>>,
): Promise<{ family: string; regular: Uint8Array; bold?: Uint8Array }> {
  const files = resumeExportFontFiles(fontId);
  const { subsetWoff2ToSfnt, woff2ToSfnt } = await import('@/lib/pdfkitExport/subsetBrowser');
  const text = glyphText(pages);
  const regularSrc = await fetchFontFile(files.regular);
  let regular: Uint8Array;
  try {
    regular = await subsetWoff2ToSfnt(regularSrc, text);
  } catch {
    regular = await woff2ToSfnt(regularSrc);
  }
  if (!pdfkitNeedBold(pages)) {
    return { family: files.family, regular };
  }
  const boldSrc = await fetchFontFile(files.bold);
  let bold: Uint8Array;
  try {
    bold = await subsetWoff2ToSfnt(boldSrc, text);
  } catch {
    bold = await woff2ToSfnt(boldSrc);
  }
  return { family: files.family, regular, bold };
}

/** 对齐 pdfkit：离屏渲染 → 装饰截图（藏字）+ 文字 run 叠在图上 → 写 docx */
export async function downloadResumeDocx(opts: Opts): Promise<void> {
  const cfg = opts.config as Record<string, unknown>;
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    (cfg?.globalStyle ?? {}) as Partial<GlobalStyle>,
  );
  const origin = window.location.origin;
  const fontId = resumeFontForExport(gs.resumeFont);
  const localFonts = resumeSnapLocalFonts(origin, fontId);
  warmupDocxExportRuntime(gs.resumeFont);
  await preloadResumeFontsForSnap(origin, normResumeFont(gs.resumeFont));

  const host = document.createElement('div');
  host.setAttribute('data-resume-docx-export-host', '');
  host.style.cssText = HOST_STYLE;
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
    await waitPaint(host);
    // header 只截装饰，标题继续采集为可编辑文字 Frame。
    const pages = await collectPdfkitPages(host, makeElementSnapper(localFonts));
    if (!pages.length) throw new Error('导出 Page 未渲染');
    const hasContent = pages.some(
      (p) =>
        p.runs.length ||
        p.images.length ||
        (p.fills?.length ?? 0) > 0,
    );
    if (!hasContent) throw new Error('未采集到页面内容');
    const files = resumeExportFontFiles(fontId);
    let embedFonts: Awaited<ReturnType<typeof subsetDocxFonts>> | undefined;
    try {
      embedFonts = await subsetDocxFonts(fontId, pages);
    } catch {
      // ponytail: 子集失败仍导出（仅字体名，本机有该字体时才正确）
    }
    const blob = await buildDocxFromPages(pages, {
      fontFamily: files.family,
      embedFonts,
    });
    const base = opts.filename.replace(/\.[^.]+$/, '') || 'export';
    triggerDownload(blob, `${base}.docx`);
  } finally {
    root.unmount();
    host.remove();
  }
}
