export type ResumeFontId =
  | 'noto-sans'
  | 'noto-serif'
  | 'alibaba'
  | 'lxgw-wenkai';

export const DEFAULT_RESUME_FONT: ResumeFontId = 'noto-sans';

const JSD = 'https://cdn.jsdelivr.net/npm';

export function normResumeFont(v: unknown): ResumeFontId {
  if (v === 'noto-serif' || v === 'alibaba' || v === 'lxgw-wenkai') {
    return v;
  }
  return 'noto-sans';
}

const PRIMARY: Record<ResumeFontId, string> = {
  'noto-sans': "'Noto Sans SC'",
  'noto-serif': "'Noto Serif SC'",
  alibaba: "'Alibaba PuHuiTi 3.0'",
  'lxgw-wenkai': "'LXGW WenKai'",
};

/** 服务端 Puppeteer 常无外网或 CDN 失败；须依赖系统已安装的中文字体（如 fonts-noto-cjk、wqy-microhei） */
const CJK_FALLBACK_SANS =
  "'Noto Sans CJK SC', 'Noto Sans CJK JP', 'Source Han Sans SC', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', sans-serif";
const CJK_FALLBACK_SERIF =
  "'Noto Serif CJK SC', 'Source Han Serif SC', 'Noto Serif SC', serif";

export function resumeFontStack(id: unknown): string {
  const fid = normResumeFont(id);
  const p = PRIMARY[fid];
  const fb =
    fid === 'noto-serif' || fid === 'lxgw-wenkai'
      ? CJK_FALLBACK_SERIF
      : CJK_FALLBACK_SANS;
  return `${p}, ${fb}`;
}

/** 外链 CSS（不含普惠体：npm 上无可用聚合 CSS，见 resumeAlibabaPuHuiTiFontFacesCss） */
export const RESUME_FONT_LINK_STYLESHEET_HREF: Partial<
  Record<ResumeFontId, string>
> = {
  'noto-sans':
    'https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap',
  'noto-serif':
    'https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@400;700&display=swap',
  'lxgw-wenkai':
    'https://cdn.jsdelivr.net/gh/hoochanlon/fonts@main/assets/LXGWWenKai-Regular/result.css',
};

/** 普惠体 3.0：jsDelivr woff2 + @font-face（PDF/预览共用） */
export function resumeAlibabaPuHuiTiFontFacesCss(): string {
  return `@font-face{font-family:'Alibaba PuHuiTi 3.0';font-style:normal;font-weight:400;font-display:swap;src:url('${JSD}/alibabapuhuiti-3-55-regular@1.0.0/AlibabaPuHuiTi-3-55-Regular.woff2') format('woff2');}
@font-face{font-family:'Alibaba PuHuiTi 3.0';font-style:normal;font-weight:500;font-display:swap;src:url('${JSD}/alibabapuhuiti-3-65-medium@1.0.0/AlibabaPuHuiTi-3-65-Medium.woff2') format('woff2');}
@font-face{font-family:'Alibaba PuHuiTi 3.0';font-style:normal;font-weight:700;font-display:swap;src:url('${JSD}/alibabapuhuiti-3-85-bold@1.0.0/AlibabaPuHuiTi-3-85-Bold.woff2') format('woff2');}`;
}

export function resumeFontPreconnectLoli(id: ResumeFontId): boolean {
  return id === 'noto-sans' || id === 'noto-serif';
}

export function resumeFontPreconnectJsdelivr(id: ResumeFontId): boolean {
  return id === 'alibaba' || id === 'lxgw-wenkai';
}

export function resumePdfFontLinkTags(font: unknown): string {
  const id = normResumeFont(font);
  const preLoli = resumeFontPreconnectLoli(id)
    ? '<link rel="preconnect" href="https://fonts.loli.net" crossorigin />'
    : '';
  const preJsd = resumeFontPreconnectJsdelivr(id)
    ? '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />'
    : '';
  if (id === 'alibaba') {
    return `${preJsd}<style>${resumeAlibabaPuHuiTiFontFacesCss()}</style>`;
  }
  const href = RESUME_FONT_LINK_STYLESHEET_HREF[id];
  if (!href) return '';
  return `${preLoli}${preJsd}<link rel="stylesheet" href="${href}" crossorigin="anonymous" />`;
}
