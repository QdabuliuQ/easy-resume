import { normResumeFont } from '@/lib/resumeFont';

/** 仅服务端导出：使用 Chromium 打印 PDF 兼容更好的在线 WOFF2 字体 */
export function resumePdfFontLinkTags(
  font: unknown,
  opts?: { assetOrigin?: string }
): string {
  const id = normResumeFont(font);
  const embedId = id === 'system' ? 'noto-sans-sc' : id;

  const origin = (opts?.assetOrigin ?? '').replace(/\/$/, '');
  const localBase = origin;

  const localFaceCss =
    embedId === 'noto-sans-sc'
      ? [
          `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:400;font-display:block;src:url('${localBase}/fonts/NotoSansSC-Regular.ttf') format('truetype');}`,
          `@font-face{font-family:'Noto Sans SC';font-style:normal;font-weight:700;font-display:block;src:url('${localBase}/fonts/NotoSansSC-Bold.ttf') format('truetype');}`,
        ].join('')
      : [
          `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:400;font-display:block;src:url('${localBase}/fonts/NotoSerifSC-Regular.ttf') format('truetype');}`,
          `@font-face{font-family:'Noto Serif SC';font-style:normal;font-weight:700;font-display:block;src:url('${localBase}/fonts/NotoSerifSC-Bold.ttf') format('truetype');}`,
        ].join('');

  const href =
    embedId === 'noto-sans-sc'
      ? 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap'
      : 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap';
  return [
    `<style>${localFaceCss}</style>`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="${href}" rel="stylesheet">`,
  ].join('');
}
