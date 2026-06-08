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
const toolbarDeleteButtonClass =
  'box-border flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-[color:color-mix(in_srgb,var(--panel-tone-rose)_22%,var(--float-btn-border))] bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_10%,var(--float-btn-bg))] text-[color:var(--module-op-delete-icon)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),var(--panel-shadow-icon-btn)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--panel-tone-rose)_34%,var(--float-btn-border-hover))] hover:bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_18%,var(--float-btn-bg-hover))] hover:text-[color:var(--module-op-delete-icon-hover)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),var(--panel-shadow-primary-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--panel-tone-rose)_54%,transparent)] active:translate-y-0 active:bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_24%,var(--float-btn-bg))]';

function findModuleRoot(host: HTMLElement, id: string): HTMLElement | null {
  return host.querySelector(
    `[${RESUME_MODULE_ID_ATTR}="${CSS.escape(id)}"]`,
  ) as HTMLElement | null;
}

function countModuleRoots(host: HTMLElement, id: string): number {
  return host.querySelectorAll(
    `[${RESUME_MODULE_ID_ATTR}="${CSS.escape(id)}"]`,
  ).length;
}

function afterReorder(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function resolveModuleIdFromItemId(itemId: string, moduleIds: string[]): string | null {
  let hit: string | null = null;
  for (const id of moduleIds) {
    if (itemId === id || itemId.startsWith(`${id}_`)) {
      if (!hit || id.length > hit.length) hit = id;
    }
  }
  return hit;
}

function focusPanelFieldByItemId(itemId: string) {
  const sel = `[data-panel-item-id="${CSS.escape(itemId)}"]`;
  const placeCaretToEnd = (el: HTMLElement) => {
    if (!el.isContentEditable) return;
    const selApi = window.getSelection();
    if (!selApi) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selApi.removeAllRanges();
    selApi.addRange(range);
  };
  const openAntdPopupIfNeeded = (holder: HTMLElement, target: HTMLElement) => {
    const root = target.closest('.ant-select,.ant-picker,.ant-cascader') as HTMLElement | null
      ?? holder.querySelector('.ant-select,.ant-picker,.ant-cascader');
    if (!root) return;
    const trigger =
      (root.querySelector('.ant-select-selector') as HTMLElement | null)
      ?? (root.querySelector('.ant-picker-input input') as HTMLElement | null)
      ?? (root.querySelector('.ant-select-selection-search-input') as HTMLElement | null)
      ?? (root.querySelector('input') as HTMLElement | null)
      ?? root;
    if (typeof trigger.focus === 'function') trigger.focus();
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    trigger.click();
  };

  const tryFocus = () => {
    const holder = document.querySelector(sel) as HTMLElement | null;
    if (!holder) return false;
    holder.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target =
      holder.matches('input,textarea,select,[contenteditable="true"]')
        ? holder
        : (holder.querySelector(
            'input,textarea,select,[contenteditable="true"],.ql-editor,.ant-select-selection-search-input',
          ) as HTMLElement | null) ?? holder;
    if (typeof target.focus === 'function') target.focus();
    if (target.classList.contains('ql-editor')) {
      holder.click();
      requestAnimationFrame(() => {
        if (typeof target.focus === 'function') target.focus();
        placeCaretToEnd(target);
      });
    }
    openAntdPopupIfNeeded(holder, target);
    if (!holder.matches('input,textarea') && target === holder) holder.click();
    return true;
  };

  if (tryFocus()) return;
  let retries = 30;
  const tick = () => {
    if (tryFocus() || retries <= 0) return;
    retries -= 1;
    window.setTimeout(tick, 80);
  };
  window.setTimeout(tick, 80);
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
}: {
  children: React.ReactNode;
  stageRef: RefObject<HTMLDivElement | null>;
  onModuleActivated?: () => void;
}) {
  const tm = useTranslations('Edit.moduleOperation');
  const { confirm, contextHolder } = useResponsiveConfirm();
  const { removeModuleFromConfig, reorderFlattenedModules } = useModuleHandle();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasScale = useCanvasScale();
  const activeId = moduleActiveStore.getModuleActive;
  const [toolbarBox, setToolbarBox] = useState<ToolbarBox>(HIDDEN_TOOLBAR);
  const [toolbarOpacity, setToolbarOpacity] = useState(0);
  const prevActiveIdRef = useRef(activeId);

  const orderedModules = useMemo(
    () => flattenModules(configStore.getConfig),
    [configStore.getConfig],
  );

  const activeModuleMeta = useMemo(() => {
    if (activeId === 'global') return null;
    const index = orderedModules.findIndex((m) => m.id === activeId);
    if (index < 0) return null;
    const mod = orderedModules[index];
    return {
      index,
      isFirst: index === 0,
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
      const el = findModuleRoot(host, id);
      if (!el) {
        setToolbarBox(HIDDEN_TOOLBAR);
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const s =
        canvasScale > 0 && Number.isFinite(canvasScale) ? canvasScale : 1;
      const pad = Number(configStore.mergedGlobalStyle.padding ?? 0);
      const splitBonus =
        countModuleRoots(host, id) > 1 ? pad * 2 + 20 : 0;
      setToolbarBox({
        top: (elRect.top - stageRect.top) / s,
        visible: true,
        motion: source === 'active' ? 'smooth' : 'snap',
        moduleHeight: elRect.height / s + splitBonus,
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
    afterReorder(() => {
      updateToolbarPos('active');
      scrollActiveModuleIntoView();
    });
  });

  const moveActive = useMemoizedFn((dir: -1 | 1) => {
    if (activeId === 'global') return;
    const idx = orderedModules.findIndex((m) => m.id === activeId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= orderedModules.length) return;
    reorderFlattenedModules(arrayMove(orderedModules, idx, next));
    refreshAfterModuleChange();
  });

  useLayoutEffect(() => {
    updateToolbarPos('active');
  }, [activeId, configStore.getConfig, updateToolbarPos]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;
    const ro = new ResizeObserver(() => updateToolbarPos('resize'));
    ro.observe(host);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [updateToolbarPos, stageRef]);

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
    const switching =
      hadModule && next !== 'global' && prev !== next;
    if (switching) scrollActiveModuleIntoView();
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
      const moduleId = resolveModuleIdFromItemId(
        itemId,
        orderedModules.map((m) => m.id),
      );
      if (moduleId) {
        moduleActiveStore.setModuleActive(moduleId);
        onModuleActivated?.();
        focusPanelFieldByItemId(itemId);
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
      {contextHolder}
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
              {!activeModuleMeta?.isLast ? (
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
                className={toolbarDeleteButtonClass}
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
