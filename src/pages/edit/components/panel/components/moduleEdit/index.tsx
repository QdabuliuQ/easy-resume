import { memo, type ComponentType } from 'react';
import { observer } from 'mobx-react';
import { configStore } from '@/mobx';
import { moduleType } from '@/modules/utils/constant';
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

function ModuleEdit() {
  const config = configStore.getConfig;
  if (!config?.pages?.length) {
    return <Global />;
  }

  return (
    <div className='flex flex-col gap-8'>
      {config.pages.map(
        (
          page: { modules: Array<{ id: string; type: string }> },
          pageIndex: number
        ) => (
          <div key={pageIndex} className='flex flex-col gap-[20px]'>
            {page.modules.map((mod: { id: string; type: string }) => {
              const Panel = panelByType[mod.type];
              if (!Panel) {
                return null;
              }
              const label =
                (moduleType as Record<string, { name: string }>)[mod.type]
                  ?.name ?? mod.type;
              return (
                <section
                  key={mod.id}
                  className='border-b border-white/10 pb-[25px] last:border-0 last:pb-0'
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
        )
      )}
    </div>
  );
}

export default memo(observer(ModuleEdit));
