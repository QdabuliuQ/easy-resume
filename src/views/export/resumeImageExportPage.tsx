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
  /** full：整份打平；firstPage：仅首页模块。均为定高 A4 纸面，非 continuous 长图 */
  mode?: 'full' | 'firstPage';
};

/** 图片导出：由 clientSnap 挂载后截图（固定纸张比例，默认 A4） */
export default function ResumeImageExportPage({
  config,
  assetOrigin = '',
  mode = 'full',
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
        sideSlot={sideSlot}
      >
        {main}
      </Page>
    </div>
  );
}
