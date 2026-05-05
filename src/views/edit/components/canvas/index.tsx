import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useMemoizedFn } from 'ahooks';
import resume from '@/json/resume';

import { observer } from 'mobx-react';
import {
  Certificate,
  Info1,
  Job,
  Margin,
  Page,
  Project,
  Skill,
  Education,
} from '@/modules';
import { createRoot } from 'react-dom/client';
import { configStore } from '@/mobx';
import { getRandomId } from '@/utils';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { flattenModules, findModuleById } from '@/utils/resumePages';
import ModuleOperation from '@/components/moduleOperation';
import { CanvasScaleContext } from './canvasScaleContext';
import { PAGE_STACK_GAP_PX } from './pageStackGap';

/** 容器内左右留白，用于判断是否需缩小画布（缩放时两侧至少各 40） */
const CANVAS_SIDE_PAD = 40;

/** 合并默认 globalStyle，避免 cfg 里缺 padding/height 时分页可用高度算错 */
function mergeGlobalStyle(cfg: any) {
  return {
    ...resume.globalStyle,
    ...(cfg?.globalStyle ?? {}),
  };
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
  const outer = cssLengthToApproxPx(gs?.width ?? '210mm');
  return Math.max(1, outer - pad * 2);
}

/** 单页可容纳内容高度（与 Page 内 padding 算法一致） */
function pageContentHeight(gs: any): number {
  const pad = gs?.padding ?? 0;
  const outer = cssLengthToApproxPx(gs?.height ?? '297mm');
  return Math.max(0, outer - pad * 2);
}

/** 影响高度的字段变化才应触发重测；附带版心宽高与正文排版（换行、分页） */
function layoutSig(module: any, gs: any): string {
  const pad = gs?.padding ?? 0;
  const fs = gs?.fontSize ?? '';
  const lh = gs?.lineHeight ?? '';
  return `${JSON.stringify(module)}|w:${gs.width}|h:${gs.height}|pad:${pad}|fs:${fs}|lh:${lh}`;
}

function moduleComponentForType(
  type: string
): React.ComponentType<any> | null {
  switch (type) {
    case 'info1':
      return Info1;
    case 'certificate':
      return Certificate;
    case 'skill':
      return Skill;
    case 'job':
      return Job;
    case 'project':
      return Project;
    case 'education':
      return Education;
    default:
      return null;
  }
}

function buildModuleElements(ordered: any[], gs: any): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (const module of ordered) {
    const C = moduleComponentForType(module.type);
    if (!C) continue;
    out.push(<C key={module.id} config={module} globalStyle={gs} />);
  }
  return out;
}

function Canvas() {
  const moduleHeights = useRef<{ [propName: string]: number }>({});
  /** 与 moduleHeights 对应，用于跳过未改动的模块测量 */
  const measuredSigRef = useRef<Record<string, string>>({});
  /** 避免分页结果与 store 一致时重复 setConfig 导致 effect 循环 */
  const lastLayoutCommitRef = useRef<string>('');
  /** 异步 render 交错完成时禁止旧任务 setConfig 覆盖侧栏已写入的数据 */
  const renderGenerationRef = useRef(0);

  const measureComponentHeight = useMemoizedFn(
    (Component: React.ComponentType<any>, props: any): Promise<Array<any>> => {
      return new Promise((resolve) => {
        // 创建一个隐藏的 div
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        container.style.height = 'auto';
        container.style.width = 'auto';
        document.body.appendChild(container);
        const gs =
          props.globalStyle ?? mergeGlobalStyle(configStore.getConfig);
        container.style.width = `${contentInnerWidth(gs)}px`;
        const stableKey = props?.config?.id ?? getRandomId();
        const module = <Component {...props} key={stableKey} />;

        // 渲染组件
        const root = createRoot(container);
        root.render(module);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const height = container.offsetHeight;
            root.unmount();
            document.body.removeChild(container);
            resolve([height, module]);
          });
        });
      });
    }
  );

  const computeLayout = useMemoizedFn(
    (
      components: Array<any>,
      cfg: any,
      gs: any,
      update: boolean = true,
      gen?: number
    ) => {
      const pageHeight = pageContentHeight(gs);
      const newPages: Array<Array<any>> = [[]];
      let height = 0;
      let pageKey = 1;

      for (const component of components) {
        if (!component) {
          continue;
        }

        const moduleHeight =
          moduleHeights.current[component.props.config.id] ?? 0;

        if (height + moduleHeight > pageHeight) {
          const idx = newPages.length - 1;
          if (newPages[idx].length === 0) {
            newPages[idx].push(component);
            height += moduleHeight;
          } else {
            height = moduleHeight;
            newPages.push([component]);
          }
        } else {
          const idx = newPages.length - 1;
          const gap = moduleGapPx(gs, cfg);
          if (newPages[idx].length !== 0) {
            newPages[idx].push(
              <Margin
                key={`margin-before-${component.props.config.id}`}
                height={gap}
              />
            );
            height += gap;
          }
          newPages[idx].push(component);
          height += moduleHeight;
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
      const live = configStore.getConfig ?? cfg; // 首屏 store 为空时用 cfg 写入侧栏
      if (!live) return;

      const nextConfig: any = {
        ...live,
        globalStyle: gs,
        pages: [],
      };
      let pi = 0;
      for (const page of newPages) {
        const modulesOut: any[] = [];
        for (const node of page) {
          const id = node?.props?.config?.id;
          if (!id) continue;
          const m = findModuleById(live, id);
          if (m) modulesOut.push(m);
        }
        nextConfig.pages.push({
          modules: modulesOut,
        });
        pi++;
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

    const runLayout = (nodes: React.ReactNode[]) => {
      if (myGen !== renderGenerationRef.current) return;
      computeLayout(nodes, cfg, gs, update, myGen);
    };

    const measureOne = async (module: any) => {
      const C = moduleComponentForType(module.type);
      if (!C) return;
      const props = { config: module, globalStyle: gs };
      const [height] = await measureComponentHeight(C, props);
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
      runLayout(buildModuleElements(ordered, gs));
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

    runLayout(buildModuleElements(ordered, gs));
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
  const pageWPx = cssLengthToApproxPx(globalStyle.width);
  const pageHPx = cssLengthToApproxPx(globalStyle.height);
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
