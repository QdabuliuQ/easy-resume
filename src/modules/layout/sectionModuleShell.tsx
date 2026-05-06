'use client';
import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import SectionHeader, {
  normHeaderType,
  type SectionHeaderConfig,
} from '@/modules/header/sectionHeader';
import { GlobalStyle } from '@/modules/utils/common.type';
import { memo, type ReactNode } from 'react';

function SectionModuleShell({
  moduleId,
  headerConfig,
  globalStyle,
  children,
}: {
  moduleId: string;
  headerConfig: SectionHeaderConfig;
  globalStyle: GlobalStyle;
  children: ReactNode;
}) {
  const t = normHeaderType(globalStyle);
  if (t === 7) {
    const ruleColor = globalStyle.color ?? '#333';
    return (
      <div
        id={moduleId}
        {...{ [RESUME_MODULE_ID_ATTR]: moduleId }}
        className='grid w-full cursor-pointer grid-cols-[5rem_minmax(0,1fr)] items-stretch gap-[10px]'
      >
        <div className='relative min-h-0 min-w-0'>
          <div
            className='pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-px'
            style={{ backgroundColor: ruleColor }}
            aria-hidden
          />
          <div className='relative z-[1] min-h-0 pr-2'>
            <SectionHeader config={headerConfig} globalStyle={globalStyle} />
          </div>
        </div>
        <div className='min-h-0 min-w-0 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2'>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      id={moduleId}
      {...{ [RESUME_MODULE_ID_ATTR]: moduleId }}
      className='w-full cursor-pointer'
    >
      <div className='mb-[5px] w-full'>
        <SectionHeader config={headerConfig} globalStyle={globalStyle} />
      </div>
      {children}
    </div>
  );
}

export default memo(SectionModuleShell);
