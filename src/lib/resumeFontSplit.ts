import type { ResumeExportFontId, ResumeFontId } from '@/lib/resumeFont';

/** 触发 unicode-range 切片下载的探测文本（常用简历字符，体积小） */
export const RESUME_FONT_PROBE_TEXT =
  '简历姓名电话邮箱工作经历教育背景项目技能自我评价ABCDEFGabcdefg0123456789';

export function resumeFontSplitCssHref(
  font: ResumeExportFontId,
  weight: 400 | 700,
): string {
  return `/fonts/split/${font}/${weight}/result.css`;
}

export function resumeFontSplitCssHrefs(font: ResumeExportFontId): {
  weight: 400 | 700;
  href: string;
}[] {
  return [
    { weight: 400, href: resumeFontSplitCssHref(font, 400) },
    { weight: 700, href: resumeFontSplitCssHref(font, 700) },
  ];
}

const splitCssOkCache = new Map<string, boolean>();
const injectedSplitCss = new Set<string>();

export async function resumeFontSplitCssAvailable(href: string): Promise<boolean> {
  const hit = splitCssOkCache.get(href);
  if (hit != null) return hit;
  try {
    const res = await fetch(href, { method: 'GET', cache: 'force-cache' });
    const ok = res.ok;
    splitCssOkCache.set(href, ok);
    return ok;
  } catch {
    splitCssOkCache.set(href, false);
    return false;
  }
}

export function injectResumeFontSplitStylesheet(href: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (injectedSplitCss.has(href)) return Promise.resolve();
  const existing = document.querySelector<HTMLLinkElement>(
    `link[data-resume-font-split="${href}"]`,
  );
  if (existing) {
    injectedSplitCss.add(href);
    return existing.dataset.loaded === '1'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener(
            'error',
            () => reject(new Error(`font css failed: ${href}`)),
            { once: true },
          );
        });
  }
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.resumeFontSplit = href;
    link.onload = () => {
      link.dataset.loaded = '1';
      injectedSplitCss.add(href);
      resolve();
    };
    link.onerror = () => reject(new Error(`font css failed: ${href}`));
    document.head.appendChild(link);
  });
}

/** 编辑器优先挂 unicode-range 切片 CSS；不存在则返回 false */
export async function ensureResumeFontSplitStyles(
  font: Exclude<ResumeFontId, 'system'>,
  opts?: { weights?: ReadonlyArray<400 | 700> },
): Promise<boolean> {
  const weights = opts?.weights ?? [400, 700];
  const hrefs = weights.map((w) => resumeFontSplitCssHref(font, w));
  const firstOk = await resumeFontSplitCssAvailable(hrefs[0]);
  if (!firstOk) return false;
  await Promise.all(hrefs.map((href) => injectResumeFontSplitStylesheet(href)));
  return true;
}
