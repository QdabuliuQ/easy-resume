import ModuleOperation from '@/components/moduleOperation';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import { moduleActiveStore } from '@/mobx';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

interface ProjectProps {
  id: string;
  type: 'project';
  options: {
    title: string;
    items: Array<{
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
  const { id, options } = config;
  const { fontSize, lineHeight } = globalStyle;
  return (
    <ModuleOperation
      id={id}
      isActive={id === moduleActiveStore.getModuleActive}
    >
      <div id={id} className='w-full cursor-pointer'>
        <div className='w-full mb-[5px]'>
          <Header1 config={options} globalStyle={globalStyle} />
        </div>
        <div className='w-full'>
          {options.items.map((item, index) => (
            <div
              key={index}
              className='w-full text-[#333] not-last:mb-[10px]'
              style={{ fontSize: fontSize + 'px' }}
            >
              <div className='flex justify-between mb-[5px]'>
                <div className='flex-7 font-bold'>{item.name}</div>
                <div className='flex-3 text-right'>
                  {item.startDate} - {item.endDate}
                </div>
              </div>
              {item.role && (
                <div className='flex justify-between mb-[5px]'>
                  <div className='flex-6'>{item.role}</div>
                </div>
              )}
              <div className='w-full' style={{ lineHeight: lineHeight }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Project));
