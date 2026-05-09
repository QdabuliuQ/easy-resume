import { message, Popover, Tooltip } from 'antd';
import { observer } from 'mobx-react';
import { memo, useCallback, useState } from 'react';
import { analyzeResumeWithBigmodel, type ResumeAiAnalyzeResult } from '@/api/resumeAiScoreAnalyze';
import { useModuleHandle } from '@/hooks/module';
import { configStore } from '@/mobx';
import type { ResumeModuleType } from '@/utils/createResumeModule';
import {
  countResumeModulesByType,
  isResumeModuleTypeAtLimit,
  RESUME_MODULE_MAX_COUNT,
} from '@/utils/moduleTypeLimits';
import AiScore from '../../panel/components/aiScore';
import ModuleEdit from '../../panel/components/moduleEdit';
import ResumeTemplate from '../../panel/components/resumeTemplate';

const ADD_MODULE_LIST: { type: ResumeModuleType; label: string }[] = [
  { type: 'info1', label: '个人信息' },
  { type: 'certificate', label: '证书' },
  { type: 'skill', label: '技能' },
  { type: 'job', label: '工作经历' },
  { type: 'project', label: '项目经历' },
  { type: 'education', label: '教育经历' },
  { type: 'other', label: '其他' },
];

type ResumeProps = { menuActiveKey: string };

const GRADIENT_CTA_CLASS =
  'bg-add-module-gradient relative isolate flex h-10 w-[410px] max-w-full cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-md text-[14px] font-bold text-white shadow-lg shadow-black/20 outline-none backdrop-blur-md backdrop-saturate-200 transition-[filter] duration-200 hover:brightness-125 hover:saturate-150 active:brightness-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100 disabled:hover:saturate-100';

const PANEL_HERO_CLASS =
  'mb-4 rounded-[20px] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.11),rgb(var(--panel-surface-rgb)/0.05))] px-4 py-3 text-fg shadow-[0_18px_42px_rgba(0,0,0,0.14)]';

