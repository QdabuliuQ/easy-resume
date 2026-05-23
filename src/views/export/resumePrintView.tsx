'use client';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import resumeDefaults from '@/json/resume.defaults';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import {
  findFirstInfo1Module,
  shouldPlaceInfo1InSideCol,
} from '@/lib/resumeSideColLayout';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Info1, Margin, Page } from '@/modules';
import { flattenModules } from '@/utils/resumePages';
import { resumeFontForExport } from '@/lib/resumeFont';
import CanvasModuleFragment from '@/views/edit/components/canvas/moduleFragment';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ExportPrintFonts from '@/views/export/exportPrintFonts';
import ResumeImageExportPage from '@/views/export/resumeImageExportPage';

export type ExportLayoutModule = {
  type: string;
  options: Record<string, unknown>;
  showHeader?: boolean;
  viewHeight?: number;
  offsetY?: number;
  continuation?: boolean;
  measuredModuleHeight?: number;
};

type ExportPage = { modules?: ExportLayoutModule[]; moduleMargin?: number };

function mergeGs(cfg: { globalStyle?: Partial<GlobalStyle> }): GlobalStyle {
  return mergeGlobalStylePaper(
    resumeDefaults.globalStyle as GlobalStyle,
    cfg?.globalStyle ?? {},
  );
}

function moduleGapPx(gs: GlobalStyle, cfg: { pages?: { moduleMargin?: number }[] }): number {
  const v = Number(gs.moduleMargin);
  if (Number.isFinite(v) && v >= 0) return v;
  const legacy = Number(cfg.pages?.[0]?.moduleMargin);
  if (Number.isFinite(legacy) && legacy >= 0) return legacy;
  return Number(resumeDefaults.globalStyle.moduleMargin) || 15;
}

function buildFragmentNode(
  mod: ExportLayoutModule,
  gs: GlobalStyle,
  slotKey: string,
  sectionOrdinal?: number,
): ReactElement | null {
  if (mod.type === 'info1') {
    return (
      <Info1
        key={slotKey}
        config={{ type: 'info1', options: mod.options } as never}
        globalStyle={gs}
      />
    );
  }
  return (
    <CanvasModuleFragment
      key={slotKey}
      fragment={{
        type: mod.type,
        sourceId: slotKey,
        domId: slotKey,
        showHeader: mod.showHeader !== false,
        options: mod.options ?? {},
        ...(sectionOrdinal != null && sectionOrdinal > 0 ? { sectionOrdinal } : {}),
      }}
      globalStyle={gs}
    />
  );
}

function renderSlotsFromExportPages(
  exportPages: ExportPage[],
  gs: GlobalStyle,
  cfg: Record<string, unknown>,
  info1Side: { type: string; options?: unknown } | null,
): ReactNode[] {
  const gap = moduleGapPx(gs, cfg as { pages?: { moduleMargin?: number }[] });
  const sideCol = shouldPlaceInfo1InSideCol(gs.layout);
  let shellOrd = 0;
  return exportPages.map((page, pageIndex) => {
    const mods = page.modules ?? [];
    const children: ReactNode[] = [];
    mods.forEach((mod, modIndex) => {
      if (mod.type !== 'info1') shellOrd += 1;
      const slotKey = `p${pageIndex}-m${modIndex}`;
      if (children.length > 0) {
        children.push(
          <Margin key={`gap-${slotKey}`} height={gap} />,
        );
      }
      const node = buildFragmentNode(
        mod,
        gs,
        slotKey,
        mod.type !== 'info1' ? shellOrd : undefined,
      );
      if (!node) return;
      const viewH = mod.viewHeight;
      const offsetY = mod.offsetY ?? 0;
      const mh = mod.measuredModuleHeight;
      const hasOffset = offsetY > 0;
      const inner = hasOffset ? (
        <div style={{ transform: `translateY(-${offsetY}px)` }}>{node}</div>
      ) : (
        node
      );
      const clips =
        viewH != null &&
        mh != null &&
        viewH > 0 &&
        offsetY === 0 &&
        mh > viewH;
      children.push(
        <div
          key={slotKey}
          style={{
            height: viewH != null && viewH > 0 ? viewH : undefined,
            overflow: clips ? 'hidden' : 'visible',
            flexShrink: 0,
          }}
        >
          {inner}
        </div>,
      );
    });
    let sideSlot: ReactNode = null;
    if (sideCol && pageIndex === 0 && info1Side) {
      sideSlot = (
        <Info1
          key='info1-side'
          config={info1Side as never}
          globalStyle={gs}
          forceSideCol
        />
      );
    }
    return (
      <div key={`page-${pageIndex}`} className='pdf-page'>
        <Page {...gs} firstPage={pageIndex === 0} sideSlot={sideSlot}>
          {children}
        </Page>
      </div>
    );
  });
}

