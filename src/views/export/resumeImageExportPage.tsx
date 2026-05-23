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
};

/** 图片导出：单 Page、continuous、高度随内容；由 clientSnap 挂载后截图 */
export default function ResumeImageExportPage({
  config,
  assetOrigin = '',
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
    () => ({ ...gs, resumeFont: resumeFontForExport(gs.resumeFont) }),
    [gs],
  );
  const origin =
    assetOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const modules = flattenModules(cfg);
  const { main, sideSlot } = renderResumePageModules(modules, printGs, {
    isFirstPage: true,
  });
  return (
    <>
      <ExportPrintFonts font={gs.resumeFont} assetOrigin={origin} />
      <Page
        {...printGs}
        continuous
        firstPage
        snapTarget
        sideSlot={sideSlot}
      >
        {main}
      </Page>
    </>
  );
}
