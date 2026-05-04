import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import { plainTextFromRichHtml, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

export interface ProjectProps {
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
  );
}

export default memo(observer(Project));
