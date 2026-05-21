import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';

export interface JobProps {
  id: string;
  type: 'job';
  options: {
    title: string;
    items: Array<{
      id: string;
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
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as JobProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '工作经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  const { fontSize, lineHeight } = globalStyle;
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <div className='min-w-0 w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='min-w-0 w-full text-[#333] not-last:mb-[10px]'
            style={{ fontSize: fontSize + 'px' }}
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='min-w-0 flex-[5] break-words font-bold'>{item.company}</div>
              <div className='shrink-0 text-right whitespace-nowrap'>
                {item.startDate} - {item.endDate}
              </div>
            </div>
            {(item.post || item.department || item.city) && (
              <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
                <div className='min-w-0 flex-[6] break-words'>
                  {item.post}
                  {item.post ? ' ' : ''}
                  {item.department}
                </div>
                <div className='shrink-0 text-right'>
                  {normalizeResumeCityDisplay(item.city)}
                </div>
              </div>
            )}
            {plainTextFromRichHtml(item.description) ? (
              <ResumeQuillHtml
                html={item.description}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
                className='text-[#333]'
              />
            ) : null}
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Job));
