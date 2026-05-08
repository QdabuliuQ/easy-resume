import { memo } from 'react';

import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { GlobalStyle } from '../utils/common.type';
import { observer } from 'mobx-react';
import SectionModuleShell from '../layout/sectionModuleShell';

export interface SkillProps {
  id: string;
  type: 'skill';
  options: {
    title: string;
    description: string;
  };
}

interface Props {
  config: SkillProps;
  globalStyle: GlobalStyle;
}

function Skill(props: Props) {
  if (!props.config) {
    return null;
  }
  const { config, globalStyle } = props;
  const { id, options } = config;
  const { fontSize, lineHeight } = globalStyle;

  return (
    <SectionModuleShell moduleId={id} headerConfig={options} moduleType={config.type} globalStyle={globalStyle}>
      {plainTextFromRichHtml(options.description) ? (
        <ResumeQuillHtml
          html={options.description}
          style={{ fontSize: fontSize + 'px', lineHeight: lineHeight }}
          className='text-[#333] [&_li]:my-0.5 [&_p]:my-1'
        />
      ) : null}
    </SectionModuleShell>
  );
}

export default memo(observer(Skill));
