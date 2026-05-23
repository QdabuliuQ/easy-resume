import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import SectionModuleShell from '../layout/sectionModuleShell';
import { observer } from 'mobx-react';

export interface ProjectProps {
  id: string;
  type: 'project';
  options: {
    title: string;
    items: Array<{
      id: string;
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
  const { id } = config;
  const raw = config.options ?? { title: '', items: [] as ProjectProps['options']['items'] };
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '项目经历';
  const items = Array.isArray(raw.items) ? raw.items : [];
  const options = { ...raw, title, items };
  const { fontSize, lineHeight } = globalStyle;
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      <div className='min-w-0 w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='min-w-0 w-full text-black not-last:mb-[10px]'
            style={{ fontSize: fontSize + 'px' }}
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='min-w-0 flex-[5] break-words font-bold'>{item.name}</div>
              <div className='shrink-0 text-right whitespace-nowrap'>
                {item.startDate} - {item.endDate}
              </div>
            </div>
            {item.role && (
              <div className='mb-[5px] flex min-w-0 justify-between'>
                <div className='min-w-0 flex-[6] break-words'>{item.role}</div>
              </div>
            )}
            {plainTextFromRichHtml(item.description) ? (
              <ResumeQuillHtml
                html={item.description}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
                className='text-black'
              />
            ) : null}
          </div>
        ))}
      </div>
    </SectionModuleShell>
  );
}

export default memo(observer(Project));
