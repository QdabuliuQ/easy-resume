'use client';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ArrowCircleUp, DeleteOne } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
import { Modal } from 'antd';
import { useTranslations } from 'next-intl';
import { configStore, moduleActiveStore } from '@/mobx';
import { observer } from 'mobx-react';
import { cssLengthToApproxPx } from '@/utils/cssLength';
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

function findModuleRoot(host: HTMLElement | null, id: string): HTMLElement | null {
  if (!host) return null;
  const nodes = host.querySelectorAll(`[${RESUME_MODULE_ID_ATTR}]`);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.getAttribute(RESUME_MODULE_ID_ATTR) === id) {
      return n as HTMLElement;
    }
  }
  return null;
}

function countModuleRoots(host: HTMLElement, id: string): number {
  const nodes = host.querySelectorAll(`[${RESUME_MODULE_ID_ATTR}]`);
  let n = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].getAttribute(RESUME_MODULE_ID_ATTR) === id) n++;
  }
  return n;
}

const toolbarShellClass =
  'flex shrink-0 flex-col gap-1.5 rounded-[18px] border border-[color:var(--editor-shell-border)] bg-[color:var(--editor-shell-panel-strong)] p-1.5 shadow-[var(--panel-shadow-lg)] backdrop-blur-xl';

const toolbarBadgeClass =
  'mb-0.5 flex h-6 min-w-0 items-center justify-center rounded-[10px] border border-[color:color-mix(in_srgb,var(--color-primary)_24%,var(--editor-shell-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,var(--overlay-panel-bg))] px-2 text-[11px] font-semibold tracking-[0.18em] text-[color:var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

const toolbarButtonClass =
  'box-border flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-[color:var(--float-btn-border)] bg-[color:var(--float-btn-bg)] text-[color:var(--module-op-icon)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),var(--panel-shadow-icon-btn)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:var(--float-btn-border-hover)] hover:bg-[color:var(--float-btn-bg-hover)] hover:text-[color:var(--module-op-icon-hover)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),var(--panel-shadow-hover-btn)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] active:translate-y-0 active:bg-[color:color-mix(in_srgb,var(--float-btn-bg-hover)_82%,var(--overlay-panel-bg))]';

const toolbarDeleteButtonClass =
  'box-border flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-[color:color-mix(in_srgb,var(--panel-tone-rose)_22%,var(--float-btn-border))] bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_10%,var(--float-btn-bg))] text-[color:var(--module-op-delete-icon)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),var(--panel-shadow-icon-btn)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--panel-tone-rose)_34%,var(--float-btn-border-hover))] hover:bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_18%,var(--float-btn-bg-hover))] hover:text-[color:var(--module-op-delete-icon-hover)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),var(--panel-shadow-primary-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--panel-tone-rose)_54%,transparent)] active:translate-y-0 active:bg-[color:color-mix(in_srgb,var(--panel-tone-rose)_24%,var(--float-btn-bg))]';

