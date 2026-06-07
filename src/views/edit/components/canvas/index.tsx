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
import {
  CheckCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  GithubOutlined,
  HomeOutlined,
  MoonOutlined,
  SunOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Popover, Tooltip } from 'antd';
import { createPortal } from 'react-dom';
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
import { configStore } from '@/mobx';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { flattenModules } from '@/utils/resumePages';
import ModuleOperation from '@/components/moduleOperation';
import { CanvasScaleContext } from './canvasScaleContext';
import { PAGE_STACK_GAP_PX } from './pageStackGap';
import ResumeFontCdn from './ResumeFontCdn';
import CanvasModuleFragment from './moduleFragment';
import SelectableGuideLines from './SelectableGuideLines';
import { useSelectableGuideHover } from './useSelectableGuideHover';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 70;
const PREVIEW_EXIT_MS = 200;
const RENDER_DEBOUNCE_MS = 180;
const PAGE_FIT_EPSILON_PX = 1;
const MEASURE_HEIGHT_EPSILON_PX = 0.1;
const MEASURE_FRAME_DELAY = 10;

/** 合并默认 globalStyle，避免 cfg 里缺字段时渲染异常 */


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
  onOpenGeneralSettings?: () => void;
  mode?: 'edit' | 'preview';
};

function Canvas({ onOpenGeneralSettings, mode = 'edit' }: CanvasProps) {
  const isEditMode = mode === 'edit';
  const tc = useTranslations('Edit.canvas');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const renderDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moduleMeasureEls = useRef<Record<string, HTMLDivElement | null>>({});
  const moduleHeights = useRef<Record<string, number>>({});
  const [pages, setPages] = useState<Array<React.ReactNode>>([]);
  const [layoutRevision, setLayoutRevision] = useState(0);

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
      node: buildModuleNode(module, layoutGlobalStyle, { selectable: isEditMode }),
    })).filter((item): item is { module: LayoutModule; node: ReactElement } => Boolean(item.node)),
    [layoutModules, layoutGlobalStyle, isEditMode],
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

        pushSlot(page, module, node, {
          gapBefore,
          viewHeight: visibleHeight,
          offsetY,
          measuredModuleHeight: moduleHeight,
        });
        usedHeight = effectiveHeight;
        const overflowHeight = remaining - visibleHeight;
        offsetY = moduleHeight - overflowHeight;
        remaining = overflowHeight;
        startNextPage();
        isFirstFragment = false;
      }
    }

    const sideSlot = sideColLayout && info1Module
      ? buildModuleNode({ ...info1Module, index: 0 }, gs, {
          forceSideCol: true,
          selectable: isEditMode,
        })
      : null;

    const nextPages = layoutPages.map((page, pageIndex) => {
      const children = page.slots.map((slot) => {
        const node = slot.offsetY > 0 ? (
          <div
            key={`${slot.module.id}-${slot.offsetY}`}
            style={{ marginTop: -slot.offsetY }}
          >
            {slot.node}
          </div>
        ) : slot.node;
        return (
          <Fragment key={`${slot.module.id}-${slot.offsetY}-${slot.viewHeight}`}>
            {slot.gapBefore > 0 ? <div style={{ height: slot.gapBefore }} aria-hidden /> : null}
            {node}
          </Fragment>
        );
      });
      return (
        <div
          key={pageIndex + 1}
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
  });

  const syncMeasuredHeights = useMemoizedFn(() => {
    const liveIds = new Set(layoutModules.map((module) => module.id));
    for (const id of Object.keys(moduleHeights.current)) {
      if (!liveIds.has(id)) delete moduleHeights.current[id];
    }

    let changed = false;
    for (const { module } of measureNodes) {
      const el = moduleMeasureEls.current[module.id];
      if (!el) continue;
      const height = readLayoutHeightPx(el);
      if (Math.abs((moduleHeights.current[module.id] ?? 0) - height) >= MEASURE_HEIGHT_EPSILON_PX) {
        moduleHeights.current[module.id] = height;
        changed = true;
      }
    }
    if (changed) setLayoutRevision((value) => value + 1);
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
      const fontsReady = typeof document !== 'undefined'
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve(undefined);
      void fontsReady.then(() => runAfterFrames(MEASURE_FRAME_DELAY));
    }, RENDER_DEBOUNCE_MS);
  });

  useEffect(() => {
    if (!currentConfig) return;
    const hasModules = flattenModules(currentConfig).length > 0;
    if (hasModules) return;
    console.warn('[Canvas] detected empty modules, request config normalize');
    configStore.setConfig(currentConfig);
  }, [currentConfig]);

  useLayoutEffect(() => {
    scheduleMeasuredPagination();
  }, [measureNodes, scheduleMeasuredPagination]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) scheduleMeasuredPagination();
    });
    return () => {
      cancelled = true;
    };
  }, [scheduleMeasuredPagination]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const els = Object.values(moduleMeasureEls.current).filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const ro = new ResizeObserver(() => scheduleMeasuredPagination());
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [measureNodes, scheduleMeasuredPagination]);

  useEffect(() => {
    buildPagination();
  }, [buildPagination, layoutRevision, measureNodes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewClosing, setPreviewClosing] = useState(false);
  const previewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (previewCloseTimerRef.current) {
        clearTimeout(previewCloseTimerRef.current);
      }
    };
  }, []);

  const openPreview = useMemoizedFn(() => {
    if (previewCloseTimerRef.current) {
      clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    setPreviewClosing(false);
    setPreviewOpen(true);
  });

  const closePreview = useMemoizedFn(() => {
    if (!previewOpen || previewClosing) return;
    setPreviewClosing(true);
    previewCloseTimerRef.current = setTimeout(() => {
      setPreviewOpen(false);
      setPreviewClosing(false);
      previewCloseTimerRef.current = null;
    }, PREVIEW_EXIT_MS);
  });

  const previewOverlay =
    previewOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`${previewClosing ? 'canvas-preview-overlay-exit-animate' : 'canvas-preview-overlay-animate'} canvas-preview-shell fixed inset-0 z-[1400] flex min-h-0 flex-col backdrop-blur-sm`}
          >
            <div className='canvas-preview-toolbar flex items-center justify-between px-5 py-3.5'>
              <span className='text-[13px] font-medium'>{tc('textPreview')}</span>
              <button
                type='button'
                onClick={closePreview}
                className='canvas-preview-close'
                aria-label={tc('closePreview')}
              >
                <CloseOutlined className='text-[12px]' />
              </button>
            </div>

            <div className='min-h-0 flex-1 overflow-auto px-5 py-5'>
              <div
                className={`${previewClosing ? 'canvas-preview-content-exit-animate' : 'canvas-preview-content-animate'} mx-auto flex w-fit flex-col gap-[30px]`}
              >
                {pages.map((page, idx) => (
                  <div key={`text-preview-page-${idx}`} className='shrink-0'>
                    {page}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;
  const { hoverRect, updateSelectableHover, clearSelectableHover } = useSelectableGuideHover({
    containerRef,
    stageRef: canvasStageRef,
  });

  return (
    <div
      ref={containerRef}
      className='relative flex h-full w-full min-h-0 flex-col items-center justify-start overflow-auto rounded-md'
      onMouseMove={isEditMode ? (event) => updateSelectableHover(event.clientX, event.clientY) : undefined}
      onMouseLeave={isEditMode ? clearSelectableHover : undefined}
    >
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
      <div style={{ width: contentW * scale, height: contentH * scale }}>
        <div
          style={{
            width: pw,
            boxSizing: 'border-box',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CanvasScaleContext.Provider value={scale}>
            <div
              ref={canvasStageRef}
              className='relative flex w-full flex-col items-center py-[40px]'
            >
              {isEditMode ? <ModuleOperation stageRef={canvasStageRef}>{pages}</ModuleOperation> : pages}
            </div>
          </CanvasScaleContext.Provider>
        </div>
      </div>

      {isEditMode && hoverRect ? (
        <SelectableGuideLines hoverRect={hoverRect} viewport={guideViewport} />
      ) : null}

      {isEditMode ? (
      <div className='pointer-events-none fixed right-[20px] bottom-[20px] z-20 flex flex-col items-end gap-2'>
        {backupReady ? (
          <Tooltip title={tc('backupOnTooltip')} placement='left'>
            <span className='pointer-events-auto inline-flex'>
              <button
                type='button'
                disabled
                className='inline-flex h-[42px] w-[42px] cursor-default items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/20 text-emerald-500 shadow-[0_16px_34px_rgb(0_0_0/0.12)] backdrop-blur-[8px]'
                aria-label={tc('backupOnAria')}
              >
                <CheckCircleOutlined className='text-[17px]' />
              </button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={tc('backupOffTooltip')} placement='left'>
            <span className='pointer-events-auto inline-flex'>
              <button
                type='button'
                onClick={() => onOpenGeneralSettings?.()}
                className='inline-flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border border-red-500/45 bg-red-500/20 text-red-500 shadow-[0_16px_34px_rgb(0_0_0/0.12)] backdrop-blur-[8px]'
                aria-label={tc('backupOpenSettingsAria')}
              >
                <WarningOutlined className='text-[17px]' />
              </button>
            </span>
          </Tooltip>
        )}
        <Tooltip
          title={locale === 'zh' ? tc('langSwitchToEn') : tc('langSwitchToZh')}
          placement='left'
        >
          <button
            type='button'
            onClick={() =>
              router.replace(pathname, { locale: locale === 'zh' ? 'en' : 'zh' })
            }
            className='canvas-float-btn font-semibold'
            aria-label={locale === 'zh' ? tc('langSwitchAriaToEn') : tc('langSwitchAriaToZh')}
          >
            <span className='text-[12px] leading-none tracking-tight'>
              {locale === 'zh' ? tc('langBadgeEn') : tc('langBadgeZh')}
            </span>
          </button>
        </Tooltip>
        <Popover
          placement='left'
          trigger='hover'
          mouseEnterDelay={0.12}
          open={themePopoverOpen}
          onOpenChange={setThemePopoverOpen}
          styles={{ body: { padding: 6 } }}
          content={
            <div className='flex min-w-[116px] flex-col gap-0.5'>
              <button
                type='button'
                onClick={(e) => {
                  setAppThemeWithTransition('light', { x: e.clientX, y: e.clientY });
                  setThemePopoverOpen(false);
                }}
                className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  themePref === 'light' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
                }`}
              >
                {tc('themeMenuLight')}
              </button>
              <button
                type='button'
                onClick={(e) => {
                  setAppThemeWithTransition('dark', { x: e.clientX, y: e.clientY });
                  setThemePopoverOpen(false);
                }}
                className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  themePref === 'dark' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
                }`}
              >
                {tc('themeMenuDark')}
              </button>
              <button
                type='button'
                onClick={(e) => {
                  setAppThemeWithTransition('system', { x: e.clientX, y: e.clientY });
                  setThemePopoverOpen(false);
                }}
                className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  themePref === 'system' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
                }`}
              >
                {tc('themeMenuSystem')}
              </button>
            </div>
          }
        >
          <button
            type='button'
            className='canvas-float-btn'
            aria-label={tc('toggleThemeAria')}
            aria-haspopup='menu'
          >
            {appTheme === 'dark' ? (
              <SunOutlined className='text-[17px]' />
            ) : (
              <MoonOutlined className='text-[17px]' />
            )}
          </button>
        </Popover>

        <Tooltip title={tc('homeTooltip')} placement='left'>
          <button
            type='button'
            onClick={() => router.push('/')}
            className='canvas-float-btn'
            aria-label={tc('backHomeAria')}
          >
            <HomeOutlined className='text-[17px]' />
          </button>
        </Tooltip>

        <Tooltip title={tc('githubTooltip')} placement='left'>
          <button
            type='button'
            onClick={() => window.open('https://github.com/QdabuliuQ/easy-resume', '_blank', 'noopener,noreferrer')}
            className='canvas-float-btn'
            aria-label={tc('githubAria')}
          >
            <GithubOutlined className='text-[17px]' />
          </button>
        </Tooltip>

        <Tooltip title={tc('previewTooltip')} placement='left'>
          <button
            type='button'
            onClick={openPreview}
            className='canvas-float-btn'
            aria-label={tc('previewAria')}
          >
            <EyeOutlined className='text-[17px]' />
          </button>
        </Tooltip>
      </div>
      ) : null}

      {isEditMode ? previewOverlay : null}

    </div>
  );
}

export default memo(observer(Canvas));
