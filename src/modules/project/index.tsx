import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';
import ProjectItemsBody from './projectItemsBody';

export interface ProjectProps {
  id: string;
  type: 'project';
  options: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
  };
}

interface Props {
  config: ProjectProps;
  globalStyle: GlobalStyle;
}

function Project(props: Props) {
  if (!props.config) {
    return null;
  }
  const { config, globalStyle } = props;
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as ProjectProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '项目经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <ProjectItemsBody moduleId={id} items={options.items} globalStyle={globalStyle} selectable />
    </SectionModuleShell>
  );
}

export default memo(observer(Project));
