import {
  memo,
  useEffect,
  useLayoutEffect,
  type ReactElement,
  useRef,
  useState,
} from 'react';
import { useMemoizedFn } from 'ahooks';
import { CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { createPortal } from 'react-dom';
import resume from '@/json/resume';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';

import { observer } from 'mobx-react';
import {
  Info1,
  Margin,
  Page,
} from '@/modules';
import { createRoot } from 'react-dom/client';
import { configStore } from '@/mobx';
import { resumeFontStack } from '@/lib/resumeFont';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { flattenModules, findModuleById } from '@/utils/resumePages';
import ModuleOperation from '@/components/moduleOperation';
import { CanvasScaleContext } from './canvasScaleContext';
import { PAGE_STACK_GAP_PX } from './pageStackGap';
import ResumeFontCdn from './ResumeFontCdn';
import CanvasModuleFragment from './moduleFragment';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 70;
const PREVIEW_EXIT_MS = 200;

/** 合并默认 globalStyle，避免 cfg 里缺 padding/height 时分页可用高度算错 */
function mergeGlobalStyle(cfg: any): GlobalStyle {
  return mergeGlobalStylePaper(
    resume.globalStyle as GlobalStyle,
    cfg?.globalStyle ?? {}
  );
}

/** 模块间距 px：优先 globalStyle.moduleMargin，兼容旧数据 pages[].moduleMargin */
function moduleGapPx(gs: any, cfg?: any): number {
  const v = Number(gs?.moduleMargin);
  if (Number.isFinite(v) && v >= 0) return v;
  const legacy = Number(cfg?.pages?.[0]?.moduleMargin);
  if (Number.isFinite(legacy) && legacy >= 0) return legacy;
  return Number(resume.globalStyle.moduleMargin) || 15;
}

/** 内容区宽度 ≈ width - padding*2，与 Page 版心一致 */
function contentInnerWidth(gs: any): number {
  const pad = gs?.padding ?? 0;
  const outer = cssLengthToApproxPx(globalStylePageDimensions(gs).width);
  return Math.max(1, outer - pad * 2);
}

/** 单页可容纳内容高度（与 Page 内 padding 算法一致） */
function pageContentHeight(gs: any): number {
  const pad = gs?.padding ?? 0;
  const outer = cssLengthToApproxPx(globalStylePageDimensions(gs).height);
  return Math.max(0, outer - pad * 2);
}

/** 影响高度的字段变化才应触发重测；附带版心宽高与正文排版（换行、分页） */
function layoutSig(module: any, gs: any): string {
  const pad = gs?.padding ?? 0;
  const fs = gs?.fontSize ?? '';
  const lh = gs?.lineHeight ?? '';
  const ht = gs?.headerType ?? '';
  const rf = gs?.resumeFont ?? '';
  const ps = gs?.pageSize ?? '';
  return `${JSON.stringify(module)}|ps:${ps}|pad:${pad}|fs:${fs}|lh:${lh}|ht:${ht}|rf:${rf}`;
}

interface ExportLayoutModule {
  type: string;
  options: Record<string, any>;
  showHeader?: boolean;
  viewHeight?: number;
  offsetY?: number;
  continuation?: boolean;
}

function buildModuleElement(
  module: any,
  gs: any,
  sourceId: string,
  showHeader: boolean,
  fragmentIndex: number
): ReactElement | null {
  if (module.type === 'info1' && showHeader && fragmentIndex === 0) {
    return <Info1 key={sourceId} config={module} globalStyle={gs} />;
  }
  if (module.type === 'info1') {
    return null;
  }
  return (
    <CanvasModuleFragment
      key={`${sourceId}-${fragmentIndex}-${showHeader ? 'h' : 'c'}`}
      fragment={{ type: module.type, sourceId, domId: sourceId, showHeader, options: module.options ?? {} }}
      globalStyle={gs}
    />
  );
}

function Canvas() {
  const moduleHeights = useRef<{ [propName: string]: number }>({});
  /** 与 moduleHeights 对应，用于跳过未改动的模块测量 */
  const measuredSigRef = useRef<Record<string, string>>({});
  /** 避免分页结果与 store 一致时重复 setConfig 导致 effect 循环 */
  const lastLayoutCommitRef = useRef<string>('');
  /** 异步 render 交错完成时禁止旧任务 setConfig 覆盖侧栏已写入的数据 */
  const renderGenerationRef = useRef(0);

  const measureElementHeight = useMemoizedFn(
    (element: ReactElement, gs: any): Promise<number> => {
      return new Promise((resolve) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        container.style.height = 'auto';
        container.style.width = 'auto';
        document.body.appendChild(container);
        container.style.width = `${contentInnerWidth(gs)}px`;
        container.style.fontFamily = resumeFontStack(gs.resumeFont);
        const root = createRoot(container);
        root.render(element);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const height = container.offsetHeight;
            root.unmount();
            document.body.removeChild(container);
            resolve(height);
          });
        });
      });
    }
  );

  const [pages, setPages] = useState<Array<React.ReactNode>>([]);
  const render = useMemoizedFn(async (cfg: any, update: boolean = true) => {
    const myGen = ++renderGenerationRef.current;
    const gs = mergeGlobalStyle(cfg);
    const ordered = flattenModules(cfg);

    // 清理已移除模块的缓存
    const seen = new Set(ordered.map((m: any) => m.id));
    for (const id of Object.keys(moduleHeights.current)) {
      if (!seen.has(id)) {
        delete moduleHeights.current[id];
        delete measuredSigRef.current[id];
      }
    }

    if (myGen !== renderGenerationRef.current) return;

    const pageHeight = pageContentHeight(gs);

    /** 每个分页槽位类型 */
    type ModuleSlot = {
      kind: 'module';
      slotKey: string;
      node: ReactElement;
      /** 该分页片段的可视高度（px） */
      viewHeight: number;
      /** translateY 向上偏移量（px），0 表示不偏移 */
      offsetY: number;
    };
    type MarginSlot = { kind: 'margin'; slotKey: string; height: number };
    type Slot = ModuleSlot | MarginSlot;

    const newPages: Slot[][] = [[]];
    const pageModuleIds: string[][] = [[]];
    const exportPages: Array<{ modules: ExportLayoutModule[] }> = [{ modules: [] }];
    let usedHeight = 0;

    const startNextPage = () => {
      newPages.push([]);
      pageModuleIds.push([]);
      exportPages.push({ modules: [] });
      usedHeight = 0;
    };

    for (const module of ordered) {
      if (!module) continue;
      if (myGen !== renderGenerationRef.current) return;

      const node = buildModuleElement(module, gs, module.id, true, 0);
      if (!node) continue;

      /**
       * canSplit: true  → 允许跨页：当前页裁剪显示，下一页通过 translateY 偏移继续渲染
       * canSplit: false → 不允许跨页：整体放入一页（放不下时换新页）
       */
      const canSplit = module.type !== 'info1';

      // 测量完整模块高度（带缓存）
      const sig = layoutSig(module, gs);
      let moduleHeight = moduleHeights.current[module.id];
      if (!moduleHeight || measuredSigRef.current[module.id] !== sig) {
        moduleHeight = await measureElementHeight(node, gs);
        if (myGen !== renderGenerationRef.current) return;
        moduleHeights.current[module.id] = moduleHeight;
        measuredSigRef.current[module.id] = sig;
      }
      // 空内容模块（如刚添加的空技能）高度可能为 0，仍需放置以显示 header
      if (moduleHeight < 0) continue;
      if (moduleHeight === 0) moduleHeight = 1;

      /** 已在前页展示的高度（即下一次渲染的 translateY 偏移） */
      let shownSoFar = 0;
      /** 还需要展示的高度 */
      let remaining = moduleHeight;
      /** 是否是该模块的第一次放置（用于决定是否插入间距） */
      let isFirstPlacement = true;
      /** config pages 仅记录一次，避免同一模块在后续分页重复出现在 flattenModules */
      let addedToConfig = false;
      let slotSeq = 0;
      while (remaining > 0) {
        const curIdx = newPages.length - 1;
        // 只有首次放置且当前页已有内容时才加间距
        const gap = isFirstPlacement && newPages[curIdx].length > 0 ? moduleGapPx(gs, cfg) : 0;
        const spaceAfterGap = pageHeight - usedHeight - gap;

        // 当前页没有剩余空间，换新页（不改变 isFirstPlacement，让间距逻辑在新页重算）
        if (spaceAfterGap <= 0) {
          startNextPage();
          continue;
        }

        if (remaining <= spaceAfterGap) {
          // ─── 完整放入当前页 ───
          if (gap > 0) {
            newPages[curIdx].push({ kind: 'margin', slotKey: `gap-${module.id}-${slotSeq}`, height: gap });
            usedHeight += gap;
          }
          newPages[curIdx].push({
            kind: 'module',
            slotKey: `${module.id}-${slotSeq++}`,
            node,
            viewHeight: remaining,
            offsetY: shownSoFar,
          });
          exportPages[curIdx].modules.push({
            type: module.type,
            options: JSON.parse(JSON.stringify(module.options ?? {})),
            showHeader: true,
            viewHeight: remaining,
            offsetY: shownSoFar,
            continuation: shownSoFar > 0,
          });
          if (!addedToConfig) {
            pageModuleIds[curIdx].push(module.id);
            addedToConfig = true;
          }
          usedHeight += remaining;
          remaining = 0;
        } else if (!canSplit) {
          // ─── 不允许跨页 ───
          if (newPages[curIdx].length > 0) {
            // 当前页有内容，整体移到下一页
            startNextPage();
            // isFirstPlacement 保持 true，下一轮会在新页上正确放置
            continue;
          } else {
            // 当前页为空，强制放入（模块本身超出页高，允许溢出）
            newPages[curIdx].push({
              kind: 'module',
              slotKey: `${module.id}-${slotSeq++}`,
              node,
              viewHeight: remaining,
              offsetY: 0,
            });
            exportPages[curIdx].modules.push({
              type: module.type,
              options: JSON.parse(JSON.stringify(module.options ?? {})),
              showHeader: true,
              viewHeight: remaining,
              offsetY: 0,
              continuation: false,
            });
            if (!addedToConfig) {
              pageModuleIds[curIdx].push(module.id);
              addedToConfig = true;
            }
            usedHeight += remaining;
            remaining = 0;
          }
        } else {
          // ─── 允许跨页：当前页裁剪，下一页偏移继续 ───
          if (gap > 0) {
            newPages[curIdx].push({ kind: 'margin', slotKey: `gap-${module.id}-${slotSeq}`, height: gap });
            usedHeight += gap;
          }
          const clipH = pageHeight - usedHeight; // 当前页剩余空间
          newPages[curIdx].push({
            kind: 'module',
            slotKey: `${module.id}-${slotSeq++}`,
            node,
            viewHeight: clipH,
            offsetY: shownSoFar,
          });
          exportPages[curIdx].modules.push({
            type: module.type,
            options: JSON.parse(JSON.stringify(module.options ?? {})),
            showHeader: true,
            viewHeight: clipH,
            offsetY: shownSoFar,
            continuation: shownSoFar > 0,
          });
          if (!addedToConfig) {
            pageModuleIds[curIdx].push(module.id);
            addedToConfig = true;
          }
          usedHeight += clipH;
          shownSoFar += clipH;
          remaining -= clipH;
          startNextPage();
          isFirstPlacement = false; // 续页不加间距
          continue;
        }

        isFirstPlacement = false;
      }
    }

    if (myGen !== renderGenerationRef.current) return;

    // 将槽位数组转换为 React 节点
    const allPages = newPages.map((slots, pageIndex) => {
      const children = slots.map((slot) => {
        if (slot.kind === 'margin') {
          return <Margin key={slot.slotKey} height={slot.height} />;
        }

        const hasOffset = slot.offsetY > 0;

        // 带偏移的内容层
        const inner = hasOffset ? (
          <div style={{ transform: `translateY(-${slot.offsetY}px)` }}>
            {slot.node}
          </div>
        ) : slot.node;

        // 所有模块槽位都使用固定可视高度，确保“计算高度”与“实际渲染高度”一致
        return (
          <div
            key={slot.slotKey}
            style={{ height: slot.viewHeight, overflow: 'hidden', flexShrink: 0 }}
          >
            {inner}
          </div>
        );
      });

      return (
        <div key={pageIndex + 1}>
          <Page {...gs}>{children}</Page>
        </div>
      );
    });

    setPages(allPages);
    configStore.setExportPages(exportPages);

    if (!update) return;

    const live = configStore.getConfig ?? cfg;
    if (!live) return;

    const nextConfig: any = {
      ...live,
      globalStyle: gs,
      pages: [],
    };
    for (let i = 0; i < newPages.length; i++) {
      const modulesOut: any[] = [];
      const seenIds = new Set<string>();
      for (const id of pageModuleIds[i]) {
        if (!id || seenIds.has(id)) continue;
        seenIds.add(id);
        const m = findModuleById(live, id);
        if (m) modulesOut.push(m);
      }
      nextConfig.pages.push({ modules: modulesOut });
    }

    const snapshot = JSON.stringify(nextConfig);
    if (snapshot !== lastLayoutCommitRef.current) {
      lastLayoutCommitRef.current = snapshot;
      configStore.setConfig(nextConfig);
    }
  });

  useEffect(() => {
    render(resume);
  }, [resume]);

  useEffect(() => {
    if (configStore.getConfig) {
      void render(configStore.getConfig, true);
    }
  }, [configStore.getConfig]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewClosing, setPreviewClosing] = useState(false);
  const previewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const globalStyle = configStore.mergedGlobalStyle;
  const pageCount = Math.max(1, pages.length);
  const { width: pw, height: ph } = globalStylePageDimensions(globalStyle);
  const pageWPx = cssLengthToApproxPx(pw);
  const pageHPx = cssLengthToApproxPx(ph);
  const contentW = pageWPx;
  const contentH =
    pageCount * pageHPx +
    Math.max(0, pageCount - 1) * PAGE_STACK_GAP_PX;

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

  useEffect(() => {
    return () => {
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
            className={`${previewClosing ? 'canvas-preview-overlay-exit-animate' : 'canvas-preview-overlay-animate'} fixed inset-0 z-[1400] flex min-h-0 flex-col bg-[#0f0d12]/88 backdrop-blur-sm`}
          >
            <div className='flex items-center justify-between border-b border-white/10 px-5 py-3.5'>
              <span className='text-[13px] font-medium text-white/88'>文本预览</span>
              <button
                type='button'
                onClick={closePreview}
                className='cursor-pointer inline-flex size-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white'
                aria-label='关闭预览'
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

  return (
    <div
      ref={containerRef}
      className='relative flex h-full w-full min-h-0 flex-col items-center justify-start overflow-auto rounded-md'
    >
      <ResumeFontCdn font={globalStyle.resumeFont} />
      <div style={{ width: contentW * scale, height: contentH * scale }}>
        <div
          style={{
            width: contentW,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CanvasScaleContext.Provider value={scale}>
            <div className='flex w-full flex-col items-center py-[40px]'>
              <ModuleOperation>{pages}</ModuleOperation>
            </div>
          </CanvasScaleContext.Provider>
        </div>
      </div>

      <div className='pointer-events-none fixed right-[20px] bottom-[20px] z-20'>
        <Tooltip title='简历预览' placement='left'>
          <button
            type='button'
            onClick={openPreview}
            className='cursor-pointer pointer-events-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/15 bg-[#26242b]/92 text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-[#302d36]'
            aria-label='简历预览'
          >
            <EyeOutlined className='text-[17px]' />
          </button>
        </Tooltip>
      </div>

      {previewOverlay}

    </div>
  );
}

export default memo(observer(Canvas));
