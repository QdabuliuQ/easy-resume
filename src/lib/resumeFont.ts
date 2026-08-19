export type ResumeFontId =
  | 'system'
  | 'noto-sans-sc'
  | 'noto-serif-sc'
  | 'qyn-flavor'
  | 'chill-huo-fangsong'
  | 'moon-stars-kai'
  | 'shanggu-round'
  | 'shanggu-serif'
  | 'chill-round-f'
  | 'acy';

const SYSTEM_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Serif SC', sans-serif";

type LocalFontDef = {
  family: string;
  fallback: 'sans-serif' | 'serif';
  regular: string;
  bold: string;
};

const LOCAL_FONTS: Record<Exclude<ResumeFontId, 'system'>, LocalFontDef> = {
  'noto-sans-sc': {
    family: 'Noto Sans SC',
    fallback: 'sans-serif',
    regular: 'NotoSansSC-Regular.woff2',
    bold: 'NotoSansSC-Bold.woff2',
  },
  'noto-serif-sc': {
    family: 'Noto Serif SC',
    fallback: 'serif',
    regular: 'NotoSerifSC-Regular.woff2',
    bold: 'NotoSerifSC-Bold.woff2',
  },
  'qyn-flavor': {
    family: '檎风黑体',
    fallback: 'sans-serif',
    regular: 'QynFlavorAltCHS-Regular.woff2',
    bold: 'QynFlavorAltCHS-Bold.woff2',
  },
  'chill-huo-fangsong': {
    family: '寒蝉活仿宋',
    fallback: 'serif',
    regular: 'ChillHuoFangSong-Regular.woff2',
    bold: 'ChillHuoFangSong-Bold.woff2',
  },
  'moon-stars-kai': {
    family: '月星楷',
    fallback: 'serif',
    regular: 'MoonStarsKai-Regular.woff2',
    bold: 'MoonStarsKai-Bold.woff2',
  },
  'shanggu-round': {
    family: '尚古圆体',
    fallback: 'sans-serif',
    regular: 'ShangguRound-Regular.woff2',
    bold: 'ShangguRound-Bold.woff2',
  },
  'shanggu-serif': {
    family: '尚古明体',
    fallback: 'serif',
    regular: 'ShangguSerif-Regular.woff2',
    bold: 'ShangguSerif-Bold.woff2',
  },
  'chill-round-f': {
    family: '寒蝉全圆体',
    fallback: 'sans-serif',
    regular: 'ChillRoundF-Regular.woff2',
    bold: 'ChillRoundF-Bold.woff2',
  },
  acy: {
    family: 'Acy手写体',
    fallback: 'sans-serif',
    regular: 'Acy-Regular.woff2',
    bold: 'Acy-Bold.woff2',
  },
};

export function normResumeFont(v: unknown): ResumeFontId {
  if (v === 'system') return 'system';
  if (v === 'noto-sans-sc') return 'noto-sans-sc';
  if (v === 'noto-serif-sc') return 'noto-serif-sc';
  if (v === 'qyn-flavor') return 'qyn-flavor';
  if (v === 'chill-huo-fangsong') return 'chill-huo-fangsong';
  if (v === 'moon-stars-kai') return 'moon-stars-kai';
  if (v === 'shanggu-round') return 'shanggu-round';
  if (v === 'shanggu-serif') return 'shanggu-serif';
  if (v === 'chill-round-f') return 'chill-round-f';
  if (v === 'acy') return 'acy';
  if (v === 'noto-serif' || v === 'lxgw-wenkai') return 'noto-serif-sc';
  if (v === 'noto-sans' || v === 'alibaba') return 'noto-sans-sc';
  return 'system';
}

export function resumeFontStack(id: unknown): string {
  const fid = normResumeFont(id);
  if (fid === 'system') return SYSTEM_STACK;
  const def = LOCAL_FONTS[fid];
  return `'${def.family}', ${def.fallback}`;
}

export type ResumeExportFontId = Exclude<ResumeFontId, 'system'>;

/** 组件导出 / Puppeteer：system 在 headless 下无中文字形，回落到 Noto */
export function resumeFontForExport(id: unknown): ResumeExportFontId {
  const fid = normResumeFont(id);
  return fid === 'system' ? 'noto-sans-sc' : fid;
}

/** pdfkit 嵌入：local woff2 文件名 */
export function resumeExportFontFiles(id: unknown): {
  family: string;
  regular: string;
  bold: string;
} {
  const def = LOCAL_FONTS[resumeFontForExport(id)];
  return { family: def.family, regular: def.regular, bold: def.bold };
}

export function resumeExportFontStack(id: unknown): string {
  const fid = normResumeFont(id);
  if (fid === 'system') {
    return `'Noto Sans SC', ${resumeFontStack('noto-sans-sc')}`;
  }
  return resumeFontStack(fid);
}

