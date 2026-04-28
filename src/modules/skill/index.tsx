import { memo } from 'react';

import ModuleOperation from '@/components/moduleOperation';
import { plainTextFromRichHtml, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import { GlobalStyle } from '../utils/common.type';
import { moduleActiveStore } from '@/mobx';
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
    <ModuleOperation
      id={id}
      isActive={id === moduleActiveStore.getModuleActive}
    >
      <div id={id} className='w-full cursor-pointer'>
        <div className='w-full mb-[5px]'>
          <Header1 config={options} globalStyle={globalStyle} />
        </div>
        {plainTextFromRichHtml(options.description) ? (
          <div
            className='w-full text-[#333] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5'
            style={{ fontSize: fontSize + 'px', lineHeight: lineHeight }}
            dangerouslySetInnerHTML={{
              __html: sanitizeRichTextHtml(options.description),
            }}
          />
        ) : null}
      </div>
    </ModuleOperation>
  );
}

export default memo(observer(Skill));
