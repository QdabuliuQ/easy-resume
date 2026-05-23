export type ResumeFontId = 'system' | 'noto-sans-sc' | 'noto-serif-sc';

const SYSTEM_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Serif SC', sans-serif";

export function normResumeFont(v: unknown): ResumeFontId {
  if (v === 'system') return 'system';
  if (v === 'noto-sans-sc') return 'noto-sans-sc';
  if (v === 'noto-serif-sc') return 'noto-serif-sc';
  if (v === 'noto-serif' || v === 'lxgw-wenkai') return 'noto-serif-sc';
  if (v === 'noto-sans' || v === 'alibaba') return 'noto-sans-sc';
  return 'system';
}

const PRIMARY: Record<Exclude<ResumeFontId, 'system'>, string> = {
  'noto-sans-sc': "'Noto Sans SC'",
  'noto-serif-sc': "'Noto Serif SC'",
};

const FALLBACK_SANS = 'sans-serif';
const FALLBACK_SERIF = 'serif';

export function resumeFontStack(id: unknown): string {
  const fid = normResumeFont(id);
  if (fid === 'system') return SYSTEM_STACK;
  const fb = fid === 'noto-serif-sc' ? FALLBACK_SERIF : FALLBACK_SANS;
  return `${PRIMARY[fid]}, ${fb}`;
}

/** 组件导出 / Puppeteer：system 在 headless 下无中文字形，回落到 Noto */
export function resumeFontForExport(id: unknown): ResumeFontId {
  const fid = normResumeFont(id);
  return fid === 'system' ? 'noto-sans-sc' : fid;
}

export function resumeExportFontStack(id: unknown): string {
  const fid = normResumeFont(id);
  if (fid === 'system') {
    return `'Noto Sans SC', ${resumeFontStack('noto-sans-sc')}`;
  }
  return resumeFontStack(fid);
}

function fontFaceBlocks(basePath: string, font: Exclude<ResumeFontId, 'system'>): string {
  const u = (file: string) =>
    `url('${basePath}/fonts/${file}') format('truetype')`;
  if (font === 'noto-sans-sc') {
    return [
      `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:400;font-display:block;src:${u('NotoSansSC-Regular.ttf')};}`,
      `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:700;font-display:block;src:${u('NotoSansSC-Bold.ttf')};}`,
    ].join('');
  }
  return [
    `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:400;font-display:block;src:${u('NotoSerifSC-Regular.ttf')};}`,
    `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:700;font-display:block;src:${u('NotoSerifSC-Bold.ttf')};}`,
  ].join('');
}

/** 本地 @font-face；system 不注入；字体在 public/fonts/ */
export function resumeLocalFontFacesCss(font: ResumeFontId = 'noto-sans-sc'): string {
  if (font === 'system') return '';
  return fontFaceBlocks('', font);
}

export function resumePrimaryFontFamily(font: ResumeFontId): string {
  return font === 'noto-serif-sc' ? 'Noto Serif SC' : 'Noto Sans SC';
}

export function resumeSnapLocalFonts(
  origin: string,
  font: ResumeFontId,
): { family: string; src: string; weight: number; style: string }[] {
  if (font === 'system') return [];
  const base = origin.replace(/\/$/, '');
  const family = resumePrimaryFontFamily(font);
  const regular =
    font === 'noto-sans-sc' ? 'NotoSansSC-Regular.ttf' : 'NotoSerifSC-Regular.ttf';
  const bold =
    font === 'noto-sans-sc' ? 'NotoSansSC-Bold.ttf' : 'NotoSerifSC-Bold.ttf';
  return [
    { family, src: `${base}/fonts/${regular}`, weight: 400, style: 'normal' },
    { family, src: `${base}/fonts/${bold}`, weight: 700, style: 'normal' },
  ];
}

export async function waitResumeFontsLoaded(font: ResumeFontId): Promise<void> {
  const fid = resumeFontForExport(font);
  const family = resumePrimaryFontFamily(fid);
  await Promise.all([
    document.fonts.load(`400 16px "${family}"`),
    document.fonts.load(`700 16px "${family}"`),
  ]);
  await document.fonts.ready;
}

const snapFontPreloaded = new Set<string>();

/** snapDOM 前用 FontFace 拉取 public/fonts，避免离屏/克隆树缺字形 */
export async function preloadResumeFontsForSnap(
  origin: string,
  font: ResumeFontId,
): Promise<void> {
  const fid = resumeFontForExport(font);
  if (fid === 'system') {
    await waitResumeFontsLoaded(font);
    return;
  }
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
