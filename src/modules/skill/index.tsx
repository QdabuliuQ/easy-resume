import { memo } from 'react';

import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { GlobalStyle } from '../utils/common.type';
import { observer } from 'mobx-react';
import Header1 from '../header/header1';

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
    <div
      id={id}
      {...{ [RESUME_MODULE_ID_ATTR]: id }}
      className='w-full cursor-pointer'
    >
      <div className='w-full mb-[5px]'>
        <Header1 config={options} globalStyle={globalStyle} />
      </div>
      {plainTextFromRichHtml(options.description) ? (
        <ResumeQuillHtml
          html={options.description}
          style={{ fontSize: fontSize + 'px', lineHeight: lineHeight }}
          className='text-[#333] [&_li]:my-0.5 [&_p]:my-1'
        />
      ) : null}
    </div>
  );
}

export default memo(observer(Skill));
