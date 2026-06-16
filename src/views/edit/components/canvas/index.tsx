'use client';
import {
  Fragment,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactElement,
  type ReactNode,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useMemoizedFn } from 'ahooks';
import {
  CloseOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
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
import ResumeFontCdn from './resumeFontCdn';
import CanvasModuleFragment from './moduleFragment';
import SelectableGuideLines from './selectableGuideLines';
import { useSelectableGuideHover } from './useSelectableGuideHover';
import CanvasFloatActions from './canvasFloatActions';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 70;
const PREVIEW_EXIT_MS = 200;
const RENDER_DEBOUNCE_MS = 180;
const PAGE_FIT_EPSILON_PX = 0.5;
const MEASURE_HEIGHT_EPSILON_PX = 0.1;
const MEASURE_FRAME_DELAY = 10;

type LayoutSubtreeContext = CanvasRenderingContext2D & {
  layoutSubtree?: (...args: unknown[]) => unknown;
  drawElementImage?: (...args: unknown[]) => unknown;
};

type HighPerfBrowserHint =
  | { kind: 'nonChrome' }
  | { kind: 'needUpgrade'; version: number }
  | { kind: 'chromeReady'; version: number };

function detectLayoutSubtreeSupport(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as LayoutSubtreeContext | null;
  return Boolean(ctx && typeof ctx.drawElementImage === 'function');
}

function tryInvokeLayoutSubtree(target: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as LayoutSubtreeContext | null;
  if (!ctx || typeof ctx.layoutSubtree !== 'function') return;
  // API 仍处于实验阶段，参数签名可能变化，这里仅做 best-effort 调用并安全回退。
  void ctx.layoutSubtree(target);
}

function detectHighPerfBrowserHint(): HighPerfBrowserHint {
  if (typeof navigator === 'undefined') return { kind: 'nonChrome' };

  type NavigatorWithUAData = Navigator & {
    userAgentData?: { brands?: Array<{ brand: string; version: string }> };
  };

  const nav = navigator as NavigatorWithUAData;

  const ua = nav.userAgent ?? '';
  const vendor = nav.vendor ?? '';
  const uaData = nav.userAgentData;

  const hasGoogleChromeBrand = Boolean(
    uaData?.brands?.some((item) => item.brand === 'Google Chrome'),
  );
  const hasChromeToken = /Chrome\/(\d+)/.test(ua);
  const isEdgeLike = /Edg\//.test(ua);
  const isOperaLike = /OPR\//.test(ua);

  const isChrome = (hasGoogleChromeBrand || (hasChromeToken && vendor.includes('Google'))) && !isEdgeLike && !isOperaLike;
  if (!isChrome) return { kind: 'nonChrome' };

  const match = ua.match(/Chrome\/(\d+)/);
  const major = match ? Number(match[1]) : NaN;
  const version = Number.isFinite(major) ? major : 0;

  if (version >= 149) return { kind: 'chromeReady', version };
  return { kind: 'needUpgrade', version };
}

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
  highPerfMode?: boolean;
  onToggleHighPerfMode?: () => void;
  onOpenGeneralSettings?: () => void;
  onOpenResumePanel?: () => void;
  mode?: 'edit' | 'preview';
};

