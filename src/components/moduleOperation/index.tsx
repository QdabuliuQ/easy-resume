import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ArrowCircleUp, DeleteOne } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
import { Modal } from 'antd';
import { configStore, moduleActiveStore } from '@/mobx';
import { observer } from 'mobx-react';
import { cssLengthToApproxPx } from '@/utils/cssLength';
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

function ModuleOperation(props: { children: React.ReactNode }) {
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
      const moduleHeight = elRect.height / s;
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
    const config = configStore.getConfig;
    const ordered = flattenModules(config);
    if (!ordered.length || activeId === 'global') {
      setIsFirst(false);
      setIsLast(false);
      return;
    }
    setIsFirst(activeId === ordered[0].id);
    setIsLast(activeId === ordered[ordered.length - 1].id);
  }, [activeId, configStore.getConfig]);

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
              left: 0,
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
            aria-label='模块操作'
          >
            <div className='flex shrink-0 flex-col overflow-hidden rounded-bl-[6px] rounded-tl-[6px]'>
              {!isFirst && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    upHandle();
                  }}
                  className='bg-gradient-primary box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center border-b border-white/10 text-white transition-[filter] hover:brightness-110'
                  aria-label='上移'
                >
                  <ArrowCircleUp theme='outline' size='17' fill='#fff' />
                </button>
              )}
              {!isLast && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    downHandle();
                  }}
                  className='bg-gradient-primary box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center border-b border-white/10 text-white transition-[filter] hover:brightness-110'
                  aria-label='下移'
                >
                  <ArrowCircleUp
                    className='rotate-180'
                    theme='outline'
                    size='17'
                    fill='#fff'
                  />
                </button>
              )}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  modal.confirm({
                    title: '删除模块',
                    content: '确定删除该模块吗？删除后不可恢复。',
                    okText: '删除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    centered: true,
                    onOk: () => deleteHandle(),
                  });
                }}
                className='box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center bg-red-400 text-white hover:bg-red-500'
                aria-label='删除'
              >
                <DeleteOne theme='outline' size='17' fill='#fff' />
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
        ) : null}
        {props.children}
      </div>
    </>
  );
}

export default memo(observer(ModuleOperation));
