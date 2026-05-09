import juice from 'juice';
import * as cheerio from 'cheerio';
import { readQuillSnowCss } from '@/lib/quillSnowCss';

export type InlineQuillHtmlOptions = {
  /** 正文字号 px，对应简历 globalStyle.fontSize */
  fontSizePx?: number;
  /** 行高：≤6 视为倍数，>6 视为 px */
  lineHeight?: number | string;
  /** 默认正文色 */
  color?: string;
};

function lineHeightToCss(lh: number | string | undefined): string {
  if (lh === undefined) return '1.42';
  if (typeof lh === 'string') return lh.trim() || '1.42';
  if (!Number.isFinite(lh)) return '1.42';
  return lh > 6 ? `${lh}px` : String(lh);
}

function stripQuillDomNoise(html: string): string {
  const $ = cheerio.load(`<div id="__strip_root">${html}</div>`);
  $('#__strip_root *').each((_, el) => {
    const n = $(el);
    n.removeAttr('class');
    n.removeAttr('contenteditable');
  });
  return $('#__strip_root').html() ?? '';
}

/** juice 去类名后，个别环境会把列表排得像一整段；强制块级与宽度，贴近浏览器默认列表布局 */
function enforceBlockFlow(html: string): string {
  const $ = cheerio.load(`<div id="__flow">${html}</div>`);
  const bump = (sel: string) => {
    $(sel).each((_, el) => {
      const n = $(el);
      const st = (n.attr('style') ?? '').trim();
      const add: string[] = [];
      if (!/\bdisplay\s*:/i.test(st)) add.push('display: block');
      if (!/\bwidth\s*:/i.test(st)) add.push('width: 100%');
      if (!/\bbox-sizing\s*:/i.test(st)) add.push('box-sizing: border-box');
      if (!add.length) return;
      n.attr('style', [add.join('; '), st].filter(Boolean).join('; '));
    });
  };
  bump('ol');
  bump('ul');
  bump('li');
  return $('#__flow').html() ?? '';
}

/**
 * 将 Quill `.ql-editor` 内层 HTML（含 ql-* class）转为全部依赖 style 内联、无 ql class 的片段。
 * 仅应在 Node（PDF/PNG 等）中调用；依赖 juice + quill.snow.css。
 */
export function inlineQuillHtml(
  quillInnerHtml: string,
  opts?: InlineQuillHtmlOptions,
): string {
  const raw = String(quillInnerHtml ?? '').trim();
  if (!raw) return '';
  const fontSizePx =
    opts?.fontSizePx != null &&
    Number.isFinite(opts.fontSizePx) &&
    opts.fontSizePx > 0
      ? opts.fontSizePx
      : 14;
  const lhCss = lineHeightToCss(opts?.lineHeight);
  const color = opts?.color ?? '#333';
  const extraCss = `
.ql-editor {
  font-size: ${fontSizePx}px !important;
  line-height: ${lhCss} !important;
  color: ${color} !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.ql-editor p,
.ql-editor ol,
.ql-editor ul,
.ql-editor pre,
.ql-editor blockquote,
.ql-editor h1,
.ql-editor h2,
.ql-editor h3,
.ql-editor h4,
.ql-editor h5,
.ql-editor h6 {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.ql-editor li {
  margin-block: calc(0.25rem * 0.5) !important;
}
.ql-editor ol,
.ql-editor ul {
  padding-left: 0 !important;
  margin: 0 !important;
}
`;
  const css = `${readQuillSnowCss()}\n${extraCss}`;
  const fragment = `<div class="ql-container ql-snow"><div class="ql-editor">${raw}</div></div>`;
  const juicer = juice as typeof juice & {
    inlineContent: (h: string, c: string, o?: Record<string, unknown>) => string;
  };
  const inlined = juicer.inlineContent(fragment, css, {
    removeStyleTags: true,
    preserveMediaQueries: false,
    preserveFontFaces: false,
    inlinePseudoElements: true,
    preserveImportant: true,
    applyHeightAttributes: false,
    applyWidthAttributes: false,
    preserveKeyFrames: false,
  });
  const $ = cheerio.load(inlined);
  const inner = $('.ql-editor').first().html();
  if (inner == null || inner === '') return '';
  return enforceBlockFlow(stripQuillDomNoise(inner));
}
