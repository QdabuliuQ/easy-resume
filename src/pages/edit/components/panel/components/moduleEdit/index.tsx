import { memo, useLayoutEffect, useRef, type ComponentType } from 'react';
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

type ModulePanel = ComponentType<{ moduleId?: string }>;

const panelByType: Record<string, ModulePanel> = {
  info1: Info1,
  certificate: Certificate,
  skill: Skill,
  job: Job,
  project: Project,
  education: Education,
};

const panelHasOwnTitle = new Set([
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
]);

/** 滚入视区时与滚动容器顶部的间距（配合 scrollIntoView，用 CSS scroll-margin） */
const SCROLL_INTO_VIEW_MARGIN_TOP = 10;

function ModuleEdit() {
  const config = configStore.getConfig;
  const activeId = moduleActiveStore.getModuleActive;
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useLayoutEffect(() => {
    if (activeId === 'global' || !activeId) return;
    const el = sectionRefs.current.get(activeId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeId]);

  if (!config?.pages?.length) {
    return <Global />;
  }

  const modulesFlat = flattenModules(config) as Array<{
    id: string;
    type: string;
  }>;

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-[20px]'>
        {modulesFlat.map((mod) => {
          const Panel = panelByType[mod.type];
          if (!Panel) {
            return null;
          }
          const label =
            (moduleType as Record<string, { name: string }>)[mod.type]?.name ??
            mod.type;
          return (
            <section
              key={mod.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(mod.id, el);
                else sectionRefs.current.delete(mod.id);
              }}
              className='border-b border-white/10 pb-[25px] last:border-0 last:pb-0'
              style={{ scrollMarginTop: SCROLL_INTO_VIEW_MARGIN_TOP }}
            >
              {!panelHasOwnTitle.has(mod.type) && (
                <h3 className='mb-4 text-[15px] font-medium text-white/90'>
                  {label}
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