function Canvas({
  highPerfMode = false,
  onToggleHighPerfMode,
  onOpenGeneralSettings,
  onOpenResumePanel,
  mode = 'edit',
}: CanvasProps) {
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
  const [quickSelectEnabled, setQuickSelectEnabled] = useState(true);

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
      node: buildModuleNode(module, layoutGlobalStyle, { selectable: isEditMode && quickSelectEnabled }),
    })).filter((item): item is { module: LayoutModule; node: ReactElement } => Boolean(item.node)),
    [layoutModules, layoutGlobalStyle, isEditMode, quickSelectEnabled],
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
        const nextOffsetY = moduleHeight - overflowHeight;
        offsetY = nextOffsetY;
        remaining = overflowHeight;
        startNextPage();
        isFirstFragment = false;
      }
    }

    const sideSlot = sideColLayout && info1Module
      ? buildModuleNode({ ...info1Module, index: 0 }, gs, {
          forceSideCol: true,
          selectable: isEditMode && quickSelectEnabled,
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
  const [layoutSubtreeSupported, setLayoutSubtreeSupported] = useState(false);
  const [highPerfRenderOk, setHighPerfRenderOk] = useState(false);
  const [highPerfBrowserHint, setHighPerfBrowserHint] = useState<HighPerfBrowserHint>({ kind: 'nonChrome' });
  const previewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const perfCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderSourceRef = useRef<HTMLDivElement>(null);
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
  const useLocalCanvasHighPerf = !isEditMode && highPerfMode;
  const highPerfToggleSupported = layoutSubtreeSupported;
  const useCanvasPresentation =
    useLocalCanvasHighPerf && layoutSubtreeSupported && highPerfRenderOk;
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
    setLayoutSubtreeSupported(detectLayoutSubtreeSupport());
    setHighPerfBrowserHint(detectHighPerfBrowserHint());
  }, []);

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

  useLayoutEffect(() => {
    if (!useLocalCanvasHighPerf || !layoutSubtreeSupported) return;
    const host = canvasStageRef.current;
    if (!host) return;
    try {
      tryInvokeLayoutSubtree(host);
    } catch {
      // Ignore runtime errors from experimental API and keep normal render path.
    }
  }, [useLocalCanvasHighPerf, layoutSubtreeSupported, pages.length, layoutRevision, scale]);

  const renderCanvasSnapshot = useMemoizedFn(() => {
    const canvas = perfCanvasRef.current;
    const source = renderSourceRef.current;
    if (!canvas || !source) return false;
    const ctx = canvas.getContext('2d') as LayoutSubtreeContext | null;
    if (!ctx || typeof ctx.drawElementImage !== 'function') return false;

    const ratio = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
    const width = Math.max(1, Math.round(contentW * scale));
    const height = Math.max(1, Math.round(contentH * scale));

    if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
    if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    try {
      // WICG HTML-in-Canvas 实验能力：将 DOM 元素直接绘制到 2D canvas。
      // 参数签名仍可能变化，当前按最常见的 (element, x, y) 方式调用。
      void ctx.drawElementImage(source, 0, 0);
      return true;
    } catch {
      return false;
    }
  });

  useLayoutEffect(() => {
    if (!useLocalCanvasHighPerf || !layoutSubtreeSupported) {
      setHighPerfRenderOk(false);
      return;
    }

    let raf = 0;
    raf = requestAnimationFrame(() => {
      const ok = renderCanvasSnapshot();
      setHighPerfRenderOk(ok);
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    useLocalCanvasHighPerf,
    layoutSubtreeSupported,
    renderCanvasSnapshot,
    pages.length,
    layoutRevision,
    scale,
    contentW,
    contentH,
  ]);

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

  const highPerfTooltipTitle: ReactNode = useMemo(() => {
    if (highPerfToggleSupported) {
      return highPerfMode ? tc('highPerfOnTooltip') : tc('highPerfOffTooltip');
    }

    if (highPerfBrowserHint.kind === 'nonChrome') {
      return locale === 'zh'
        ? '高性能渲染模式建议使用 Chrome 浏览器。'
        : 'High-performance rendering mode is available in Chrome browser.';
    }

    if (highPerfBrowserHint.kind === 'needUpgrade') {
      return locale === 'zh'
        ? `当前 Chrome ${highPerfBrowserHint.version || ''} 版本过低，请升级到 149 或更高版本。`
        : `Your Chrome ${highPerfBrowserHint.version || ''} is too old. Please upgrade to version 149 or newer.`;
    }

    return (
      <span>
        {locale === 'zh'
          ? '检测到 Chrome 149+，请先开启实验能力：'
          : 'Chrome 149+ detected. Enable the experiment first: '}
        <a
          href='chrome://flags/#canvas-draw-element'
          onClick={(event) => {
            event.preventDefault();
            window.open('chrome://flags/#canvas-draw-element');
          }}
          className='underline underline-offset-2'
        >
          chrome://flags/#canvas-draw-element
        </a>
      </span>
    );
  }, [highPerfBrowserHint, highPerfMode, highPerfToggleSupported, locale, tc]);

  return (
    <div
      ref={containerRef}
      className='relative flex h-full w-full min-h-0 flex-col items-center justify-start overflow-auto rounded-md'
      onMouseMove={isEditMode && quickSelectEnabled ? (event) => updateSelectableHover(event.clientX, event.clientY) : undefined}
      onMouseLeave={isEditMode && quickSelectEnabled ? clearSelectableHover : undefined}
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
      <div className='relative' style={{ width: contentW * scale, height: contentH * scale }}>
        {useLocalCanvasHighPerf && layoutSubtreeSupported ? (
          <canvas
            ref={perfCanvasRef}
            className='absolute inset-0 z-[1]'
            style={{
              width: contentW * scale,
              height: contentH * scale,
              opacity: useCanvasPresentation ? 1 : 0,
              pointerEvents: 'none',
            }}
            aria-label='canvas-render-snapshot'
          />
        ) : null}
        <div
          ref={renderSourceRef}
          style={{
            width: pw,
            boxSizing: 'border-box',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            opacity: useCanvasPresentation ? 0 : 1,
            pointerEvents: 'auto',
          }}
        >
          <CanvasScaleContext.Provider value={scale}>
            <div
              ref={canvasStageRef}
              className='relative flex w-full flex-col items-center py-[40px]'
            >
              {isEditMode ? (
                <ModuleOperation
                  stageRef={canvasStageRef}
                  onModuleActivated={onOpenResumePanel}
                >
                  {pages}
                </ModuleOperation>
              ) : pages}
            </div>
          </CanvasScaleContext.Provider>
        </div>
      </div>

      {isEditMode && quickSelectEnabled && hoverRect ? (
        <SelectableGuideLines hoverRect={hoverRect} viewport={guideViewport} />
      ) : null}

      {isEditMode ? (
        <CanvasFloatActions
          backupReady={backupReady}
          quickSelectEnabled={quickSelectEnabled}
          onToggleQuickSelect={() => setQuickSelectEnabled((value) => !value)}
          highPerfTooltipTitle={highPerfTooltipTitle}
          layoutSubtreeSupported={highPerfToggleSupported}
          highPerfMode={highPerfMode}
          onToggleHighPerfMode={() => {
            if (!highPerfToggleSupported) return;
            onToggleHighPerfMode?.();
          }}
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
          onOpenGithub={() => window.open('https://github.com/QdabuliuQ/easy-resume', '_blank', 'noopener,noreferrer')}
          onOpenPreview={openPreview}
          tc={tc}
        />
      ) : null}

      {isEditMode ? previewOverlay : null}

    </div>
  );
}

export default memo(observer(Canvas));
