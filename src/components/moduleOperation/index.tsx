'use client';
import { ArrowCircleUp, DeleteOne } from '@icon-park/react';
import { arrayMove } from '@dnd-kit/sortable';
import { useMemoizedFn } from 'ahooks';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useModuleHandle } from '@/hooks/module';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType } from '@/modules/utils/constant';
import { flattenModules } from '@/utils/resumePages';
import {
  findVerticalScrollParent,
  scrollElementIntoScrollParent,
} from '@/utils/scrollIntoScrollParent';
import { useCanvasScale } from '@/views/edit/components/canvas/canvasScaleContext';
import { useOptionalInlineFieldEdit } from '@/components/inlineFieldPopover/InlineFieldEditProvider';
import {
  parseItemTargetFromItemId,
} from '@/lib/inlineFieldEdit/parseItemTarget';
import {
  focusPanelByParsedTarget,
} from '@/lib/inlineFieldEdit/focusPanelField';
import { PAGE_STACK_GAP_PX } from '@/views/edit/components/canvas/pageStackGap';
import bracketStyles from './bracket.module.css';
import { RESUME_MODULE_ID_ATTR } from './constants';

const TOOLBAR_LEFT_PX = -67;
const BRACKET_W_PX = 6;

const toolbarShellClass =
  'flex shrink-0 flex-col gap-1.5 rounded-[18px] border border-[color:var(--editor-shell-border)] bg-[color:var(--editor-shell-panel-strong)] p-1.5 shadow-[var(--panel-shadow-lg)] backdrop-blur-xl';
const toolbarBadgeClass =
  'mb-0.5 flex h-6 min-w-0 items-center justify-center rounded-[10px] border border-[color:color-mix(in_srgb,var(--color-primary)_24%,var(--editor-shell-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,var(--overlay-panel-bg))] px-2 text-[11px] font-semibold tracking-[0.18em] text-[color:var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
const toolbarButtonClass =
  'box-border flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06),rgb(var(--panel-surface-rgb)/0.025))] text-[color:var(--module-op-icon)] shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--color-primary)_36%,rgb(var(--panel-surface-rgb)/0.12))] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,rgb(var(--panel-surface-rgb)/0.03))] hover:text-[var(--color-primary)] hover:shadow-[var(--panel-shadow-hover-btn)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] active:translate-y-0';
function findModuleRoot(host: HTMLElement, id: string): HTMLElement | null {
  return host.querySelector(
    `[${RESUME_MODULE_ID_ATTR}="${CSS.escape(id)}"]`,
  ) as HTMLElement | null;
}

function findModuleRoots(host: HTMLElement, id: string): HTMLElement[] {
  return Array.from(
    host.querySelectorAll(`[${RESUME_MODULE_ID_ATTR}="${CSS.escape(id)}"]`),
  ) as HTMLElement[];
}

/** 槽位节点：续页时模块外包一层 translateY */
function moduleSlotEl(root: HTMLElement): HTMLElement {
  const p = root.parentElement;
  if (!p) return root;
  if (p.style.transform.includes('translateY')) return p.parentElement ?? p;
  return p;
}

