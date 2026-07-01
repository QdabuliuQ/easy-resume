'use client';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import photo4 from '@/assets/brand/photo4.png';
import photo4Light from '@/assets/brand/photo4_light.png';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
} from '@/lib/themeStore';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType } from '@/modules/utils/constant';
import { flattenModules } from '@/utils/resumePages';
import { scrollElementIntoScrollParent } from '@/utils/scrollIntoScrollParent';
import Global from '../global';
import LazyModulePanel from './lazyModulePanel';

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
  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];
  const config = configStore.getConfig;
  const activeId = moduleActiveStore.getModuleActive;
  const sectionRef = useRef<HTMLElement | null>(null);
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

  const activeModule = useMemo(
    () => moduleEntries.find((mod) => mod.id === activeId) ?? null,
    [moduleEntries, activeId],
  );

  useLayoutEffect(() => {
    if (activeId === 'global' || !activeId) return;
    const scrollSection = () => {
      const el = sectionRef.current;
      if (!el) return false;
      scrollElementIntoScrollParent(el, 'smooth', { align: 'start' });
      return true;
    };
    requestAnimationFrame(() => {
      if (scrollSection()) return;
      let retries = 20;
      const tick = () => {
        if (scrollSection() || retries <= 0) return;
        retries -= 1;
        window.setTimeout(tick, 80);
      };
      window.setTimeout(tick, 80);
    });
  }, [activeId]);

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
        data-edit-tour='module-nav'
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
                onClick={() => {
                  moduleActiveStore.setModuleActive(selected ? 'global' : mod.id);
                }}
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

      {activeModule ? (
        <section
          key={activeModule.id}
          ref={sectionRef}
          data-panel-module-id={activeModule.id}
        >
          <LazyModulePanel type={activeModule.type} moduleId={activeModule.id} />
        </section>
      ) : (
        <div className='overflow-hidden rounded-[20px]'>
          <Image
            src={appTheme === 'dark' ? photo4 : photo4Light}
            alt={tm('selectModuleHint')}
            width={1915}
            height={821}
            className='h-auto w-full'
            sizes='(max-width: 768px) 100vw, 410px'
            priority
          />
        </div>
      )}
    </div>
  );
}

export default memo(observer(ModuleEdit));
