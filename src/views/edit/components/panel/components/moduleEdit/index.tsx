'use client';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType } from '@/modules/utils/constant';
import { flattenModules } from '@/utils/resumePages';
import Global from '../global';
import Info1 from '../info1';
import Certificate from '../certificate';
import Skill from '../skill';
import Job from '../job';
import Project from '../project';
import Education from '../education';
import Other from '../other';

type ModulePanel = ComponentType<{ moduleId?: string }>;

const panelByType: Record<string, ModulePanel> = {
  info1: Info1,
  certificate: Certificate,
  skill: Skill,
  job: Job,
  project: Project,
  education: Education,
  other: Other,
};

const panelHasOwnTitle = new Set([
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
]);

/**
 * 滚入视区时与滚动容器顶部的间距。
 * 这里需要覆盖 sticky 模块导航本身的高度，否则跳转后模块顶部会被挡住。
 */
const SCROLL_INTO_VIEW_MARGIN_TOP = 77;
const PANEL_FOCUS_SELECTOR =
  'input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),[contenteditable="true"],.ql-editor,.ant-select-selection-search-input';

function focusFirstEditableInSection(section: HTMLElement): boolean {
  const target = section.querySelector(PANEL_FOCUS_SELECTOR) as HTMLElement | null;
  if (!target) return false;
  target.scrollIntoView({ behavior: 'instant', block: 'center' });
  target.focus();
  return true;
}

function scrollParentEl(el: HTMLElement | null): Element | null {
  let p: Element | null = el?.parentElement ?? null;
  while (p && p !== document.body) {
    const { overflowY, overflowX } = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflowX)) {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}
function ModuleEdit() {
  const tm = useTranslations('Edit.moduleEditPanel');
  const config = configStore.getConfig;
  const activeId = moduleActiveStore.getModuleActive;
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const navStickyRef = useRef<HTMLElement | null>(null);
  const [navStuck, setNavStuck] = useState(false);

  const modulesFlat = useMemo(
    () =>
      config?.pages?.length
        ? (flattenModules(config) as Array<{
            id: string;
            type: string;
          }>)
        : [],
    [config]
  );

  const moduleEntries = useMemo(
    () =>
      modulesFlat.map((mod, index) => ({
        ...mod,
        index,
        label:
          (moduleType as Record<string, { name: string }>)[mod.type]?.name ?? mod.type,
      })),
    [modulesFlat]
  );

  useLayoutEffect(() => {
    if (activeId === 'global' || !activeId) return;
    const el = sectionRefs.current.get(activeId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeId]);

  useEffect(() => {
    if (activeId === 'global' || !activeId) return;
    let retries = 60;
    let timer: number | null = null;

    const tick = () => {
      const section =
        sectionRefs.current.get(activeId)
        ?? (document.querySelector(
          `[data-panel-module-id="${CSS.escape(activeId)}"]`,
        ) as HTMLElement | null);
      if (section && focusFirstEditableInSection(section)) return;
      if (retries <= 0) return;
      retries -= 1;
      timer = window.setTimeout(tick, 80);
    };

    requestAnimationFrame(tick);

    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, [activeId, moduleEntries.length]);

  useEffect(() => {
    const sec = navStickyRef.current;
    if (!sec) return;
    const root = scrollParentEl(sec);
    const tick = () => {
      const sr = sec.getBoundingClientRect();
      if (root) {
        const rr = root.getBoundingClientRect();
        setNavStuck(sr.top <= rr.top + 0.5);
      } else {
        setNavStuck(sr.top <= 0.5);
      }
    };
    const target: Element | Window = root ?? window;
    target.addEventListener('scroll', tick, { passive: true });
    tick();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(tick) : null;
    ro?.observe(sec);
    if (root) ro?.observe(root);
    return () => {
      target.removeEventListener('scroll', tick);
      ro?.disconnect();
    };
  }, [config?.pages?.length, moduleEntries.length]);

  if (!config?.pages?.length) {
    return <Global />;
  }

  return (
    <div className='flex flex-col gap-5'>
      <section
        ref={navStickyRef}
        className={`sticky top-[-1px] z-[1] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.11),rgb(var(--panel-surface-rgb)/0.05))] px-4 pt-3 shadow-[var(--panel-shadow-lg)] backdrop-blur-md transition-[border-radius] duration-150 ${
          navStuck ? 'rounded-b-[20px] rounded-t-none' : 'rounded-[20px]'
        }`}
      >
        <div className='flex gap-2 overflow-x-auto pb-3.5'>
          {moduleEntries.map((mod) => {
            const selected = activeId === mod.id;
            return (
              <button
                key={mod.id}
                type='button'
                onClick={() => moduleActiveStore.setModuleActive(mod.id)}
                className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  selected
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white shadow-[0_8px_18px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]'
                    : 'border-fg/[0.14] bg-surface/[0.07] text-fg/62 hover:bg-surface/[0.12] hover:text-fg/92'
                }`}
              >
                <span className={`mr-1.5 ${selected ? 'text-white/90' : 'text-fg/58'}`}>{String(mod.index + 1).padStart(2, '0')}</span>
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className='flex flex-col gap-4'>
        {moduleEntries.map((mod) => {
          const Panel = panelByType[mod.type];
          if (!Panel) {
            return null;
          }
          const selected = activeId === mod.id;
          return (
            <section
              key={mod.id}
              data-panel-module-id={mod.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(mod.id, el);
                else sectionRefs.current.delete(mod.id);
              }}
              className={`rounded-[22px] border px-4 py-4 shadow-[var(--panel-shadow-card)] transition-colors ${
                selected
                  ? 'border-[color:color-mix(in_srgb,var(--color-primary)_62%,rgb(var(--panel-surface-rgb)/0.2))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_18%,transparent),rgb(var(--panel-surface-rgb)/0.08))] shadow-[0_16px_42px_rgb(249_114_77_/_0.14)]'
                  : 'border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.09),rgb(var(--panel-surface-rgb)/0.04))]'
              }`}
              style={{ scrollMarginTop: SCROLL_INTO_VIEW_MARGIN_TOP }}
            >
              <div className='mb-3 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='rounded-full border border-fg/[0.08] bg-[var(--panel-inset-bg)] px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] text-fg/62'>
                      {String(mod.index + 1).padStart(2, '0')}
                    </span>
                    <span className='truncate text-[12px] font-medium text-fg/62'>{mod.label}</span>
                  </div>
                </div>
                {selected ? (
                  <span className='shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--color-primary)]'>
                    {tm('currentEditing')}
                  </span>
                ) : null}
              </div>
              {!panelHasOwnTitle.has(mod.type) && (
                <h3 className='mb-4 text-[15px] font-medium text-fg/90'>
                  {mod.label}
                </h3>
              )}
              <Panel moduleId={mod.id} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default memo(observer(ModuleEdit));