function afterReorder(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

type ToolbarBox = {
  top: number;
  visible: boolean;
  motion: 'smooth' | 'snap';
  moduleHeight: number;
};

const HIDDEN_TOOLBAR: ToolbarBox = {
  top: 0,
  visible: false,
  motion: 'smooth',
  moduleHeight: 0,
};

function ModuleOperation({
  children,
  stageRef,
  onModuleActivated,
  fieldEditMode = 'panel',
}: {
  children: React.ReactNode;
  stageRef: RefObject<HTMLDivElement | null>;
  onModuleActivated?: () => void;
  /** panel=简历编辑菜单：聚焦右侧面板；inline=其他菜单：canvas 就地编辑 */
  fieldEditMode?: 'panel' | 'inline';
}) {
  const tm = useTranslations('Edit.moduleOperation');
  const inlineFieldEdit = useOptionalInlineFieldEdit();
  const { confirm } = useResponsiveConfirm();
  const { removeModuleFromConfig, reorderFlattenedModules } = useModuleHandle();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasScale = useCanvasScale();
  const activeId = moduleActiveStore.getModuleActive;
  const [toolbarBox, setToolbarBox] = useState<ToolbarBox>(HIDDEN_TOOLBAR);
  const [toolbarOpacity, setToolbarOpacity] = useState(0);
  const prevActiveIdRef = useRef(activeId);
  const refreshTimersRef = useRef<number[]>([]);

  const orderedModules = useMemo(
    () => flattenModules(configStore.getConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configStore.getConfig],
  );

  const activeModuleMeta = useMemo(() => {
    if (activeId === 'global') return null;
    const index = orderedModules.findIndex((m) => m.id === activeId);
    if (index < 0) return null;
    const mod = orderedModules[index];
    const hasPinnedInfo1 = orderedModules[0]?.type === 'info1';
    const isFirstNonInfo1 = hasPinnedInfo1 && mod.type !== 'info1' && index === 1;
    return {
      index,
      type: mod.type,
      isFirst: index === 0 || isFirstNonInfo1,
      isLast: index === orderedModules.length - 1,
      label:
        (moduleType as Record<string, { name: string }>)[mod.type]?.name ??
        mod.type,
    };
  }, [activeId, orderedModules]);

  const updateToolbarPos = useMemoizedFn(
    (source: 'active' | 'scroll' | 'resize' = 'active') => {
      const id = moduleActiveStore.getModuleActive;
      const host = hostRef.current;
      const stage = stageRef.current;
      if (!host || !stage || id === 'global') {
        setToolbarBox(HIDDEN_TOOLBAR);
        return;
      }
      const roots = findModuleRoots(host, id);
      if (!roots.length) {
        setToolbarBox(HIDDEN_TOOLBAR);
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const firstSlot = moduleSlotEl(roots[0]).getBoundingClientRect();
      const lastSlot = moduleSlotEl(roots[roots.length - 1]).getBoundingClientRect();
      const s =
        canvasScale > 0 && Number.isFinite(canvasScale) ? canvasScale : 1;
      const next: ToolbarBox = {
        top: (firstSlot.top - stageRect.top) / s,
        visible: true,
        motion: source === 'active' ? 'smooth' : 'snap',
        moduleHeight: Math.max(0, (lastSlot.bottom - firstSlot.top) / s),
      };
      setToolbarBox((prev) => {
        const samePos =
          prev.visible === next.visible &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.moduleHeight - next.moduleHeight) < 0.5;
        if (samePos) {
          // 位置没变时，别把进行中的 smooth 降成 snap（会掐掉滑动）
          if (prev.motion === 'smooth' && next.motion === 'snap') return prev;
          if (prev.motion === next.motion) return prev;
        }
        return next;
      });
    },
  );

  const scrollActiveModuleIntoView = useMemoizedFn(() => {
    const id = moduleActiveStore.getModuleActive;
    const host = hostRef.current;
    if (!host || id === 'global') return;
    const el = findModuleRoot(host, id);
    if (!el) return;
    afterReorder(() => scrollElementIntoScrollParent(el, 'smooth'));
  });

  const refreshAfterModuleChange = useMemoizedFn(() => {
    // canvas 分页 debounce≈100ms + 量高帧；双 rAF 时常仍是旧 DOM
    for (const t of refreshTimersRef.current) window.clearTimeout(t);
    refreshTimersRef.current = [];
    afterReorder(() => {
      updateToolbarPos('active');
      scrollActiveModuleIntoView();
    });
    refreshTimersRef.current.push(
      window.setTimeout(() => {
        updateToolbarPos('active');
        scrollActiveModuleIntoView();
      }, 160),
      window.setTimeout(() => updateToolbarPos('active'), 280),
    );
  });

  useEffect(() => {
    return () => {
      for (const t of refreshTimersRef.current) window.clearTimeout(t);
      refreshTimersRef.current = [];
    };
  }, []);

  const moveActive = useMemoizedFn((dir: -1 | 1) => {
    if (activeId === 'global') return;
    const idx = orderedModules.findIndex((m) => m.id === activeId);
    const activeModule = idx >= 0 ? orderedModules[idx] : null;
    if (activeModule?.type === 'info1' && dir === 1) return;
    if (dir === -1 && idx > 0 && orderedModules[idx - 1]?.type === 'info1') return;
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= orderedModules.length) return;
    reorderFlattenedModules(arrayMove(orderedModules, idx, next));
    refreshAfterModuleChange();
  });

  useLayoutEffect(() => {
    updateToolbarPos('active');
  }, [activeId, updateToolbarPos]);

  // 当模块顺序变化但 activeId 不变时，仍需重算工具条位置。
  useLayoutEffect(() => {
    updateToolbarPos('active');
  }, [orderedModules, updateToolbarPos]);

  // 分页后 children 更新：用 active 走 transform 滑动，勿用 resize 瞬切
  useLayoutEffect(() => {
    if (activeId === 'global') return;
    updateToolbarPos('active');
  }, [children, activeId, updateToolbarPos]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;
    const ro = new ResizeObserver(() => updateToolbarPos('resize'));
    ro.observe(host);
    ro.observe(stage);
    // 页高固定时，删子项只缩模块不缩 page；必须观察当前模块槽位
    if (activeId !== 'global') {
      for (const root of findModuleRoots(host, activeId)) {
        ro.observe(moduleSlotEl(root));
        if (root !== moduleSlotEl(root)) ro.observe(root);
      }
    }
    return () => ro.disconnect();
  }, [activeId, updateToolbarPos, stageRef, orderedModules]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const sp = findVerticalScrollParent(host);
    if (!sp) return;
    const onScroll = () => updateToolbarPos('scroll');
    sp.addEventListener('scroll', onScroll, { passive: true });
    return () => sp.removeEventListener('scroll', onScroll);
  }, [updateToolbarPos]);

  useEffect(() => {
    const prev = prevActiveIdRef.current;
    const next = activeId;
    const hadModule = prev !== 'global';
    if (next !== 'global' && prev !== next) scrollActiveModuleIntoView();
    if (next === 'global') setToolbarOpacity(0);
    else if (!hadModule) {
      setToolbarOpacity(0);
      afterReorder(() => setToolbarOpacity(1));
    } else setToolbarOpacity(1);
    prevActiveIdRef.current = next;
  }, [activeId, scrollActiveModuleIntoView]);

  const hostClick = useMemoizedFn((e: React.MouseEvent) => {
    const itemNode = (e.target as HTMLElement).closest('[data-item-id]');
    const itemId = itemNode?.getAttribute('data-item-id')?.trim();
    if (itemId) {
      const parsed = parseItemTargetFromItemId(
        itemId,
        orderedModules.map((m) => m.id),
      );
      if (parsed) {
        moduleActiveStore.setModuleActive(parsed.moduleId);
        if (fieldEditMode === 'panel') {
          onModuleActivated?.();
          inlineFieldEdit?.close();
          requestAnimationFrame(() => focusPanelByParsedTarget(itemId, parsed));
        } else if (itemNode instanceof HTMLElement && inlineFieldEdit) {
          e.stopPropagation();
          inlineFieldEdit.open({ itemId, anchorEl: itemNode });
        }
      }
      return;
    }
    const t = (e.target as HTMLElement).closest(`[${RESUME_MODULE_ID_ATTR}]`);
    const id = t?.getAttribute(RESUME_MODULE_ID_ATTR);
    if (!id) return;
    if (activeId === id) {
      moduleActiveStore.setModuleActive('global');
      return;
    }
    moduleActiveStore.setModuleActive(id);
    onModuleActivated?.();
  });

  const deleteHandle = useMemoizedFn(() => {
    const delId = activeId;
    if (delId === 'global') return;
    moduleActiveStore.setModuleActive('global');
    removeModuleFromConfig(delId);
  });

  const showToolbar = activeId !== 'global' && toolbarBox.visible;

  return (
    <>
      {showToolbar ? (
        <div
          style={{
            top: 0,
            left: TOOLBAR_LEFT_PX,
            transform: `translate3d(0, ${toolbarBox.top}px, 0)`,
            opacity: toolbarOpacity,
            transition:
              toolbarBox.motion === 'snap'
                ? 'opacity 220ms ease-out'
                : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-out',
            pointerEvents: toolbarOpacity > 0.02 ? 'auto' : 'none',
            willChange: toolbarBox.motion === 'smooth' ? 'transform' : 'auto',
          }}
          className='absolute z-10 flex items-start'
          data-resume-export-ignore
          aria-label={tm('toolbarAria')}
        >
          <div className='flex items-start'>
            <div
              className={toolbarShellClass}
              aria-label={
                activeModuleMeta
                  ? tm('currentModule', { label: activeModuleMeta.label })
                  : tm('currentModuleFallback')
              }
              title={activeModuleMeta?.label}
            >
              {activeModuleMeta ? (
                <div className={toolbarBadgeClass}>
                  {String(activeModuleMeta.index + 1).padStart(2, '0')}
                </div>
              ) : null}
              {!activeModuleMeta?.isFirst ? (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    moveActive(-1);
                  }}
                  className={toolbarButtonClass}
                  aria-label={tm('moveUpAria')}
                >
                  <ArrowCircleUp theme='outline' size='17' fill='currentColor' />
                </button>
              ) : null}
              {!activeModuleMeta?.isLast && activeModuleMeta?.type !== 'info1' ? (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    moveActive(1);
                  }}
                  className={toolbarButtonClass}
                  aria-label={tm('moveDownAria')}
                >
                  <ArrowCircleUp
                    className='rotate-180'
                    theme='outline'
                    size='17'
                    fill='currentColor'
                  />
                </button>
              ) : null}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  confirm({
                    title: tm('deleteModuleTitle'),
                    content: tm('deleteModuleContent'),
                    okText: tm('deleteOk'),
                    cancelText: tm('cancel'),
                    danger: true,
                    onOk: deleteHandle,
                  });
                }}
                className='module-op-delete-btn'
                aria-label={tm('deleteAria')}
              >
                <DeleteOne theme='outline' size='17' fill='currentColor' />
              </button>
            </div>
            {toolbarBox.moduleHeight > 0 ? (
              <span
                aria-hidden
                className={bracketStyles.bracket}
                style={{
                  width: BRACKET_W_PX,
                  height: toolbarBox.moduleHeight,
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        ref={(node) => {
          hostRef.current = node;
        }}
        data-resume-canvas-snap
        className='relative flex w-full flex-col'
        style={{ gap: PAGE_STACK_GAP_PX }}
        onClick={hostClick}
        role='presentation'
      >
        {children}
      </div>
    </>
  );
}

export default memo(observer(ModuleOperation));