function fontFaceBlocks(
  basePath: string,
  font: ResumeExportFontId,
  display: 'block' | 'swap' = 'block',
): string {
  const def = LOCAL_FONTS[font];
  const u = (file: string) =>
    `url('${basePath}/fonts/${file}') format('woff2')`;
  return [
    `@font-face{font-family:'${def.family}';font-style:normal;font-weight:400;font-display:${display};src:${u(def.regular)};}`,
    `@font-face{font-family:'${def.family}';font-style:normal;font-weight:700;font-display:${display};src:${u(def.bold)};}`,
  ].join('');
}

/** Puppeteer / PDF 导出：仅本地 public/fonts */
export function resumeExportFontFacesCss(origin: string, font: unknown): string {
  const fid = resumeFontForExport(font);
  const base = origin.replace(/\/$/, '');
  return fontFaceBlocks(base, fid, 'block');
}

/** 编辑器本地 @font-face；swap 避免长时间空白；system 不注入 */
export function resumeLocalFontFacesCss(font: ResumeFontId = 'noto-sans-sc'): string {
  if (font === 'system') return '';
  return fontFaceBlocks('', font, 'swap');
}

export function resumePrimaryFontFamily(font: ResumeFontId): string {
  if (font === 'system') return LOCAL_FONTS['noto-sans-sc'].family;
  return LOCAL_FONTS[font].family;
}

export function resumeSnapLocalFonts(
  origin: string,
  font: ResumeFontId,
): { family: string; src: string; weight: number; style: string }[] {
  if (font === 'system') return [];
  const base = origin.replace(/\/$/, '');
  const def = LOCAL_FONTS[font];
  return [
    { family: def.family, src: `${base}/fonts/${def.regular}`, weight: 400, style: 'normal' },
    { family: def.family, src: `${base}/fonts/${def.bold}`, weight: 700, style: 'normal' },
  ];
}

export async function waitResumeFontsLoaded(
  font: ResumeFontId,
  opts?: { weights?: ReadonlyArray<400 | 700> },
): Promise<void> {
  const fid = resumeFontForExport(font);
  const family = resumePrimaryFontFamily(fid);
  const weights = opts?.weights ?? [400, 700];
  await Promise.all(weights.map((w) => document.fonts.load(`${w} 16px "${family}"`)));
}

const snapFontPreloaded = new Set<string>();
const uiFontReady = new Set<ResumeExportFontId>();

async function loadFontFaceFromUrl(
  family: string,
  src: string,
  weight: 400 | 700,
): Promise<void> {
  const key = `${family}-${weight}`;
  if (snapFontPreloaded.has(key)) return;
  const face = new FontFace(family, `url(${src})`, {
    weight: String(weight),
    style: 'normal',
  });
  await face.load();
  document.fonts.add(face);
  snapFontPreloaded.add(key);
}

/** snapDOM 前拉取完整 public/fonts（导出不用切片，避免缺字） */
export async function preloadResumeFontsForSnap(
  origin: string,
  font: ResumeFontId,
): Promise<void> {
  const fid = resumeFontForExport(font);
  const family = resumePrimaryFontFamily(fid);
  const entries = resumeSnapLocalFonts(origin, fid);
  await Promise.all(
    entries.map(async (f) => {
      const key = `${family}-${f.weight}`;
      if (snapFontPreloaded.has(key)) return;
      const res = await fetch(f.src);
      if (!res.ok) throw new Error(`font fetch failed: ${f.src}`);
      const buf = await res.arrayBuffer();
      const face = new FontFace(family, buf, {
        weight: String(f.weight),
        style: f.style,
      });
      await face.load();
      document.fonts.add(face);
      snapFontPreloaded.add(key);
    }),
  );
  await waitResumeFontsLoaded(font);
}

/**
 * 编辑器切换字体：
 * 1) 优先 unicode-range 切片（只下用到的小包）
 * 2) 无切片时回退完整 Regular，Bold 后台补
 */
export async function ensureResumeFontLoaded(font: ResumeFontId): Promise<void> {
  if (font === 'system') return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (uiFontReady.has(font)) return;

  const { ensureResumeFontSplitStyles, RESUME_FONT_PROBE_TEXT } = await import(
    '@/lib/resumeFontSplit'
  );
  const family = LOCAL_FONTS[font].family;
  const usedSplit = await ensureResumeFontSplitStyles(font, { weights: [400] });
  if (usedSplit) {
    await document.fonts.load(`400 16px "${family}"`, RESUME_FONT_PROBE_TEXT);
    uiFontReady.add(font);
    void ensureResumeFontSplitStyles(font, { weights: [700] })
      .then((ok) =>
        ok
          ? document.fonts.load(`700 16px "${family}"`, RESUME_FONT_PROBE_TEXT)
          : undefined,
      )
      .catch(() => undefined);
    return;
  }

  const origin = window.location.origin;
  const def = LOCAL_FONTS[font];
  await loadFontFaceFromUrl(def.family, `${origin}/fonts/${def.regular}`, 400);
  uiFontReady.add(font);
  void loadFontFaceFromUrl(def.family, `${origin}/fonts/${def.bold}`, 700).catch(
    () => undefined,
  );
}
