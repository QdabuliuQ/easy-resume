import { plainTextFromRichHtml, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

export interface EducationProps {
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
  const { fontSize, color, lineHeight } = globalStyle;

  return (
    <div
      id={id}
      {...{ [RESUME_MODULE_ID_ATTR]: id }}
      className='w-full cursor-pointer'
    >
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
            {plainTextFromRichHtml(item.description) ? (
              <div
                className='text-[#333] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5'
                style={{ fontSize: fontSize + 'px', lineHeight }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichTextHtml(item.description),
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(observer(Education));
