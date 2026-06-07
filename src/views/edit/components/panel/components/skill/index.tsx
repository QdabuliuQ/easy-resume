'use client';
import { polishDescription } from '@/api/polishDescription';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import RichTextEditor, {
  RICH_TEXT_LONG_BODY_MAX_PLAIN_LENGTH,
} from '@/components/richTextEditor';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { SkillProps } from '@/modules/skill';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useId, useState, type CSSProperties } from 'react';
import ModulePanelTitleEdit from '../modulePanelTitleEdit';
import PanelToolbar from '../panelToolbar';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

function Skill({ moduleId }: { moduleId?: string } = {}) {
  const ts = useTranslations('Edit.skill');
  const { getModule, getModuleIndex } = useModuleHandle();
  const moduleActive = moduleId ?? moduleActiveStore.getModuleActive;
  const editOpen = moduleActiveStore.getModuleActive === moduleActive;
  const [module, setModule] = useState<SkillProps | null>(null);
  const gradId = useId().replace(/:/g, '');
  const iconGradId = `skill-icon-grad-${gradId}`;

  useEffect(() => {
    const m = getModule(moduleActive);
    if (m) {
      setModule(JSON.parse(JSON.stringify(m)));
    } else {
      setModule(null);
    }
  }, [moduleActive, getModule]);

  const { run } = useDebounceFn(
    (mod: SkillProps) => {
      const config = configStore.getConfig;
      if (!config) return;
      const res = getModuleIndex(moduleActive);
      if (!res) return;
      config.pages[res.page].modules[res.module] = JSON.parse(
        JSON.stringify(mod)
      );
      configStore.setConfig({
        ...config,
        pages: [...config.pages],
      });
    },
    { wait: 100 }
  );

  const updateModule = useMemoizedFn((mod: SkillProps) => {
    const next = JSON.parse(JSON.stringify(mod));
    setModule(next);
    run(next);
  });
  const updateDescription = useMemoizedFn((text: string) => {
    if (!module) return;
    module.options.description = text;
    updateModule(module);
  });

  const rawHtml = module?.options.description ?? '';
  const previewText = plainTextFromRichHtml(rawHtml);
  const intentPostsForPolish = intentPostsFromResumeConfig(
    configStore.getConfig
  );

  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
      <div className='panel-module-head'>
        <div className='panel-module-head-main'>
          <svg
            width={0}
            height={0}
            className='pointer-events-none size-0 shrink-0 overflow-hidden'
            aria-hidden
          >
            <defs>
              <linearGradient
                id={iconGradId}
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
              >
                <stop offset='0%' stopColor='#fde047' />
                <stop offset='100%' stopColor='#f97316' />
              </linearGradient>
            </defs>
          </svg>
          <div
            className='panel-module-icon text-base [&_.anticon_svg_path]:!fill-[var(--skill-icon-fill)]'
            style={
              {
                ['--skill-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <ThunderboltOutlined />
          </div>
          <ModulePanelTitleEdit
            resetKey={moduleActive}
            title={module?.options?.title ?? ''}
            fallbackTitle={ts('fallbackTitle')}
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
            <div className='text-[13px] text-fg/75'>{ts('emptyInline')}</div>
          ) : (
            <ResumeQuillHtml
              html={rawHtml}
              className='skill-rich-html max-h-[280px] overflow-y-auto break-words text-[13px] text-fg/75'
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
            instanceKey={`${moduleActive}-skill`}
            html={module.options.description ?? ''}
            dataPanelItemId={`${moduleActive}_description`}
            onHtmlChange={updateDescription}
            maxPlainLength={RICH_TEXT_LONG_BODY_MAX_PLAIN_LENGTH}
            placeholder={ts('placeholder')}
            onAiPolishClick={(richTextHtml, ctx) =>
              polishDescription(
                {
                  type: 'skill',
                  richTextHtml,
                  intentPosts: intentPostsForPolish,
                },
                ctx?.onStreamingHtml,
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Skill));
