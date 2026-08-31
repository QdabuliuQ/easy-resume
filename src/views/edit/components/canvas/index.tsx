'use client';
import {
  Fragment,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactElement,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useMemoizedFn } from 'ahooks';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import resume from '@/json/resume.defaults';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { shouldPlaceInfo1InSideCol } from '@/lib/resumeSideColLayout';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import {
  getBackupReady,
  getServerBackupReady,
  subscribeBackupDirectory,
} from '@/lib/backupDirectoryStore';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setAppThemeWithTransition,
  subscribeAppTheme,
} from '@/lib/themeStore';

import { observer } from 'mobx-react';
import {
  Info1,
  Page,
} from '@/modules';
import { configStore, resumeImportStore } from '@/mobx';
import {
  PAGE_FIT_EPSILON_PX,
  pickSplitFromSortedBodyRects,
  resolveSplitAwayFromCut,
} from '@/lib/pageSplitAvoidCut';
import { resumeModuleSlotStyle } from '@/lib/resumeModuleSlotLayout';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { flattenModules } from '@/utils/resumePages';
import ModuleOperation from '@/components/moduleOperation';
import { InlineFieldEditProvider } from '@/components/inlineFieldPopover/InlineFieldEditProvider';
import CanvasFieldHighlight from '@/components/inlineFieldPopover/CanvasFieldHighlight';
import { usePanelFieldCanvasHighlight } from '@/components/inlineFieldPopover/usePanelFieldCanvasHighlight';
import { RESUME_MODULE_HEADER_ATTR } from '@/components/moduleOperation/constants';
import { CanvasScaleContext } from './canvasScaleContext';
import { PAGE_STACK_GAP_PX } from './pageStackGap';
import { normResumeFont, waitResumeFontsLoaded } from '@/lib/resumeFont';
import { GITHUB_NEW_ISSUE_URL, GITHUB_REPO_URL } from '@/lib/githubRepoStars';
import ResumeFontCdn from './resumeFontCdn';
import CanvasModuleFragment from './moduleFragment';
import SelectableGuideLines from './selectableGuideLines';
import { useSelectableGuideHover } from './useSelectableGuideHover';
import CanvasFloatActions from './canvasFloatActions';
import CanvasPreviewOverlay, {
  useCanvasPreviewOverlayState,
} from './canvasPreviewOverlay';
import ResumeImportOverlay from './resumeImportOverlay';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 70;
const RENDER_DEBOUNCE_MS = 100;
const MEASURE_HEIGHT_EPSILON_PX = 0.1;
const MEASURE_FRAME_DELAY = 2;
const PAGES_FADE_MS = 240;

/** 正文文本行盒（排除 header），相对 module 顶，按 top 升序 */
function getModuleBodyRectsRel(moduleEl: HTMLElement, headerEl: HTMLElement | null) {
  const moduleTop = moduleEl.getBoundingClientRect().top;
  const range = document.createRange();
  const raw: { top: number; bottom: number; height: number }[] = [];
  const walker = document.createTreeWalker(moduleEl, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!headerEl?.contains(node) && (node.nodeValue ?? '').length > 0) {
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.height <= 0 && r.width <= 0) continue;
        raw.push({
          top: r.top - moduleTop,
          bottom: r.bottom - moduleTop,
          height: r.height,
        });
      }
    }
    node = walker.nextNode();
  }
  return raw.sort((a, b) => a.top - b.top);
}

interface ResumeModule {
  type: string;
  id: string;
  options?: Record<string, unknown>;
}

interface ResumeConfig {
  globalStyle: GlobalStyle;
  pages: { modules: ResumeModule[]; moduleMargin?: number }[];
}

type LayoutModule = ResumeModule & { index: number; sectionOrdinal?: number };

type ExportLayoutModule = {
  type: string;
  options: Record<string, unknown>;
  showHeader?: boolean;
  viewHeight?: number;
  offsetY?: number;
  continuation?: boolean;
  measuredModuleHeight?: number;
};

type PageModuleSlot = {
  module: LayoutModule;
  node: ReactElement;
  viewHeight: number;
  offsetY: number;
  measuredModuleHeight: number;
  gapBefore: number;
};

type LayoutPage = {
  slots: PageModuleSlot[];
  exportModules: ExportLayoutModule[];
};

