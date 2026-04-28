import ModuleOperation from '@/components/moduleOperation';
import { plainTextFromRichHtml, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import { moduleActiveStore } from '@/mobx';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

export interface JobProps {
  id: string;
  type: 'job';
  options: {
    title: string;
    items: Array<{
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
                <div className='flex-5 font-bold'>{item.company}</div>
                <div className='flex-5 text-right'>
                  {item.startDate} - {item.endDate}
                </div>
              </div>
              {(item.post || item.department || item.city) && (
                <div className='flex justify-between mb-[5px]'>
                  <div className='flex-6'>
                    {item.post}
                    {item.post ? ' ' : ''}
                    {item.department}
                  </div>
                  <div className='flex-2 text-right'>{item.city}</div>
                </div>
              )}
              {plainTextFromRichHtml(item.description) ? (
                <div
                  className='w-full text-[#333] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5'
                  style={{ lineHeight: lineHeight }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichTextHtml(item.description),
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Job));
