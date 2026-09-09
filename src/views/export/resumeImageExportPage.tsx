'use client';
import { useMemo } from 'react';
import resumeDefaults from '@/json/resume.defaults';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { resumeFontForExport } from '@/lib/resumeFont';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { flattenModules } from '@/utils/resumePages';
import ExportPrintFonts from '@/views/export/exportPrintFonts';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';

export type ResumeImageExportPageProps = {
  config: unknown;
  assetOrigin?: string;
  /** full：整份打平；firstPage：仅首页模块 */
  mode?: 'full' | 'firstPage';
  /**
   * 高度随内容撑开（导出 JPEG 长图 / 分享预览）。
   * 默认 false，避免影响 PDF 分页、模板缩略图等定高纸面路径。
   */
  continuous?: boolean;
};

/** 图片导出 / 分享预览：由 clientSnap 或分享页挂载 */
export default function ResumeImageExportPage({
  config,
  assetOrigin = '',
  mode = 'full',
  continuous = false,
}: ResumeImageExportPageProps) {
  const cfg = config as Record<string, unknown>;
  const gs = useMemo(
    () =>
      mergeGlobalStylePaper(
        resumeDefaults.globalStyle as GlobalStyle,
        (cfg?.globalStyle ?? {}) as Partial<GlobalStyle>,
      ),
    [cfg],
  );
  const printGs = useMemo(
    () => ({ ...gs, resumeFont: resumeFontForExport(gs.resumeFont), pageSize: 'A4' as const }),
    [gs],
  );
  const origin =
    assetOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const firstPageOnly = mode === 'firstPage';
  const modules = firstPageOnly
    ? ((cfg?.pages as { modules?: unknown[] }[] | undefined)?.[0]?.modules ?? [])
    : flattenModules(cfg);
  const { main, sideSlot } = renderResumePageModules(modules, printGs, {
    isFirstPage: true,
  });
  return (
    <div style={{ colorScheme: 'light', width: 'fit-content' }}>
      <ExportPrintFonts font={gs.resumeFont} assetOrigin={origin} />
      <Page
        {...printGs}
        firstPage
        exportPage
        continuous={continuous}
        sideSlot={sideSlot}
      >
        {main}
      </Page>
    </div>
  );
}
