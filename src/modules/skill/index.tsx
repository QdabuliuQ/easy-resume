import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import { observer } from 'mobx-react';
import SectionModuleShell from '../layout/sectionModuleShell';
import RichDescriptionBody from '../shared/richDescriptionBody';

export interface SkillProps {
  id: string;
  type: 'skill';
  options: {
    title: string;
    description: string;
  };
}

interface Props {
  config: SkillProps;
  globalStyle: GlobalStyle;
}

function Skill(props: Props) {
  if (!props.config) {
    return null;
  }
  const { config, globalStyle } = props;
  const { id, options } = config;
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <RichDescriptionBody
        description={options.description}
        globalStyle={globalStyle}
        selectable
        dataItemId={`${id}_description`}
      />
    </SectionModuleShell>
  );
}

export default memo(observer(Skill));
