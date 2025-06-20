import ModuleOperation from '@/components/moduleOperation';
import { moduleActiveStore } from '@/mobx';
import { memo, useMemo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import Header1 from '../header/header1';
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

  const moduleActive = useMemo(
    () => moduleActiveStore.getModuleActive,
    [moduleActiveStore.getModuleActive]
  );

  return (
    <ModuleOperation
      id={id}
      isActive={id === moduleActive}
      deleteModule={() => {}}
      clickModule={() => {}}
    >
      <div id={id} className='w-full cursor-pointer'>
        <div className='w-full mb-[5px]'>
          <Header1 config={options} globalStyle={globalStyle} />
        </div>
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
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Certificate));