function renderFromLegacyPages(
  cfg: Record<string, unknown>,
  gs: GlobalStyle,
): ReactNode[] {
  const pages = (cfg.pages as { modules?: unknown[] }[]) ?? [];
  return pages.map((page, pageIndex) => {
    const { main, sideSlot } = renderResumePageModules(
      page.modules ?? [],
      gs,
      { isFirstPage: pageIndex === 0 },
    );
    return (
      <div key={`page-${pageIndex}`} className='pdf-page'>
        <Page {...gs} firstPage={pageIndex === 0} sideSlot={sideSlot}>
          {main}
        </Page>
      </div>
    );
  });
}

export default function ResumePrintView({
  config,
  assetOrigin = '',
  exportMode = 'pdf',
}: {
  config: unknown;
  assetOrigin?: string;
  exportMode?: 'pdf' | 'image';
}) {
  const cfg = config as Record<string, unknown>;
  const gs = useMemo(() => mergeGs(cfg as { globalStyle?: Partial<GlobalStyle> }), [cfg]);
  const printGs = useMemo(
    () => ({ ...gs, resumeFont: resumeFontForExport(gs.resumeFont) }),
    [gs],
  );
  const info1Side = useMemo((): { type: string; options?: unknown } | null => {
    const m = findFirstInfo1Module(cfg);
    if (!m || !shouldPlaceInfo1InSideCol(gs.layout)) return null;
    return { type: 'info1', options: m.options };
  }, [cfg, gs.layout]);
  const pages = useMemo(() => {
    if (exportMode === 'image') {
      return [
        <ResumeImageExportPage
          key='continuous'
          config={cfg}
          assetOrigin={assetOrigin}
        />,
      ];
    }
    const exportPages = cfg.exportPages as ExportPage[] | null | undefined;
    if (Array.isArray(exportPages) && exportPages.length > 0) {
      return renderSlotsFromExportPages(exportPages, printGs, cfg, info1Side);
    }
    const legacy = renderFromLegacyPages(cfg, printGs);
    return legacy.length > 0 ? legacy : renderFromLegacyPages(
      { pages: [{ modules: flattenModules(cfg) }] },
      printGs,
    );
  }, [exportMode, cfg, printGs, assetOrigin, info1Side]);
  const bg = gs.backgroundColor ?? '#fff';
  const pageBreakCss =
    exportMode === 'image'
      ? ''
      : `
.pdf-page { page-break-after: always; break-after: page; }
.pdf-page:last-child { page-break-after: auto; break-after: auto; }
.export-print-root .pdf-page { box-shadow: none; border: none; border-radius: 0; }
`;
  return (
    <div
      id='export-png-root'
      className='png-page export-print-root'
      style={{ background: bg, margin: 0, padding: 0 }}
    >
      <ExportPrintFonts font={gs.resumeFont} assetOrigin={assetOrigin} />
      {pageBreakCss ? (
        <style dangerouslySetInnerHTML={{ __html: pageBreakCss }} />
      ) : null}
      {pages}
    </div>
  );
}
