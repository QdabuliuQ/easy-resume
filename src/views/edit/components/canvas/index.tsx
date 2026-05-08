import {
  memo,
  useEffect,
  useLayoutEffect,
  type ReactElement,
  useRef,
  useState,
} from 'react';
import { useMemoizedFn } from 'ahooks';
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
import { plainTextFromRichHtml, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import ModuleOperation from '@/components/moduleOperation';
import { CanvasScaleContext } from './canvasScaleContext';
import { PAGE_STACK_GAP_PX } from './pageStackGap';
import ResumeFontCdn from './ResumeFontCdn';
import CanvasModuleFragment, {
  canSplitModule,
  isListFlowModule,
  isTextFlowModule,
  itemDescriptionField,
  type CanvasModuleFragmentConfig,
} from './moduleFragment';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 40;

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

interface PreparedRenderable {
  key: string;
  sourceId: string;
  node: ReactElement;
  height: number;
}

interface ExportLayoutModule {
  type: string;
  options: Record<string, any>;
  showHeader?: boolean;
}

function fragmentDomId(sourceId: string, fragmentIndex: number) {
  return fragmentIndex === 0 ? sourceId : `${sourceId}__fragment_${fragmentIndex}`;
}

function buildFragmentConfig(
  module: any,
  sourceId: string,
  showHeader: boolean,
  fragmentIndex: number
): CanvasModuleFragmentConfig {
  return {
    type: module.type,
    sourceId,
    domId: fragmentDomId(sourceId, fragmentIndex),
    showHeader,
    options: module.options ?? {},
  };
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
  if (!canSplitModule(module)) {
    return null;
  }
  return (
    <CanvasModuleFragment
      key={`${sourceId}-${fragmentIndex}-${showHeader ? 'h' : 'c'}`}
      fragment={buildFragmentConfig(module, sourceId, showHeader, fragmentIndex)}
      globalStyle={gs}
    />
  );
}

function cloneChildNodesInto(source: Node, target: Node) {
  for (const child of Array.from(source.childNodes)) {
    target.appendChild(child.cloneNode(true));
  }
}

function nodeHasRenderableContent(node: Node | null) {
  if (!node) return false;
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').length > 0;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  const element = node as Element;
  if (element.tagName === 'BR' || element.tagName === 'IMG') {
    return true;
  }
  if (element.innerHTML.trim()) {
    return true;
  }
  return Array.from(element.childNodes).some((child) => nodeHasRenderableContent(child));
}

async function splitHtmlNode(
  node: Node,
  fits: (candidate: Node | null) => Promise<boolean>
): Promise<{ head: Node | null; tail: Node | null }> {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text) {
      return { head: null, tail: null };
    }
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = document.createTextNode(text.slice(0, mid));
      if (await fits(candidate)) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    if (low <= 0) {
      return { head: null, tail: document.createTextNode(text) };
    }
    const head = document.createTextNode(text.slice(0, low));
    const rest = text.slice(low);
    return {
      head,
      tail: rest ? document.createTextNode(rest) : null,
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return { head: null, tail: null };
  }

  const element = node as Element;
  if (element.childNodes.length === 0) {
    const fullClone = element.cloneNode(true);
    if (await fits(fullClone)) {
      return { head: fullClone, tail: null };
    }
    return { head: null, tail: fullClone };
  }

  const headElement = element.cloneNode(false) as Element;
  const children = Array.from(element.childNodes);

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const nextWhole = headElement.cloneNode(false) as Element;
    cloneChildNodesInto(headElement, nextWhole);
    nextWhole.appendChild(child.cloneNode(true));
    if (await fits(nextWhole)) {
      headElement.appendChild(child.cloneNode(true));
      continue;
    }

    const splitChild = await splitHtmlNode(child, async (candidate) => {
      const nested = element.cloneNode(false) as Element;
      cloneChildNodesInto(headElement, nested);
      if (candidate) {
        nested.appendChild(candidate);
      }
      return fits(nested);
    });

    if (splitChild.head) {
      headElement.appendChild(splitChild.head);
    }

    const tailElement = element.cloneNode(false) as Element;
    if (splitChild.tail) {
      tailElement.appendChild(splitChild.tail);
    }
    for (let restIndex = index + 1; restIndex < children.length; restIndex += 1) {
      tailElement.appendChild(children[restIndex].cloneNode(true));
    }

    return {
      head: nodeHasRenderableContent(headElement) ? headElement : null,
      tail: nodeHasRenderableContent(tailElement) ? tailElement : null,
    };
  }

  return {
    head: nodeHasRenderableContent(headElement) ? headElement : null,
    tail: null,
  };
}

