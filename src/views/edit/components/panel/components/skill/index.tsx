import FormItem from '@/components/formItem';
import { polishSkillDescriptionWithBigmodel } from '@/api/skillDescriptionPolish';
import { useModuleHandle } from '@/hooks/module';
import { configStore, moduleActiveStore } from '@/mobx';
import { SkillProps } from '@/modules/skill';
import { DocSuccess } from '@icon-park/react';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { Form } from 'antd';
import { observer } from 'mobx-react';
import { memo, useEffect, useId, useState, type CSSProperties } from 'react';
import PanelToolbar from '../panelToolbar';
import RichTextEditor from '@/components/richTextEditor';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

const FORM_ICON_FILL = 'rgba(255, 255, 255, 0.7)';

function intentPostsFromResumeConfig(
  config: { pages?: { modules?: { type?: string; options?: { intentPosts?: string } }[] }[] } | null
): string {
  if (!config?.pages) return '';
  for (const page of config.pages) {
    for (const m of page.modules ?? []) {
      if (m.type === 'info1' && m.options?.intentPosts != null) {
        return String(m.options.intentPosts).trim();
      }
    }
  }
  return '';
}

function Skill({ moduleId }: { moduleId?: string } = {}) {
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

  const updateDescription = useMemoizedFn((text: string) => {
    if (!module) return;
    module.options.description = text;
    const next = JSON.parse(JSON.stringify(module));
    setModule(next);
    run(next);
  });

  const rawHtml = module?.options.description ?? '';
  const previewText = plainTextFromRichHtml(rawHtml);
  const intentPostsForPolish = intentPostsFromResumeConfig(configStore.getConfig);

  return (
    <div className='[&_.ant-form-item]:!mb-2.5'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center'>
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
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base [&_.anticon_svg_path]:!fill-[var(--skill-icon-fill)]'
            style={
              {
                ['--skill-icon-fill']: `url(#${iconGradId})`,
              } as CSSProperties
            }
            aria-hidden
          >
            <ThunderboltOutlined />
          </div>
          <span className='ml-[10px] text-[15px] font-medium text-white/95'>
            技能
          </span>
        </div>
        <PanelToolbar moduleId={moduleActive} />
      </div>

      {!editOpen && module && (
        <div
          key='preview'
          className='info1-panel-animate rounded-lg border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-white/95'
        >
          {!previewText ? (
            <div className='text-[13px] text-white/75'>暂无技能描述</div>
          ) : (
            <ResumeQuillHtml
              html={rawHtml}
              className='skill-rich-html max-h-[280px] overflow-y-auto break-words text-[13px] text-white/75 [&_li]:my-0.5 [&_p]:my-1'
            />
          )}
        </div>
      )}

      {editOpen && module ? (
        <div
          key='edit'
          className='info1-panel-animate mt-1 rounded-lg border border-white/[0.08] bg-white/[0.06] p-[10px] text-white/95'
        >
          <RichTextEditor
            instanceKey={`${moduleActive}-skill`}
            html={module.options.description ?? ''}
            onHtmlChange={updateDescription}
            placeholder='请输入技能…'
            onAiPolishClick={(richTextHtml, ctx) =>
              polishSkillDescriptionWithBigmodel(
                { richTextHtml, intentPosts: intentPostsForPolish },
                ctx?.onStreamingHtml
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export default memo(observer(Skill));
