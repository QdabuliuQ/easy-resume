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
      id: string;
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
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as EducationProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '教育经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  const { fontSize, color, lineHeight } = globalStyle;

  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <div className='min-w-0 w-full' style={{ fontSize: fontSize + 'px' }}>
        {options.items.map((item, index) => (
          <div key={index} className='min-w-0 w-full text-[#333] not-last:mb-[10px]'>
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='flex min-w-0 flex-[7] flex-wrap items-center gap-x-[10px] gap-y-1'>
                <span className='min-w-0 font-bold break-words'>{item.school}</span>
                <div className='flex shrink-0 flex-wrap items-center'>
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
              <div className='shrink-0 text-right whitespace-nowrap'>
                {item.startDate} - {item.endDate}
              </div>
            </div>
            {item.degree && (
              <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
                <div className='min-w-0 flex-[7] break-words'>
                  {item.major} {item.degree} {item.academy}
                </div>
                <div className='shrink-0 text-right'>
                  {normalizeResumeCityDisplay(item.city)}
                </div>
              </div>
            )}
            {plainTextFromRichHtml(item.description) ? (
              <ResumeQuillHtml
                html={item.description}
                style={{ fontSize: fontSize + 'px', lineHeight }}
                className='text-[#333]'
              />
            ) : null}
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Education));
