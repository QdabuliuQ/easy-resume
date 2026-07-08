'use client';
import { polishDescription } from '@/api/polishDescription';
import RichTextEditor from '@/components/richTextEditor/lazy';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { OtherProps } from '@/modules/other';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import { More } from '@icon-park/react';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

function Other({ moduleId }: { moduleId?: string } = {}) {
  const to = useTranslations('Edit.other');
  const { getModule, getModuleIndex } = useModuleHandle();
  const config = configStore.getConfig;
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<OtherProps | null>(null);
  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(JSON.parse(JSON.stringify(m)));
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule, config]);
  const { run } = useDebounceFn(
    (mod: OtherProps) => {
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      const config = JSON.parse(JSON.stringify(configStore.getConfig));
      if (!config) return;
      config.pages[res.page].modules[res.module] = JSON.parse(JSON.stringify(mod));
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );
  const updateModule = useMemoizedFn((mod: OtherProps) => {
    const next = JSON.parse(JSON.stringify(mod));
    setModule(next);
    run(next);
  });
  const updateDescription = useMemoizedFn((html: string) => {
    if (!module) return;
    module.options.description = html;
    updateModule(module);
  });
  const rawHtml = module?.options.description ?? '';
  const previewText = plainTextFromRichHtml(rawHtml);
  const intentPostsForPolish = intentPostsFromResumeConfig(configStore.getConfig);
  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
      <div className='panel-module-head'>
        <div className='panel-module-head-main'>
          <div
            className='panel-module-icon text-base'
            aria-hidden
          >
            <More theme='outline' size={18} fill='var(--panel-form-icon)' />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle={to('fallbackTitle')}
            panelItemId={`${moduleActive}_title`}
            disabled={!module}
            onCommit={(next) => {
              if (!module) return;
              module.options.title = next;
              updateModule(module);
            }}
          />
        </div>
        <PanelToolbar moduleId={moduleActive} />
      </div>
      {!editOpen && module && (
        <div
          key='preview'
          className='panel-module-preview info1-panel-animate text-fg/95'
        >
          {!previewText ? (
            <div className='text-[13px] text-fg/75'>{to('emptyInline')}</div>
          ) : (
            <ResumeQuillHtml
              html={rawHtml}
              className='max-h-[280px] overflow-y-auto break-words text-[13px] text-fg/75'
            />
          )}
        </div>
      )}
      {editOpen && module ? (
        <div
          key='edit'
          className='panel-module-edit info1-panel-animate text-fg/95'
        >
          <RichTextEditor
            instanceKey={`${moduleActive}-other`}
            html={module.options.description ?? ''}
            dataPanelItemId={`${moduleActive}_description`}
            onHtmlChange={updateDescription}
            placeholder={to('placeholder')}
            onAiPolishClick={(richTextHtml, ctx) =>
              polishDescription(
                {
                  type: 'other',
                  richTextHtml,
                  intentPosts: intentPostsForPolish,
                  context: { moduleTitle: module.options.title ?? '' },
                },
                ctx?.onStreamingHtml,
                ctx?.signal,
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Other));
