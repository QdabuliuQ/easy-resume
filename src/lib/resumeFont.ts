export type ResumeFontId = 'system' | 'noto-sans-sc' | 'noto-serif-sc';

export const DEFAULT_RESUME_FONT: ResumeFontId = 'system';

const SYSTEM_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif";

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

/** 本地 @font-face；system 不注入；字体在 public/fonts/ */
export function resumeLocalFontFacesCss(
  basePath = '',
  font: ResumeFontId = 'noto-sans-sc'
): string {
  if (font === 'system') return '';
  const b = basePath;
  const sans = [
    `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:400;font-display:swap;src:url('${b}/fonts/NotoSansSC-Regular.ttf') format('truetype');}`,
    `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:700;font-display:swap;src:url('${b}/fonts/NotoSansSC-Bold.ttf') format('truetype');}`,
  ];
  const serif = [
    `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:400;font-display:swap;src:url('${b}/fonts/NotoSerifSC-Regular.ttf') format('truetype');}`,
    `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:700;font-display:swap;src:url('${b}/fonts/NotoSerifSC-Bold.ttf') format('truetype');}`,
  ];
  return font === 'noto-sans-sc' ? sans.join('\n') : serif.join('\n');
}
