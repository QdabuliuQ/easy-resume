import type { GlobalStyle } from '@/modules/utils/common.type';
import {
  normResumePageSize,
  resumePageSizeFromLegacyDims,
} from '@/lib/resumePageSize';

/** 合并 globalStyle：丢弃非法 width/height，pageSize 仅白名单 + 兼容旧数据 */
export function mergeGlobalStylePaper(
  base: GlobalStyle,
  patch: unknown
): GlobalStyle {
  const p =
    patch && typeof patch === 'object'
      ? { ...(patch as Record<string, unknown>) }
      : {};
  const { width: lw, height: lh, ...restPatch } = p;
  const merged = { ...base, ...restPatch } as GlobalStyle;
  merged.pageSize = normResumePageSize(
    p.pageSize ??
      resumePageSizeFromLegacyDims(lw, lh) ??
      base.pageSize
  );
  return merged;
}