function mergeGlobalStyle(cfg: ResumeConfig): GlobalStyle {
  return mergeGlobalStylePaper(
    resume.globalStyle as GlobalStyle,
    cfg?.globalStyle ?? {}
  );
}

function moduleGapPx(gs: GlobalStyle, cfg?: ResumeConfig): number {
  const v = Number(gs?.moduleMargin);
  if (Number.isFinite(v) && v >= 0) return v;
  const legacy = Number(cfg?.pages?.[0]?.moduleMargin);
  if (Number.isFinite(legacy) && legacy >= 0) return legacy;
  return Number(resume.globalStyle.moduleMargin) || 15;
}

function pageContentHeightPx(gs: GlobalStyle): number {
  return Math.max(
    0,
    cssLengthToApproxPx(globalStylePageDimensions(gs).height) - Number(gs.padding ?? 0) * 2,
  );
}

function readLayoutHeightPx(el: HTMLElement): number {
  const height = el.getBoundingClientRect().height;
  return height > 0 ? height : 1;
}

function buildModuleNode(
  module: LayoutModule,
  gs: GlobalStyle,
  opts?: { forceSideCol?: boolean; selectable?: boolean },
): ReactElement | null {
  if (module.type === 'info1') {
    return (
      <Info1
        key={module.id}
        config={module as never}
        globalStyle={gs}
        forceSideCol={opts?.forceSideCol}
      />
    );
  }
  return (
    <CanvasModuleFragment
      key={module.id}
      fragment={{
        type: module.type,
        sourceId: module.id,
        domId: module.id,
        showHeader: true,
        selectable: opts?.selectable ?? true,
        options: module.options ?? {},
        ...(module.sectionOrdinal ? { sectionOrdinal: module.sectionOrdinal } : {}),
      }}
      globalStyle={gs}
    />
  );
}

type CanvasProps = {
  menuActiveKey?: string;
  onOpenGeneralSettings?: () => void;
  onOpenResumePanel?: () => void;
  onLayoutReady?: () => void;
  mode?: 'edit' | 'preview';
  templateMode?: boolean;
};

