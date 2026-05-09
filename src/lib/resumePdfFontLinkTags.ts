import { normResumeFont } from '@/lib/resumeFont';

/** 仅服务端导出：使用 Chromium 打印 PDF 兼容更好的在线 WOFF2 字体 */
export function resumePdfFontLinkTags(font: unknown): string {
  const id = normResumeFont(font);
  const embedId = id === 'system' ? 'noto-sans-sc' : id;
  const href =
    embedId === 'noto-sans-sc'
      ? 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap'
      : 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap';
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="${href}" rel="stylesheet">`,
  ].join('');
}