async function splitRichHtmlByHeight(
  html: string,
  fitsHtml: (candidateHtml: string) => Promise<boolean>
) {
  const safe = sanitizeRichTextHtml(html);
  if (!safe.trim()) {
    return { headHtml: '', tailHtml: '' };
  }
  const source = document.createElement('div');
  source.innerHTML = safe;
  const head = document.createElement('div');
  const children = Array.from(source.childNodes);

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const trial = document.createElement('div');
    cloneChildNodesInto(head, trial);
    trial.appendChild(child.cloneNode(true));
    if (await fitsHtml(trial.innerHTML)) {
      head.appendChild(child.cloneNode(true));
      continue;
    }

    const splitChild = await splitHtmlNode(child, async (candidate) => {
      const nested = document.createElement('div');
      cloneChildNodesInto(head, nested);
      if (candidate) {
        nested.appendChild(candidate);
      }
      return fitsHtml(nested.innerHTML);
    });

    if (splitChild.head) {
      head.appendChild(splitChild.head);
    }

    const tail = document.createElement('div');
    if (splitChild.tail) {
      tail.appendChild(splitChild.tail);
    }
    for (let restIndex = index + 1; restIndex < children.length; restIndex += 1) {
      tail.appendChild(children[restIndex].cloneNode(true));
    }

    return {
      headHtml: head.innerHTML,
      tailHtml: tail.innerHTML,
    };
  }

  return {
    headHtml: head.innerHTML,
    tailHtml: '',
  };
}

function escapeHtmlText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToParagraphHtml(text: string) {
  const normalized = text.replace(/\r\n?/g, '\n');
  if (!normalized.trim()) {
    return '';
  }
  return normalized
    .split('\n')
    .map((line) => `<p>${line ? escapeHtmlText(line) : '<br>'}</p>`)
    .join('');
}

