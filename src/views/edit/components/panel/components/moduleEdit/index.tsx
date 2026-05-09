import { memo, useLayoutEffect, useMemo, useRef, type ComponentType } from 'react';
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
const SCROLL_INTO_VIEW_MARGIN_TOP = 170;

function ModuleEdit() {
  const config = configStore.getConfig;
  const activeId = moduleActiveStore.getModuleActive;
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

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

  if (!config?.pages?.length) {
    return <Global />;
  }

  return (
    <div className='flex flex-col gap-5'>
      <section className='sticky top-0 z-[1] rounded-[20px] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.11),rgb(var(--panel-surface-rgb)/0.05))] px-4 py-3 shadow-[var(--panel-shadow-lg)] backdrop-blur-md'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium tracking-[0.18em] text-fg/62'>EDIT PANEL</p>
            <h2 className='mt-1 text-[17px] font-semibold text-fg/95'>模块配置</h2>
            <p className='mt-1 text-[12px] leading-relaxed text-fg/62'>按模块分段编辑内容；点击下方模块标签可快速跳转到对应配置区。</p>
          </div>
          <div className='shrink-0 rounded-full border border-fg/[0.14] bg-surface/[0.08] px-3 py-1 text-[11px] font-semibold text-fg/68'>
            {moduleEntries.length} 个模块
          </div>
        </div>
        <div className='mt-3 flex gap-2 overflow-x-auto pb-1'>
          {moduleEntries.map((mod) => {
            const selected = activeId === mod.id;
            return (
              <button
                key={mod.id}
                type='button'
                onClick={() => moduleActiveStore.setModuleActive(mod.id)}
                className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  selected
                    ? 'border-[color:color-mix(in_srgb,var(--color-primary)_72%,rgb(var(--panel-surface-rgb)/0.28))] bg-[color:color-mix(in_srgb,var(--color-primary)_28%,transparent)] text-[color:var(--color-primary)] shadow-[0_6px_18px_rgb(249_114_77_/_0.2)]'
                    : 'border-fg/[0.14] bg-surface/[0.07] text-fg/62 hover:bg-surface/[0.12] hover:text-fg/92'
                }`}
              >
                <span className={`mr-1.5 ${selected ? 'text-[var(--color-primary)]' : 'text-fg/58'}`}>{String(mod.index + 1).padStart(2, '0')}</span>
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
                    当前编辑
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