function Canvas({
  menuActiveKey = 'resume',
  onOpenGeneralSettings,
  onOpenResumePanel,
  onLayoutReady,
  mode = 'edit',
  templateMode = false,
}: CanvasProps) {
  const isEditMode = mode === 'edit';
  const fieldEditMode = menuActiveKey === 'resume' ? 'panel' : 'inline';
  const tc = useTranslations('Edit.canvas');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const renderDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutReadySentRef = useRef(false);
  const onLayoutReadyRef = useRef(onLayoutReady);
  onLayoutReadyRef.current = onLayoutReady;
  const moduleMeasureEls = useRef<Record<string, HTMLDivElement | null>>({});
  const moduleHeights = useRef<Record<string, number>>({});
  const [pages, setPages] = useState<Array<React.ReactNode>>([]);
  const [pagesReady, setPagesReady] = useState(false);
  const resumeFieldGuideActive = isEditMode && menuActiveKey === 'resume';

  const currentConfig = configStore.getConfig as ResumeConfig | null;
  const layoutConfig = (currentConfig ?? resume) as ResumeConfig;
  const layoutGlobalStyle = useMemo(
    () => mergeGlobalStyle(layoutConfig),
    [layoutConfig],
  );
  const orderedModules = useMemo(
    () => flattenModules(layoutConfig) as LayoutModule[],
    [layoutConfig],
  );
  const sideColLayout = useMemo(
    () => shouldPlaceInfo1InSideCol(layoutGlobalStyle.layout),
    [layoutGlobalStyle.layout],
  );
  const info1Module = useMemo(
    () => sideColLayout
      ? orderedModules.find((module) => module?.type === 'info1')
      : null,
    [orderedModules, sideColLayout],
  );
  const layoutModules = useMemo<LayoutModule[]>(() => {
    let sectionOrdinal = 0;
    return orderedModules
      .map((module, index) => {
        if (!module?.type) return null;
        if (sideColLayout && module.type === 'info1') return null;
        const next: LayoutModule = { ...module, index };
        if (module.type !== 'info1') {
          sectionOrdinal += 1;
          next.sectionOrdinal = sectionOrdinal;
        }
        return next;
      })
      .filter(Boolean) as LayoutModule[];
  }, [orderedModules, sideColLayout]);

  const measureNodes = useMemo(
    () => layoutModules.map((module) => ({
      module,
      node: buildModuleNode(module, layoutGlobalStyle, { selectable: resumeFieldGuideActive }),
    })).filter((item): item is { module: LayoutModule; node: ReactElement } => Boolean(item.node)),
    [layoutModules, layoutGlobalStyle, resumeFieldGuideActive],
  );

  const buildPagination = useMemoizedFn(() => {
    const gs = mergeGlobalStyle(layoutConfig);
    const effectiveHeight = pageContentHeightPx(gs);
    const gapPx = moduleGapPx(gs, layoutConfig);
    const layoutPages: LayoutPage[] = [{ slots: [], exportModules: [] }];
    let usedHeight = 0;

    const startNextPage = () => {
      layoutPages.push({ slots: [], exportModules: [] });
      usedHeight = 0;
    };

    const pushSlot = (
      page: LayoutPage,
      module: LayoutModule,
      node: ReactElement,
      opts: { gapBefore: number; viewHeight: number; offsetY: number; measuredModuleHeight: number },
    ) => {
      page.slots.push({ module, node, ...opts });
      page.exportModules.push({
        type: module.type,
        options: JSON.parse(JSON.stringify(module.options ?? {})),
        showHeader: true,
        viewHeight: opts.viewHeight,
        offsetY: opts.offsetY,
        continuation: opts.offsetY > 0,
        measuredModuleHeight: opts.measuredModuleHeight,
      });
    };

    for (let i = 0; i < measureNodes.length; i += 1) {
      const { module, node } = measureNodes[i];
      const moduleHeight = Math.max(1, moduleHeights.current[module.id] ?? 1);
      let remaining = moduleHeight;
      let offsetY = 0;
      let isFirstFragment = true;

      while (remaining > PAGE_FIT_EPSILON_PX) {
        const page = layoutPages[layoutPages.length - 1];
        const gapBefore = isFirstFragment && page.slots.length > 0 ? gapPx : 0;
        const nextTotal = usedHeight + gapBefore + remaining;
        const isLastModule = i === measureNodes.length - 1;

        if (nextTotal < effectiveHeight - PAGE_FIT_EPSILON_PX) {
          pushSlot(page, module, node, {
            gapBefore,
            viewHeight: remaining,
            offsetY,
            measuredModuleHeight: moduleHeight,
          });
          usedHeight = nextTotal;
          remaining = 0;
          break;
        }

        if (Math.abs(nextTotal - effectiveHeight) <= PAGE_FIT_EPSILON_PX) {
          pushSlot(page, module, node, {
            gapBefore,
            viewHeight: remaining,
            offsetY,
            measuredModuleHeight: moduleHeight,
          });
          usedHeight = effectiveHeight;
          remaining = 0;
          if (!isLastModule) startNextPage();
          break;
        }

        const visibleHeight = effectiveHeight - usedHeight - gapBefore;
        if (visibleHeight <= PAGE_FIT_EPSILON_PX) {
          startNextPage();
          continue;
        }

        let splitViewHeight = visibleHeight;
        let splitNextOffsetY = offsetY + visibleHeight;
        const measureEl = moduleMeasureEls.current[module.id];
        if (measureEl) {
          const moduleBox = measureEl.getBoundingClientRect();
          const headerEl = measureEl.querySelector<HTMLElement>(
            `[${RESUME_MODULE_HEADER_ATTR}]`,
          );
          let headerCut = null as ReturnType<typeof resolveSplitAwayFromCut>;
          if (headerEl) {
            const headerBox = headerEl.getBoundingClientRect();
            const headerTop = headerBox.top - moduleBox.top;
            headerCut = resolveSplitAwayFromCut(
              headerTop,
              headerTop + headerBox.height,
              offsetY,
              visibleHeight,
            );
          }

          if (headerCut === 'empty-page') {
            startNextPage();
            continue;
          }

          if (headerCut) {
            splitViewHeight = headerCut.viewHeight;
            splitNextOffsetY =
              offsetY + visibleHeight - headerCut.pullBackPx;
          } else {
            const bodyHit = pickSplitFromSortedBodyRects(
              getModuleBodyRectsRel(measureEl, headerEl),
              offsetY,
              visibleHeight,
            );
            if (bodyHit === 'empty-page') {
              startNextPage();
              continue;
            }
            if (bodyHit) {
              splitViewHeight = bodyHit.viewHeight;
              splitNextOffsetY =
                offsetY + visibleHeight - bodyHit.pullBackPx;
            }
          }
        }

        pushSlot(page, module, node, {
          gapBefore,
          viewHeight: splitViewHeight,
          offsetY,
          measuredModuleHeight: moduleHeight,
        });
        usedHeight = usedHeight + gapBefore + splitViewHeight;
        offsetY = splitNextOffsetY;
        remaining = moduleHeight - splitNextOffsetY;
        startNextPage();
        isFirstFragment = false;
      }
    }

    const sideSlot = sideColLayout && info1Module
      ? buildModuleNode({ ...info1Module, index: 0 }, gs, {
          forceSideCol: true,
          selectable: resumeFieldGuideActive,
        })
      : null;

    const nextPages = layoutPages.map((page, pageIndex) => {
      const children = page.slots.map((slot) => {
        const inner = slot.offsetY > 0 ? (
          <div style={{ transform: `translateY(-${slot.offsetY}px)` }}>{slot.node}</div>
        ) : (
          slot.node
        );
        return (
          <Fragment key={`${slot.module.id}-${slot.offsetY}-${slot.viewHeight}`}>
            {slot.gapBefore > 0 ? <div style={{ height: slot.gapBefore }} aria-hidden /> : null}
            <div
              data-resume-module-offset-y={slot.offsetY}
              style={resumeModuleSlotStyle({
                viewHeight: slot.viewHeight,
                offsetY: slot.offsetY,
                measuredModuleHeight: slot.measuredModuleHeight,
              })}
            >
              {inner}
            </div>
          </Fragment>
        );
      });
      return (
        <div
          key={pageIndex + 1}
          data-resume-canvas-page
          className='overflow-hidden rounded-[2px] border border-[color:var(--editor-shell-border)] shadow-[0_12px_28px_rgba(0,0,0,0.12)]'
        >
          <Page
            {...gs}
            firstPage={pageIndex === 0}
            sideSlot={pageIndex === 0 ? sideSlot : undefined}
          >
            <div style={{ height: effectiveHeight, overflow: 'hidden' }}>
              {children}
            </div>
          </Page>
        </div>
      );
    });

    setPages(nextPages);
    configStore.setExportPages(layoutPages.map((page) => ({ modules: page.exportModules })));
    if (!layoutReadySentRef.current) {
      layoutReadySentRef.current = true;
      setPagesReady(true);
      onLayoutReadyRef.current?.();
    }
  });

  const hasAllMeasuredHeights = useMemoizedFn(() => {
    if (measureNodes.length === 0) return true;
    return measureNodes.every(({ module }) => moduleHeights.current[module.id] != null);
  });

  const syncMeasuredHeights = useMemoizedFn(() => {
    const liveIds = new Set(layoutModules.map((module) => module.id));
    for (const id of Object.keys(moduleHeights.current)) {
      if (!liveIds.has(id)) delete moduleHeights.current[id];
    }

    for (const { module } of measureNodes) {
      const el = moduleMeasureEls.current[module.id];
      if (!el) continue;
      const height = readLayoutHeightPx(el);
      const prev = moduleHeights.current[module.id];
      if (prev == null || Math.abs(prev - height) >= MEASURE_HEIGHT_EPSILON_PX) {
        moduleHeights.current[module.id] = height;
      }
    }
    // ponytail: 未量齐前不 setPages，避免 height≈1 的半成品首屏
    if (!hasAllMeasuredHeights()) return;
    buildPagination();
  });

  const scheduleMeasuredPagination = useMemoizedFn(() => {
    if (renderDebounceTimerRef.current) clearTimeout(renderDebounceTimerRef.current);
    renderDebounceTimerRef.current = setTimeout(() => {
      renderDebounceTimerRef.current = null;
      const runAfterFrames = (left: number) => {
        if (left <= 0) {
          syncMeasuredHeights();
          return;
        }
        requestAnimationFrame(() => runAfterFrames(left - 1));
      };
      const font = normResumeFont(layoutGlobalStyle.resumeFont);
      void waitResumeFontsLoaded(font, { weights: [400] })
        .catch(() => undefined)
        .then(() => runAfterFrames(MEASURE_FRAME_DELAY));
    }, RENDER_DEBOUNCE_MS);
  });

  useEffect(() => {
    if (!currentConfig) return;
    const hasModules = flattenModules(currentConfig).length > 0;
    if (hasModules) return;
    console.warn('[Canvas] detected empty modules, request config normalize');
    configStore.setConfig(currentConfig, { source: 'reset' });
  }, [currentConfig]);

  useLayoutEffect(() => {
    scheduleMeasuredPagination();
  }, [measureNodes, layoutGlobalStyle.resumeFont, scheduleMeasuredPagination]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const els = Object.values(moduleMeasureEls.current).filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const ro = new ResizeObserver(() => scheduleMeasuredPagination());
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [measureNodes, scheduleMeasuredPagination]);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelFieldHighlight = usePanelFieldCanvasHighlight(
    containerRef,
    isEditMode && fieldEditMode === 'panel',
  );
  const [scale, setScale] = useState(1);
  const { open: previewOpen, closing: previewClosing, openPreview, closePreview } =
    useCanvasPreviewOverlayState();
  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [themePref, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const backupReady = useSyncExternalStore(
    subscribeBackupDirectory,
    getBackupReady,
    getServerBackupReady,
  );

  const globalStyle = configStore.mergedGlobalStyle;
  const { width: pw, height: ph } = globalStylePageDimensions(globalStyle);
  const pageWPx = cssLengthToApproxPx(pw);
  const pageHPx = cssLengthToApproxPx(ph);
  const contentW = pageWPx;
  const pageCount = Math.max(1, pages.length);
  const contentH = pageCount * pageHPx + Math.max(0, pageCount - 1) * PAGE_STACK_GAP_PX;
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const [guideViewport, setGuideViewport] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateGuideViewport = useMemoizedFn(() => {
    const el = containerRef.current;
    if (!el) return;
    setGuideViewport({
      left: el.scrollLeft,
      top: el.scrollTop,
      width: el.clientWidth,
      height: el.clientHeight,
    });
  });

  const updateScale = useMemoizedFn(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    if (cw <= 0 || contentW <= 0 || contentH <= 0) return;

    const innerW = cw - CANVAS_SIDE_PAD * 2;
    if (innerW <= 0) return;

    if (innerW >= contentW) {
      setScale(1);
      return;
    }

    const s = innerW / contentW;
    if (!Number.isFinite(s) || s <= 0) return;
    setScale(s);
  });

  useLayoutEffect(() => {
    updateScale();
  }, [contentW, contentH, updateScale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  useLayoutEffect(() => {
    updateGuideViewport();
  }, [updateGuideViewport, scale, pages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => updateGuideViewport();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateGuideViewport]);

  useEffect(() => {
    return () => {
      if (renderDebounceTimerRef.current) {
        clearTimeout(renderDebounceTimerRef.current);
        renderDebounceTimerRef.current = null;
      }
    };
  }, []);

  const previewOverlay = isEditMode ? (
    <CanvasPreviewOverlay
      open={previewOpen}
      closing={previewClosing}
      title={tc('textPreview')}
      closeAria={tc('closePreview')}
      onClose={closePreview}
    >
      {pages.map((page, idx) => (
        <div key={`text-preview-page-${idx}`} className='shrink-0'>
          {page}
        </div>
      ))}
    </CanvasPreviewOverlay>
  ) : null;
  const { hoverRect, updateSelectableHover, clearSelectableHover } = useSelectableGuideHover({
    containerRef,
    stageRef: canvasStageRef,
  });
  const importLoading = resumeImportStore.loading;
  useEffect(() => {
    if (importLoading || previewOpen || !resumeFieldGuideActive) clearSelectableHover();
  }, [importLoading, previewOpen, resumeFieldGuideActive, clearSelectableHover]);
  // ponytail: 预览时卸交互；pages 只挂 overlay，避免双份 DOM
  const quickSelectActive = resumeFieldGuideActive && !importLoading && !previewOpen;

  const floatActionsEl = isEditMode && !templateMode && !previewOpen ? (
    <CanvasFloatActions
      backupReady={backupReady}
      locale={locale}
      langSwitchTitle={locale === 'zh' ? tc('langSwitchToEn') : tc('langSwitchToZh')}
      langSwitchAria={locale === 'zh' ? tc('langSwitchAriaToEn') : tc('langSwitchAriaToZh')}
      langBadge={locale === 'zh' ? tc('langBadgeEn') : tc('langBadgeZh')}
      onSwitchLocale={() => router.replace(pathname, { locale: locale === 'zh' ? 'en' : 'zh' })}
      themePopoverOpen={themePopoverOpen}
      onThemePopoverOpenChange={setThemePopoverOpen}
      themePref={themePref}
      appTheme={appTheme}
      onThemeSelect={(theme, x, y) => {
        setAppThemeWithTransition(theme, { x, y });
        setThemePopoverOpen(false);
      }}
      onOpenGeneralSettings={onOpenGeneralSettings}
      onBackHome={() => router.push('/')}
      onOpenGithub={() => window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer')}
      onOpenFeedback={() => window.open(GITHUB_NEW_ISSUE_URL, '_blank', 'noopener,noreferrer')}
      onOpenPreview={openPreview}
      tc={tc}
    />
  ) : null;

  const resumeStage = (
    <CanvasScaleContext.Provider value={scale}>
      <div
        ref={canvasStageRef}
        className='relative flex w-full flex-col items-center py-[40px]'
        aria-hidden={previewOpen || undefined}
      >
        {previewOpen ? null : isEditMode ? (
          <ModuleOperation
            stageRef={canvasStageRef}
            onModuleActivated={onOpenResumePanel}
            fieldEditMode={fieldEditMode}
          >
            {pages}
          </ModuleOperation>
        ) : (
          pages
        )}
      </div>
    </CanvasScaleContext.Provider>
  );

  return (
    <div className='relative flex h-full w-full min-h-0 flex-col'>
      <div
        ref={containerRef}
        className={`relative flex h-full w-full min-h-0 flex-col items-center justify-start rounded-md ${importLoading ? 'overflow-hidden touch-none' : 'overflow-auto'}`}
        onMouseMove={quickSelectActive ? (event) => updateSelectableHover(event.clientX, event.clientY) : undefined}
        onMouseLeave={quickSelectActive ? clearSelectableHover : undefined}
      >
      <InlineFieldEditProvider containerRef={containerRef} enabled={fieldEditMode === 'inline'}>
      {fieldEditMode === 'panel' ? (
        <CanvasFieldHighlight
          containerRef={containerRef}
          anchorEl={panelFieldHighlight.anchorEl}
          itemKey={panelFieldHighlight.itemKey ?? undefined}
        />
      ) : null}
      <ResumeFontCdn font={globalStyle.resumeFont} />
      <div
        aria-hidden='true'
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          width: pw,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <Page {...globalStyle} firstPage sideSlot={undefined}>
          {measureNodes.map(({ module, node }) => (
            <div
              key={`measure-${module.id}`}
              ref={(el) => {
                moduleMeasureEls.current[module.id] = el;
              }}
            >
              {node}
            </div>
          ))}
        </Page>
      </div>
      <div
        className='relative'
        style={{
          width: scaledW,
          height: scaledH,
          visibility: previewOpen ? 'hidden' : undefined,
          pointerEvents: previewOpen ? 'none' : undefined,
          opacity: pagesReady ? 1 : 0,
          transition: pagesReady ? `opacity ${PAGES_FADE_MS}ms ease` : undefined,
        }}
      >
        <div
          style={{
            width: pw,
            boxSizing: 'border-box',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {resumeStage}
        </div>
      </div>

      {quickSelectActive ? (
        <SelectableGuideLines
          hoverRect={hoverRect}
          visible={Boolean(hoverRect)}
          viewport={guideViewport}
        />
      ) : null}

      {floatActionsEl}

      {isEditMode && !templateMode ? previewOverlay : null}

      </InlineFieldEditProvider>
      </div>

      {isEditMode && !templateMode ? <ResumeImportOverlay /> : null}
    </div>
  );
}

export default memo(observer(Canvas));
