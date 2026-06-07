import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';
import CertificateItemsBody from './certificateItemsBody';

export interface CertificateProps {
  id: string;
  type: 'certificate';
  options: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      date: string;
    }>;
  };
}

interface Props {
  config: CertificateProps;
  globalStyle: GlobalStyle;
}

function Certificate(props: Props) {
  const { config, globalStyle } = props;
  if (!config) {
    return null;
  }
  const { id, options } = config;

  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <CertificateItemsBody moduleId={id} items={options.items} globalStyle={globalStyle} selectable />
    </SectionModuleShell>
  );
}

export default memo(observer(Certificate));
