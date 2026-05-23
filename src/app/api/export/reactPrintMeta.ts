import defaultResume from '@/json/resume.defaults';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { createExportSession } from '@/lib/exportSessionStore';
import {
  buildExportResumeUrl,
  resolveExportPrintOrigin,
  type ExportResumeMode,
} from '@/lib/exportPrintOrigin';
import { mergeResumeConfig } from '../pdf/mergeResumeConfig';
import { globalStylePageDimensions } from '@/lib/resumePageSize';

export type ReactPrintMeta = {
  paperWidth: string;
  paperHeight: string;
  pageCount: number;
  exportUrl: string;
};

export function prepareReactExport(
  config: unknown,
  requestOrigin: string,
  locale?: string,
  mode: ExportResumeMode = 'pdf',
): { merged: ReturnType<typeof mergeResumeConfig>; meta: ReactPrintMeta } {
  const merged = mergeResumeConfig(config);
  const loc = locale === 'en' ? 'en' : 'zh';
  const token = createExportSession(merged, loc);
  const origin = resolveExportPrintOrigin(requestOrigin);
  const exportUrl = buildExportResumeUrl(origin, loc, token, mode);
  const gs = (merged as { globalStyle?: GlobalStyle }).globalStyle;
  const exportPages = (merged as { exportPages?: unknown[] }).exportPages;
  const n =
    Array.isArray(exportPages) && exportPages.length > 0
      ? exportPages.length
      : Array.isArray((merged as { pages?: unknown[] }).pages) &&
          (merged as { pages: unknown[] }).pages.length > 0
        ? (merged as { pages: unknown[] }).pages.length
        : 1;
  const dim = globalStylePageDimensions(gs ?? defaultResume.globalStyle);
  return {
    merged,
    meta: {
      paperWidth: dim.width,
      paperHeight: dim.height,
      pageCount: n,
      exportUrl,
    },
  };
}
