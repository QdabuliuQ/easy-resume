import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import { observer } from 'mobx-react';
import SectionModuleShell from '../layout/sectionModuleShell';
import RichDescriptionBody from '../shared/richDescriptionBody';

export interface OtherProps {
  id: string;
  type: 'other';
  options: {
    title: string;
    description: string;
  };
}

interface Props {
  config: OtherProps;
  globalStyle: GlobalStyle;
}

function Other(props: Props) {
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

export default memo(observer(Other));
