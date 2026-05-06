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
    <SectionModuleShell moduleId={id} headerConfig={options} globalStyle={globalStyle}>
      <div className='w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='w-full flex justify-between text-black not-last:mb-[5px]'
            style={{ fontSize: globalStyle.fontSize + 'px' }}
          >
            <div className='flex-6'>{item.name}</div>
            <div className='flex-4 text-right'>{item.date}</div>
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Certificate));
