import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import ModuleOperation from '@/components/moduleOperation';
import { moduleActiveStore } from '@/mobx';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

interface EducationProps {
  id: string;
  type: 'education';
  options: {
    title: string;
    items: Array<{
      school: string;
      degree: string;
      major: string;
      startDate: string;
      endDate: string;
      city: string;
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
  const { id, options } = config;
  const { fontSize, color } = globalStyle;

  return (
    <ModuleOperation
      id={id}
      isActive={id === moduleActiveStore.getModuleActive}
    >
      <div id={id} className='w-full cursor-pointer'>
        <div className='w-full mb-[5px]'>
          <Header1 config={options} globalStyle={globalStyle} />
        </div>
        <div className='w-full' style={{ fontSize: fontSize + 'px' }}>
          {options.items.map((item, index) => (
            <div key={index} className='w-full text-[#333] not-last:mb-[10px]'>
              <div className='flex justify-between mb-[5px]'>
                <div className='flex-7 flex items-center'>
                  <span className='font-bold'>{item.school}</span>
                  <div className='ml-[10px] flex items-center'>
                    {item.tags.map((tag, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: color,
                          color: '#fff',
                          fontSize: fontSize - 4 + 'px',
                        }}
                        className='not-last:mr-[5px] px-[5px] py-[2px] rounded-[5px]'
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
                <div className='flex-3 text-right'>
                  {item.startDate} - {item.endDate}
                </div>
              </div>
              {item.degree && (
                <div className='flex justify-between mb-[5px]'>
                  <div className='flex-7'>
                    {item.major} {item.degree} {item.academy}
                  </div>
                  <div className='flex-3 text-right'>{item.city}</div>
                </div>
              )}
              {item.description && (
                <div style={{ fontSize: fontSize + 'px' }}>
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Education));
