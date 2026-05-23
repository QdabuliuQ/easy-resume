'use client';
import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import SectionHeader, {
  normHeaderType,
  SectionHeaderType11TimelineLayout,
  type SectionHeaderConfig,
} from '@/modules/header/sectionHeader';
import { RESUME_MODULE_BODY_TEXT_COLOR } from '@/lib/resumePageLayout';
import { GlobalStyle } from '@/modules/utils/common.type';
import { memo, type ReactNode } from 'react';

function ModuleBody({ children }: { children: ReactNode }) {
  return (
    <div className='text-black' style={{ color: RESUME_MODULE_BODY_TEXT_COLOR }}>
      {children}
    </div>
  );
}

function SectionModuleShell({
  moduleId,
  activeModuleId,
  headerConfig,
  moduleType,
  globalStyle,
  showHeader = true,
  sectionOrdinal,
  children,
}: {
  moduleId: string;
  activeModuleId?: string;
  headerConfig: SectionHeaderConfig;
  moduleType?: string;
  globalStyle: GlobalStyle;
  showHeader?: boolean;
  sectionOrdinal?: number;
  children: ReactNode;
}) {
  const t = normHeaderType(globalStyle);
  const interactiveModuleId = activeModuleId ?? moduleId;

  if (!showHeader) {
    if (t === 7) {
      return (
        <div
          id={moduleId}
          {...{ [RESUME_MODULE_ID_ATTR]: interactiveModuleId }}
          className='w-full cursor-pointer'
        >
          <div className='min-h-0 min-w-0 overflow-hidden rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2'>
            <ModuleBody>{children}</ModuleBody>
          </div>
        </div>
      );
    }
    return (
      <div
        id={moduleId}
        {...{ [RESUME_MODULE_ID_ATTR]: interactiveModuleId }}
        className='w-full cursor-pointer'
      >
        <ModuleBody>{children}</ModuleBody>
      </div>
    );
  }

  if (t === 7) {
    const ruleColor = globalStyle.color ?? '#333';
    return (
      <div
        id={moduleId}
        {...{ [RESUME_MODULE_ID_ATTR]: interactiveModuleId }}
        className='grid w-full cursor-pointer grid-cols-[5rem_minmax(0,1fr)] items-stretch gap-[10px]'
      >
        <div className='relative min-h-0 min-w-0'>
          <div
            className='pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-px'
            style={{ backgroundColor: ruleColor }}
            aria-hidden
          />
          <div className='relative z-[1] min-h-0 pr-2'>
            <SectionHeader
              config={{
                ...headerConfig,
                moduleType,
                ...(sectionOrdinal != null && sectionOrdinal > 0 ? { sectionOrdinal } : {}),
              }}
              globalStyle={globalStyle}
            />
          </div>
        </div>
        <div className='min-h-0 min-w-0 overflow-hidden rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2'>
          <ModuleBody>{children}</ModuleBody>
        </div>
      </div>
    );
  }
  if (t === 11) {
    return (
      <div
        id={moduleId}
        {...{ [RESUME_MODULE_ID_ATTR]: interactiveModuleId }}
        className='w-full cursor-pointer'
      >
        <SectionHeaderType11TimelineLayout title={headerConfig.title} globalStyle={globalStyle}>
          <ModuleBody>{children}</ModuleBody>
        </SectionHeaderType11TimelineLayout>
      </div>
    );
  }
  return (
    <div
      id={moduleId}
      {...{ [RESUME_MODULE_ID_ATTR]: interactiveModuleId }}
      className='w-full cursor-pointer'
    >
      <div className='mb-[10px] w-full'>
        <SectionHeader
          config={{
            ...headerConfig,
            moduleType,
            ...(sectionOrdinal != null && sectionOrdinal > 0 ? { sectionOrdinal } : {}),
          }}
          globalStyle={globalStyle}
        />
      </div>
      <ModuleBody>{children}</ModuleBody>
    </div>
  );
}

export default memo(SectionModuleShell);
