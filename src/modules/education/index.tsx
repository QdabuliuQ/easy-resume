import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
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
    <SectionModuleShell moduleId={id} headerConfig={options} globalStyle={globalStyle}>
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
                <div className='flex-3 text-right'>
                  {normalizeResumeCityDisplay(item.city)}
                </div>
              </div>
            )}
            {plainTextFromRichHtml(item.description) ? (
              <ResumeQuillHtml
                html={item.description}
                style={{ fontSize: fontSize + 'px', lineHeight }}
                className='text-[#333] [&_li]:my-0.5 [&_p]:my-1'
              />
            ) : null}
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Education));
