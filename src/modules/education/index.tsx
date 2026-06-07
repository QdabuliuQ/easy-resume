import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';
import EducationItemsBody from './educationItemsBody';

export interface EducationProps {
  id: string;
  type: 'education';
  options: {
    title: string;
    items: Array<{
      id: string;
      school: string;
      degree: string;
      major: string;
      startDate: string;
      endDate: string;
      city: string | string[];
      tags: string[];
      academy: string;
      description: string;
    }>;
  };
}

interface Props {
  config: EducationProps;
  globalStyle: GlobalStyle;
}

function Education(props: Props) {
  const { config, globalStyle } = props;
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as EducationProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '教育经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <EducationItemsBody moduleId={id} items={options.items} globalStyle={globalStyle} selectable />
    </SectionModuleShell>
  );
}

export default memo(observer(Education));
