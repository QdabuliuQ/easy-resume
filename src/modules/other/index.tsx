import { memo } from 'react';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { GlobalStyle } from '../utils/common.type';
import { observer } from 'mobx-react';
import SectionModuleShell from '../layout/sectionModuleShell';

export interface OtherProps {
  id: string;
  type: 'other';
  options: {
    title: string;
    description: string;
  };
}

interface Props {
  config: OtherProps;
  globalStyle: GlobalStyle;
}

function Other(props: Props) {
  if (!props.config) {
    return null;
  }
  const { config, globalStyle } = props;
  const { id, options } = config;
  const { fontSize, lineHeight } = globalStyle;
  return (
    <SectionModuleShell moduleId={id} headerConfig={options} globalStyle={globalStyle}>
      {plainTextFromRichHtml(options.description) ? (
        <ResumeQuillHtml
          html={options.description}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
          className='text-[#333] [&_li]:my-0.5 [&_p]:my-1'
        />
      ) : null}
    </SectionModuleShell>
  );
}

export default memo(observer(Other));