function Resume({ menuActiveKey }: ResumeProps) {
  const cfg = configStore.getConfig;
  const { addModuleByType } = useModuleHandle();
  const [addOpen, setAddOpen] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [hasAiAnalysis, setHasAiAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<ResumeAiAnalyzeResult | null>(null);
  const isAiScore = menuActiveKey === 'ai-score';
  const isResumeTemplate = menuActiveKey === 'resume-template';
  const isResumeEdit = menuActiveKey === 'resume';

  const onStartAnalyze = useCallback(() => {
    if (analyzeLoading) return;
    const cfg = configStore.getConfig;
    if (!cfg?.pages?.length) {
      message.warning('暂无简历配置，请先编辑简历');
      return;
    }
    setAnalyzeLoading(true);
    void (async () => {
      try {
        const pagesForAnalyze = (cfg.pages ?? []).map((page) => {
          const modules = Array.isArray(page.modules)
            ? page.modules.map((module) => {
                if (String(module?.type ?? '') !== 'info1') return module;
                const options =
                  module?.options && typeof module.options === 'object'
                    ? (({ avatar: _avatar, ...restOptions }) => restOptions)(
                        module.options as Record<string, unknown>,
                      )
                    : module?.options;
                return { ...module, options };
              })
            : page.modules;
          return { ...page, modules };
        });
        const payload = {
          pages: pagesForAnalyze,
          globalStyle: cfg.globalStyle ?? undefined,
        };
        const result = await analyzeResumeWithBigmodel(payload);
        setAiAnalysis(result);
        setHasAiAnalysis(true);
      } catch (e) {
        message.error(e instanceof Error ? e.message : '分析失败');
      } finally {
        setAnalyzeLoading(false);
      }
    })();
  }, [analyzeLoading]);

  return (
    <div className='relative flex h-full min-h-0 flex-1 flex-col text-black [transform:translateZ(0)] bg-[var(--resume-panel-bg)]'>
      <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-24'>
        <div className='m-[20px]'>
          <div className={PANEL_HERO_CLASS}>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium tracking-[0.18em] text-fg/62'>
                  {isAiScore ? 'AI SCORE' : isResumeTemplate ? 'TEMPLATES' : 'CONFIG'}
                </p>
                <h2 className='mt-1 text-[17px] font-semibold text-fg/95'>
                  {isAiScore ? 'AI 智能评分' : isResumeTemplate ? '简历模板' : '简历配置面板'}
                </h2>
                <p className='mt-1 text-[12px] leading-relaxed text-fg/62'>
                  {isAiScore
                    ? '查看评分维度与优化建议，并在当前简历配置上应用可执行修改。'
                    : isResumeTemplate
                      ? '选择模板会直接替换当前简历配置，建议先导出 JSON 备份。'
                      : '滚动浏览各模块配置，顶部导航用于快速定位，底部按钮负责补充模块。'}
                </p>
              </div>
              <div className='shrink-0 rounded-full border border-fg/[0.14] bg-surface/[0.08] px-3 py-1 text-[11px] font-semibold text-fg/68'>
                {isAiScore ? '分析' : isResumeTemplate ? '模板' : '编辑'}
              </div>
            </div>
          </div>
          {isAiScore ? (
            <AiScore
              loading={analyzeLoading}
              hasAnalysis={hasAiAnalysis}
              analysis={aiAnalysis}
            />
          ) : isResumeTemplate ? (
            <ResumeTemplate />
          ) : (
            <ModuleEdit />
          )}
        </div>
      </div>
      {isResumeEdit && (
      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--editor-shell-panel-strong)_88%,transparent)_46%,var(--editor-shell-bg))] px-[10px] pb-[10px] pt-8'>
        <div className='pointer-events-auto flex justify-center'>
          <Popover
            trigger='click'
            placement='top'
            open={addOpen}
            onOpenChange={setAddOpen}
            arrow={false}
            styles={{
              root: { zIndex: 1050 },
              body: {
                padding: 8,
                background: 'var(--antd-popup-bg)',
                borderRadius: 8,
              },
            }}
            content={
              <div className='flex min-w-[168px] flex-col'>
                {ADD_MODULE_LIST.map(({ type, label }) => {
                  const atLimit = isResumeModuleTypeAtLimit(cfg, type);
                  const cur = countResumeModulesByType(cfg, type);
                  const max = RESUME_MODULE_MAX_COUNT[type];
                  const row = (
                    <div
                      role='button'
                      tabIndex={atLimit ? -1 : 0}
                      aria-disabled={atLimit}
                      className={`rounded-md px-3 py-2 text-[13px] outline-none ${
                        atLimit
                          ? 'cursor-not-allowed text-fg/52'
                          : 'cursor-pointer text-fg/92 hover:bg-surface/12'
                      }`}
                      onClick={() => {
                        if (atLimit) return;
                        addModuleByType(type);
                        setAddOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (atLimit) return;
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        addModuleByType(type);
                        setAddOpen(false);
                      }}
                    >
                      {label}
                      {atLimit ? (
                        <span className='ml-1 text-[11px] text-fg/52'>
                          （{cur}/{max}）
                        </span>
                      ) : null}
                    </div>
                  );
                  return atLimit ? (
                    <Tooltip
                      key={type}
                      title={`该模块最多 ${max} 个，已达上限`}
                      placement='left'
                    >
                      {row}
                    </Tooltip>
                  ) : (
                    <div key={type}>{row}</div>
                  );
                })}
              </div>
            }
          >
            <div
              role='button'
              tabIndex={0}
              className={GRADIENT_CTA_CLASS}
            >
              <span className='relative z-[1] drop-shadow-sm'>添加模块</span>
            </div>
          </Popover>
        </div>
      </div>
      )}
      {isAiScore && (
        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--editor-shell-panel-strong)_88%,transparent)_46%,var(--editor-shell-bg))] px-[10px] pb-[10px] pt-8'>
          <div className='pointer-events-auto flex justify-center'>
            <button
              type='button'
              disabled={analyzeLoading}
              aria-busy={analyzeLoading}
              onClick={onStartAnalyze}
              className={`${GRADIENT_CTA_CLASS} gap-2`}
            >
              {analyzeLoading ? (
                <span
                  className='relative z-[1] inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white'
                  aria-hidden
                />
              ) : null}
              <span className='relative z-[1] drop-shadow-sm'>开始分析</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(observer(Resume));
