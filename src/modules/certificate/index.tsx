import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';

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
      <div className='min-w-0 w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='flex min-w-0 w-full justify-between gap-2 text-black not-last:mb-[5px]'
            style={{ fontSize: globalStyle.fontSize + 'px' }}
          >
            <div className='min-w-0 flex-[6] break-words'>{item.name}</div>
            <div className='shrink-0 text-right whitespace-nowrap'>{item.date}</div>
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Certificate));
