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
    <SectionModuleShell moduleId={id} headerConfig={options} globalStyle={globalStyle}>
      <div className='w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='w-full text-[#333] not-last:mb-[10px]'
            style={{ fontSize: fontSize + 'px' }}
          >
            <div className='flex justify-between mb-[5px]'>
              <div className='flex-5 font-bold'>{item.name}</div>
              <div className='flex-5 text-right'>
                {item.startDate} - {item.endDate}
              </div>
            </div>
            {item.role && (
              <div className='flex justify-between mb-[5px]'>
                <div className='flex-6'>{item.role}</div>
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
    </SectionModuleShell>
  );
}

export default memo(observer(Project));
