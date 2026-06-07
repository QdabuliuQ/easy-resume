import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';
import JobItemsBody from './jobItemsBody';

export interface JobProps {
  id: string;
  type: 'job';
  options: {
    title: string;
    items: Array<{
      id: string;
      company: string;
      post: string;
      department: string;
      city: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
  };
}

interface Props {
  config: JobProps;
  globalStyle: GlobalStyle;
}

function Job(props: Props) {
  if (!props.config) {
    return null;
  }
  const { config, globalStyle } = props;
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as JobProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '工作经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <JobItemsBody moduleId={id} items={options.items} globalStyle={globalStyle} selectable />
    </SectionModuleShell>
  );
}

export default memo(observer(Job));
