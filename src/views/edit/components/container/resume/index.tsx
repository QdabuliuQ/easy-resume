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
        const payload = { pages: cfg.pages, globalStyle: cfg.globalStyle ?? undefined };
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
    <div className='relative flex h-full min-h-0 flex-1 flex-col text-black [transform:translateZ(0)]'>
      <div className='min-h-0 flex-1 overflow-auto pb-20'>
        <div className='m-[20px]'>
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
      <div className='pointer-events-none fixed bottom-0 left-0 right-0 z-10 p-[10px]'>
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
                background: '#323236',
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
                          ? 'cursor-not-allowed text-white/40'
                          : 'cursor-pointer text-white/90 hover:bg-white/10'
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
                        <span className='ml-1 text-[11px] text-white/35'>
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
        <div className='pointer-events-none fixed bottom-0 left-0 right-0 z-10 p-[10px]'>
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