async function splitPlainTextFallbackByHeight(
  html: string,
  fitsHtml: (candidateHtml: string) => Promise<boolean>
) {
  const text = plainTextFromRichHtml(html);
  if (!text) {
    return { headHtml: '', tailHtml: '' };
  }
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidateHtml = plainTextToParagraphHtml(text.slice(0, mid));
    if (candidateHtml && (await fitsHtml(candidateHtml))) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  if (low <= 0) {
    return {
      headHtml: '',
      tailHtml: plainTextToParagraphHtml(text),
    };
  }
  return {
    headHtml: plainTextToParagraphHtml(text.slice(0, low)),
    tailHtml: plainTextToParagraphHtml(text.slice(low)),
  };
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

  const prepareRenderable = useMemoizedFn(
    async (
      module: any,
      sourceId: string,
      gs: any,
      showHeader: boolean,
      fragmentIndex: number,
      cache: Map<string, number>,
      useOriginalCache: boolean
    ): Promise<PreparedRenderable | null> => {
      const node = buildModuleElement(module, gs, sourceId, showHeader, fragmentIndex);
      if (!node) {
        return null;
      }

      let height: number | undefined;
      if (useOriginalCache) {
        const cached = moduleHeights.current[sourceId];
        if (cached > 0) {
          height = cached;
        }
      }

      if (height == null) {
        const signature = `${sourceId}|${showHeader ? '1' : '0'}|${layoutSig(
          { ...module, id: sourceId },
          gs
        )}`;
        if (cache.has(signature)) {
          height = cache.get(signature);
        } else {
          height = await measureElementHeight(node, gs);
          cache.set(signature, height);
        }
      }

      if (useOriginalCache && height != null) {
        moduleHeights.current[sourceId] = height;
      }

      if (height == null) {
        return null;
      }

      return {
        key: `${sourceId}-${fragmentIndex}-${showHeader ? '1' : '0'}`,
        sourceId,
        node,
        height,
      };
    }
  );

  const computeLayout = useMemoizedFn(
    async (
      ordered: Array<any>,
      cfg: any,
      gs: any,
      update: boolean = true,
      gen?: number
    ) => {
      const pageHeight = pageContentHeight(gs);
      const newPages: Array<Array<any>> = [[]];
      const pageModuleIds: Array<Array<string>> = [[]];
      const exportPages: Array<{ modules: ExportLayoutModule[] }> = [{ modules: [] }];
      const fragmentHeightCache = new Map<string, number>();
      let height = 0;
      let pageKey = 1;
      let hasSplitLayout = false;

      const pushToCurrentPage = (renderable: PreparedRenderable, gapBefore: number) => {
        const idx = newPages.length - 1;
        if (gapBefore > 0) {
          newPages[idx].push(
            <Margin
              key={`margin-before-${renderable.key}`}
              height={gapBefore}
            />
          );
          height += gapBefore;
        }
        newPages[idx].push(renderable.node);
        pageModuleIds[idx].push(renderable.sourceId);
        height += renderable.height;
      };

      const pushExportModule = (module: any, showHeader: boolean) => {
        const idx = exportPages.length - 1;
        exportPages[idx].modules.push({
          type: module.type,
          options: JSON.parse(JSON.stringify(module.options ?? {})),
          showHeader,
        });
      };

      const startNextPage = () => {
        newPages.push([]);
        pageModuleIds.push([]);
        exportPages.push({ modules: [] });
        height = 0;
      };

      const splitTextModule = async (
        module: any,
        sourceId: string,
        maxHeight: number,
        showHeader: boolean,
        fragmentIndex: number
      ) => {
        const description = String(module?.options?.description ?? '');
        if (!plainTextFromRichHtml(description)) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: null, didSplit: false };
        }

        let { headHtml, tailHtml } = await splitRichHtmlByHeight(description, async (candidateHtml) => {
          const candidate = {
            ...module,
            options: {
              ...module.options,
              description: candidateHtml,
            },
          };
          const prepared = await prepareRenderable(
            candidate,
            sourceId,
            gs,
            showHeader,
            fragmentIndex,
            fragmentHeightCache,
            false
          );
          return !!prepared && prepared.height <= maxHeight;
        });

        if (!plainTextFromRichHtml(headHtml)) {
          ({ headHtml, tailHtml } = await splitPlainTextFallbackByHeight(
            description,
            async (candidateHtml) => {
              const candidate = {
                ...module,
                options: {
                  ...module.options,
                  description: candidateHtml,
                },
              };
              const prepared = await prepareRenderable(
                candidate,
                sourceId,
                gs,
                showHeader,
                fragmentIndex,
                fragmentHeightCache,
                false
              );
              return !!prepared && prepared.height <= maxHeight;
            }
          ));
        }

        if (!plainTextFromRichHtml(headHtml)) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: module, didSplit: false };
        }

        const headModule = {
          ...module,
          options: {
            ...module.options,
            description: headHtml,
          },
        };
        const renderable = await prepareRenderable(
          headModule,
          sourceId,
          gs,
          showHeader,
          fragmentIndex,
          fragmentHeightCache,
          false
        );
        const remainder = plainTextFromRichHtml(tailHtml)
          ? {
              ...module,
              options: {
                ...module.options,
                description: tailHtml,
              },
            }
          : null;
        return { renderable, exportModule: headModule, remainder, didSplit: !!remainder };
      };

      const splitListModule = async (
        module: any,
        sourceId: string,
        maxHeight: number,
        showHeader: boolean,
        fragmentIndex: number
      ) => {
        const items = Array.isArray(module?.options?.items) ? module.options.items : [];
        if (!items.length) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: null, didSplit: false };
        }

        let low = 1;
        let high = items.length;
        let bestCount = 0;
        let bestRenderable: PreparedRenderable | null = null;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const candidate = {
            ...module,
            options: {
              ...module.options,
              items: items.slice(0, mid),
            },
          };
          const prepared = await prepareRenderable(
            candidate,
            sourceId,
            gs,
            showHeader,
            fragmentIndex,
            fragmentHeightCache,
            false
          );
          if (prepared && prepared.height <= maxHeight) {
            bestCount = mid;
            bestRenderable = prepared;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (bestCount > 0 && bestRenderable) {
          const remainderItems = items.slice(bestCount);
          return {
            renderable: bestRenderable,
            exportModule: {
              ...module,
              options: {
                ...module.options,
                items: items.slice(0, bestCount),
              },
            },
            remainder: remainderItems.length
              ? {
                  ...module,
                  options: {
                    ...module.options,
                    items: remainderItems,
                  },
                }
              : null,
            didSplit: remainderItems.length > 0,
          };
        }

        const descField = itemDescriptionField(module.type);
        if (!descField) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: module, didSplit: false };
        }

        const firstItem = items[0];
        const firstDesc = String(firstItem?.[descField] ?? '');
        if (!plainTextFromRichHtml(firstDesc)) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: module, didSplit: false };
        }

        const emptyHeadModule = {
          ...module,
          options: {
            ...module.options,
            items: [{
              ...firstItem,
              [descField]: '',
            }],
          },
        };
        const emptyHeadRenderable = await prepareRenderable(
          emptyHeadModule,
          sourceId,
          gs,
          showHeader,
          fragmentIndex,
          fragmentHeightCache,
          false
        );

        let { headHtml, tailHtml } = await splitRichHtmlByHeight(firstDesc, async (candidateHtml) => {
          const candidate = {
            ...module,
            options: {
              ...module.options,
              items: [{
                ...firstItem,
                [descField]: candidateHtml,
              }],
            },
          };
          const prepared = await prepareRenderable(
            candidate,
            sourceId,
            gs,
            showHeader,
            fragmentIndex,
            fragmentHeightCache,
            false
          );
          return !!prepared && prepared.height <= maxHeight;
        });

        if (!plainTextFromRichHtml(headHtml)) {
          ({ headHtml, tailHtml } = await splitPlainTextFallbackByHeight(
            firstDesc,
            async (candidateHtml) => {
              const candidate = {
                ...module,
                options: {
                  ...module.options,
                  items: [{
                    ...firstItem,
                    [descField]: candidateHtml,
                  }],
                },
              };
              const prepared = await prepareRenderable(
                candidate,
                sourceId,
                gs,
                showHeader,
                fragmentIndex,
                fragmentHeightCache,
                false
              );
              return !!prepared && prepared.height <= maxHeight;
            }
          ));
        }

        const headDescription = plainTextFromRichHtml(headHtml) ? headHtml : '';
        if (!headDescription && !(emptyHeadRenderable && emptyHeadRenderable.height <= maxHeight)) {
          return { renderable: null as PreparedRenderable | null, exportModule: null, remainder: module, didSplit: false };
        }

        const headModule = {
          ...module,
          options: {
            ...module.options,
            items: [{
              ...firstItem,
              [descField]: headDescription,
            }],
          },
        };
        const renderable = headDescription
          ? await prepareRenderable(
              headModule,
              sourceId,
              gs,
              showHeader,
              fragmentIndex,
              fragmentHeightCache,
              false
            )
          : emptyHeadRenderable;

        const remainderItems = [] as any[];
        if (plainTextFromRichHtml(tailHtml)) {
          remainderItems.push({
            ...firstItem,
            [descField]: tailHtml,
          });
        }
        remainderItems.push(...items.slice(1));

        return {
          renderable,
          exportModule: headModule,
          remainder: remainderItems.length
            ? {
                ...module,
                options: {
                  ...module.options,
                  items: remainderItems,
                },
              }
            : null,
          didSplit: true,
        };
      };

      for (const sourceModule of ordered) {
        if (!sourceModule) {
          continue;
        }

        let remainingModule = sourceModule;
        let fragmentIndex = 0;
        let showHeader = true;

        while (remainingModule) {
          if (gen != null && gen !== renderGenerationRef.current) {
            return;
          }

          const idx = newPages.length - 1;
          const gapBefore = newPages[idx].length !== 0 ? moduleGapPx(gs, cfg) : 0;
          const availableHeight = pageHeight - height - gapBefore;

          const fullRenderable = await prepareRenderable(
            remainingModule,
            sourceModule.id,
            gs,
            showHeader,
            fragmentIndex,
            fragmentHeightCache,
            remainingModule === sourceModule && fragmentIndex === 0 && showHeader
          );

          if (fullRenderable && fullRenderable.height <= availableHeight) {
            pushToCurrentPage(fullRenderable, gapBefore);
            pushExportModule(remainingModule, showHeader);
            break;
          }

          if (!canSplitModule(remainingModule)) {
            if (newPages[idx].length !== 0) {
              startNextPage();
              continue;
            }
            if (fullRenderable) {
              pushToCurrentPage(fullRenderable, 0);
              pushExportModule(remainingModule, showHeader);
            }
            break;
          }

          const splitResult = isTextFlowModule(remainingModule.type)
            ? await splitTextModule(
                remainingModule,
                sourceModule.id,
                availableHeight,
                showHeader,
                fragmentIndex
              )
            : isListFlowModule(remainingModule.type)
              ? await splitListModule(
                  remainingModule,
                  sourceModule.id,
                  availableHeight,
                  showHeader,
                  fragmentIndex
                )
                : { renderable: null as PreparedRenderable | null, exportModule: null, remainder: remainingModule, didSplit: false };

          if (!splitResult.renderable) {
            if (newPages[idx].length !== 0) {
              startNextPage();
              continue;
            }
            if (fullRenderable) {
              pushToCurrentPage(fullRenderable, 0);
              pushExportModule(remainingModule, showHeader);
            }
            break;
          }

          hasSplitLayout = hasSplitLayout || splitResult.didSplit;
          pushToCurrentPage(splitResult.renderable, gapBefore);
          pushExportModule(splitResult.exportModule ?? remainingModule, showHeader);
          remainingModule = splitResult.remainder;
          fragmentIndex += 1;
          showHeader = false;

          if (remainingModule) {
            startNextPage();
          }
        }
      }

      const allPages: Array<React.ReactNode> = [];

      pageKey = 1;
      for (const page of newPages) {
        const pageModules: Array<any> = [];
        for (const module of page) {
          pageModules.push(module);
        }
        allPages.push(
          <div key={pageKey++}>
            <Page {...gs}>{pageModules}</Page>
          </div>
        );
      }

      if (gen != null && gen !== renderGenerationRef.current) {
        return;
      }
      setPages(allPages);
      configStore.setExportPages(exportPages);

      if (hasSplitLayout) {
        return;
      }

      const live = configStore.getConfig ?? cfg; // 首屏 store 为空时用 cfg 写入侧栏
      if (!live) return;

      const nextConfig: any = {
        ...live,
        globalStyle: gs,
        pages: [],
      };
      for (let pageIndex = 0; pageIndex < newPages.length; pageIndex += 1) {
        const modulesOut: any[] = [];
        const seenIds = new Set<string>();
        for (const id of pageModuleIds[pageIndex]) {
          if (!id || seenIds.has(id)) continue;
          seenIds.add(id);
          const m = findModuleById(live, id);
          if (m) modulesOut.push(m);
        }
        nextConfig.pages.push({
          modules: modulesOut,
        });
      }
      if (update) {
        const snapshot = JSON.stringify(nextConfig);
        if (snapshot !== lastLayoutCommitRef.current) {
          lastLayoutCommitRef.current = snapshot;
          configStore.setConfig(nextConfig);
        }
      }
    }
  );

  const [pages, setPages] = useState<Array<React.ReactNode>>([]);
  const render = useMemoizedFn(async (cfg: any, update: boolean = true) => {
    const myGen = ++renderGenerationRef.current;
    const gs = mergeGlobalStyle(cfg);
    const ordered = flattenModules(cfg);

    const seen = new Set(ordered.map((m) => m.id));
    for (const id of Object.keys(moduleHeights.current)) {
      if (!seen.has(id)) {
        delete moduleHeights.current[id];
        delete measuredSigRef.current[id];
      }
    }

    const runLayout = () => {
      if (myGen !== renderGenerationRef.current) return;
      void computeLayout(ordered, cfg, gs, update, myGen);
    };

    const measureOne = async (module: any) => {
      const prepared = await prepareRenderable(
        module,
        module.id,
        gs,
        true,
        0,
        new Map<string, number>(),
        false
      );
      if (!prepared) return;
      const height = prepared.height;
      moduleHeights.current[module.id] = height;
      measuredSigRef.current[module.id] = layoutSig(module, gs);
    };

    const anyKnownHeight = ordered.some(
      (m) => (moduleHeights.current[m.id] ?? 0) > 0
    );

    const dirtyModules = ordered.filter((m) => {
      const sig = layoutSig(m, gs);
      return (
        measuredSigRef.current[m.id] !== sig ||
        (moduleHeights.current[m.id] ?? 0) <= 0
      );
    });

    // 从未测过高度的首屏：测完全部再分页
    if (!anyKnownHeight && ordered.length > 0) {
      await Promise.all(
        ordered.map(async (module) => {
          if (myGen !== renderGenerationRef.current) return;
          await measureOne(module);
        })
      );
      if (myGen !== renderGenerationRef.current) return;
      runLayout();
      return;
    }

    // 有缓存：必须先测完所有脏模块再排版。用旧高度抢先 setPages 会导致分页高度与真实 DOM 不一致（重叠），且会错误 setConfig。
    if (dirtyModules.length > 0) {
      await Promise.all(
        dirtyModules.map(async (module) => {
          if (myGen !== renderGenerationRef.current) return;
          await measureOne(module);
        })
      );
      if (myGen !== renderGenerationRef.current) return;
    }

    runLayout();
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

  return (
    <div
      ref={containerRef}
      className='flex h-full w-full min-h-0 flex-col items-center justify-start overflow-auto rounded-md'
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
    </div>
  );
}

export default memo(observer(Canvas));