function ModuleOperation(props: { children: React.ReactNode }) {
  const tm = useTranslations('Edit.moduleOperation');
  const [modal, contextHolder] = Modal.useModal();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasScale = useCanvasScale();
  const activeId = moduleActiveStore.getModuleActive;

  const [toolbarBox, setToolbarBox] = useState<{
    top: number;
    left: number;
    visible: boolean;
    /** snap：滚动/缩放时每帧更新，关闭 transform 过渡；smooth：切换模块等单次更新 */
    motion: 'smooth' | 'snap';
    /** 选中模块在布局坐标系中的高度（用于「[」装饰条） */
    moduleHeight: number;
  }>({ top: 0, left: 0, visible: false, motion: 'smooth', moduleHeight: 0 });

  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);
  /** 工具条：未选中模块时为 0，选中后过渡到 1 */
  const [toolbarOpacity, setToolbarOpacity] = useState(0);
  const prevActiveIdRef = useRef(moduleActiveStore.getModuleActive);

  const orderedModules = useMemo(
    () => flattenModules(configStore.getConfig),
    [configStore.getConfig]
  );

  const activeModuleMeta = useMemo(() => {
    if (activeId === 'global') return null;
    const index = orderedModules.findIndex((mod) => mod.id === activeId);
    if (index < 0) return null;
    const mod = orderedModules[index];
    return {
      index,
      label:
        (moduleType as Record<string, { name: string }>)[mod.type]?.name ?? mod.type,
    };
  }, [activeId, orderedModules]);

  const toolbarLeftOffset =
    -(36 + (configStore.mergedGlobalStyle.padding ?? 0));

  const updateToolbarPos = useMemoizedFn(
    (source: 'active' | 'scroll' | 'resize' = 'active') => {
      const id = moduleActiveStore.getModuleActive;
      const host = hostRef.current;
      if (!host || id === 'global') {
        setToolbarBox((b) => ({
          ...b,
          visible: false,
          moduleHeight: 0,
        }));
        return;
      }
      const el = findModuleRoot(host, id);
      if (!el) {
        setToolbarBox((b) => ({
          ...b,
          visible: false,
          moduleHeight: 0,
        }));
        return;
      }
      const hostRect = host.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      /** 画布 `scale()` 下视口差值要除以 scale 才等于相对 host 的布局坐标 */
      const s =
        canvasScale > 0 && Number.isFinite(canvasScale) ? canvasScale : 1;
      const top = (elRect.top - hostRect.top) / s;
      const left = (elRect.left - hostRect.left) / s + toolbarLeftOffset;
      const pad = Number(configStore.mergedGlobalStyle.padding ?? 0);
      const splitBonus =
        countModuleRoots(host, id) > 1 ? pad * 2 + 20 : 0;
      const moduleHeight = elRect.height / s + splitBonus;
      const motion = source === 'active' ? 'smooth' : 'snap';
      setToolbarBox({
        top,
        left,
        visible: true,
        motion,
        moduleHeight,
      });
    }
  );

  const scrollActiveModuleIntoView = useMemoizedFn(() => {
    const id = moduleActiveStore.getModuleActive;
    if (id === 'global') return;
    const el = findModuleRoot(hostRef.current, id);
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollElementIntoScrollParent(el, 'smooth');
      });
    });
  });

  useLayoutEffect(() => {
    updateToolbarPos('active');
  }, [activeId, configStore.getConfig, updateToolbarPos]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => updateToolbarPos('resize'));
    ro.observe(host);
    return () => ro.disconnect();
  }, [updateToolbarPos]);

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
    if (!orderedModules.length || activeId === 'global') {
      setIsFirst(false);
      setIsLast(false);
      return;
    }
    setIsFirst(activeId === orderedModules[0].id);
    setIsLast(activeId === orderedModules[orderedModules.length - 1].id);
  }, [activeId, orderedModules]);

  useEffect(() => {
    const prev = prevActiveIdRef.current;
    const next = activeId;

    const hadModule = prev !== 'global';
    const switchingModule =
      hadModule && next !== 'global' && prev !== next;

    if (switchingModule) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollActiveModuleIntoView();
        });
      });
    }

    if (next === 'global') {
      setToolbarOpacity(0);
    } else if (!hadModule) {
      setToolbarOpacity(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setToolbarOpacity(1));
      });
    } else {
      setToolbarOpacity(1);
    }

    prevActiveIdRef.current = next;
  }, [activeId, scrollActiveModuleIntoView]);

  const hostClick = useMemoizedFn((e: React.MouseEvent) => {
    const t = (e.target as HTMLElement).closest(
      `[${RESUME_MODULE_ID_ATTR}]`
    );
    if (!t) return;
    const id = t.getAttribute(RESUME_MODULE_ID_ATTR);
    if (!id) return;
    moduleActiveStore.setModuleActive(
      moduleActiveStore.getModuleActive === id ? 'global' : id
    );
  });

  const deleteHandle = useMemoizedFn(() => {
    const delId = moduleActiveStore.getModuleActive;
    if (delId === 'global') return;
    moduleActiveStore.setModuleActive('global');
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const mod = config.pages[i].modules[j];
        if (mod.id === delId) {
          config.pages[i].modules.splice(j, 1);
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
      }
    }
  });

  const upHandle = useMemoizedFn(() => {
    const mid = moduleActiveStore.getModuleActive;
    if (mid === 'global') return;
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const mod = config.pages[i].modules[j];
        if (mod.id === mid) {
          const temp = config.pages[i].modules[j];
          if (j > 0) {
            config.pages[i].modules[j] = config.pages[i].modules[j - 1];
            config.pages[i].modules[j - 1] = temp;
          } else if (i > 0) {
            config.pages[i].modules[j] =
              config.pages[i - 1].modules[
              config.pages[i - 1].modules.length - 1
              ];
            config.pages[i - 1].modules[
              config.pages[i - 1].modules.length - 1
            ] = temp;
          }
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          requestAnimationFrame(() => {
            updateToolbarPos('active');
            scrollActiveModuleIntoView();
          });
          return;
        }
      }
    }
  });

  const downHandle = useMemoizedFn(() => {
    const mid = moduleActiveStore.getModuleActive;
    if (mid === 'global') return;
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const mod = config.pages[i].modules[j];
        if (mod.id === mid) {
          if (j < config.pages[i].modules.length - 1) {
            const temp = config.pages[i].modules[j];
            config.pages[i].modules[j] = config.pages[i].modules[j + 1];
            config.pages[i].modules[j + 1] = temp;
          } else if (
            i < config.pages.length - 1 &&
            config.pages[i + 1].modules.length > 0
          ) {
            const temp = config.pages[i].modules[j];
            config.pages[i].modules[j] = config.pages[i + 1].modules[0];
            config.pages[i + 1].modules[0] = temp;
          }
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          requestAnimationFrame(() => {
            updateToolbarPos('active');
            scrollActiveModuleIntoView();
          });
          return;
        }
      }
    }
  });

  const showToolbar = activeId !== 'global' && toolbarBox.visible;
  const bracketWidthPx =
    cssLengthToApproxPx(configStore.mergedGlobalStyle.padding ?? 0) / 2;

  return (
    <>
      {contextHolder}
      <div
        ref={hostRef}
        className='relative flex w-full flex-col'
        style={{ gap: PAGE_STACK_GAP_PX }}
        onClick={hostClick}
        role='presentation'
      >
        {showToolbar ? (
          <div
            style={{
              top: 0,
              left: -36,
              transform: `translate3d(${toolbarBox.left}px, ${toolbarBox.top}px, 0)`,
              opacity: toolbarOpacity,
              transition:
                toolbarBox.motion === 'snap'
                  ? 'opacity 220ms ease-out'
                  : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-out',
              pointerEvents: toolbarOpacity > 0.02 ? 'auto' : 'none',
              willChange: toolbarBox.motion === 'smooth' ? 'transform' : 'auto',
            }}
            className='absolute flex items-start'
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
                {!isFirst && (
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      upHandle();
                    }}
                    className={toolbarButtonClass}
                    aria-label={tm('moveUpAria')}
                  >
                    <ArrowCircleUp theme='outline' size='17' fill='currentColor' />
                  </button>
                )}
                {!isLast && (
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      downHandle();
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
                )}
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    modal.confirm({
                      title: tm('deleteModuleTitle'),
                      content: tm('deleteModuleContent'),
                      okText: tm('deleteOk'),
                      cancelText: tm('cancel'),
                      okButtonProps: { danger: true },
                      centered: true,
                      onOk: () => deleteHandle(),
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
                    height: toolbarBox.moduleHeight,
                    width: bracketWidthPx,
                  }}
                />
              ) : null}
            </div>
          </div>
        ) : null}
        {props.children}
      </div>
    </>
  );
}

export default memo(observer(ModuleOperation));
