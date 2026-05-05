import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
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
    <div
      id={id}
      {...{ [RESUME_MODULE_ID_ATTR]: id }}
      className='w-full cursor-pointer'
    >
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
              <ResumeQuillHtml
                html={item.description}
                style={{ lineHeight: lineHeight }}
                className='text-[#333] [&_li]:my-0.5 [&_p]:my-1'
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(observer(Job));
