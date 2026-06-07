'use client';

function removeAvatar<T extends Record<string, unknown>>(options: T): Omit<T, 'avatar'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { avatar, ...rest } = options || {};
  return rest as Omit<T, 'avatar'>;
}
import { Popover, Tooltip } from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';
import { analyzeResumeOptimize, analyzeResumeScore } from '@/api/analyzeResume';
import type { ResumeAiAnalyzeResult } from '@/lib/ai/score/types';
import { useModuleHandle } from '@/hooks/module';
import { configStore } from '@/mobx';
import type { ResumeModuleType } from '@/utils/createResumeModule';
import {
  countResumeModulesByType,
  isResumeModuleTypeAtLimit,
  RESUME_MODULE_MAX_COUNT,
} from '@/utils/moduleTypeLimits';

const AiScore = lazy(() => import('../../panel/components/aiScore'));
const GeneralSettings = lazy(() => import('../../panel/components/generalSettings'));
const ModuleEdit = lazy(() => import('../../panel/components/moduleEdit'));
const PageSettings = lazy(() => import('../../panel/components/pageSettings'));
const ResumeTemplate = lazy(() => import('../../panel/components/resumeTemplate'));

type ResumeProps = { menuActiveKey: string };
import PanelHero from '../../panel/components/panelHero';
import { resolvePanelHeroContent } from '../../panel/components/panelHero/resolveContent';

const GRADIENT_CTA_CLASS =
  'bg-add-module-gradient relative isolate flex h-10 w-[410px] max-w-full cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-md text-[14px] font-bold text-white shadow-lg shadow-black/20 outline-none backdrop-blur-md backdrop-saturate-200 transition-[filter] duration-200 hover:brightness-125 hover:saturate-150 active:brightness-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100 disabled:hover:saturate-100';
function Resume({ menuActiveKey }: ResumeProps) {
  const message = useAppMessage();
  const tr = useTranslations('Edit.resumeContainer');
  const addModuleList = useMemo(
    () =>
      [
        { type: 'info1' as const, label: tr('tabInfo1') },
        { type: 'certificate' as const, label: tr('tabCertificate') },
        { type: 'skill' as const, label: tr('tabSkill') },
        { type: 'job' as const, label: tr('tabJob') },
        { type: 'project' as const, label: tr('tabProject') },
        { type: 'education' as const, label: tr('tabEducation') },
        { type: 'other' as const, label: tr('tabOther') },
      ] satisfies { type: ResumeModuleType; label: string }[],
    [tr],
  );
  const cfg = configStore.getConfig;
  const { addModuleByType } = useModuleHandle();
  const [addOpen, setAddOpen] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<ResumeAiAnalyzeResult | null>(null);
  const analyzeLoading = scoreLoading || optimizeLoading;
  const isAiScore = menuActiveKey === 'ai-score';
  const isResumeTemplate = menuActiveKey === 'resume-template';
  const isGeneralSettings = menuActiveKey === 'general-settings';
  const isPageSettings = menuActiveKey === 'page-settings';
  const isResumeEdit = menuActiveKey === 'resume';
  const panelHero = resolvePanelHeroContent(menuActiveKey, tr);
  const onStartAnalyze = useCallback(() => {
    if (analyzeLoading) return;
    const cfgInner = configStore.getConfig;
    if (!cfgInner?.pages?.length) {
      message.warning(tr('noConfigWarn'));
      return;
    }
    const pagesForAnalyze = (cfgInner.pages ?? []).map((page) => {
      const modules = Array.isArray(page.modules)
        ? page.modules.map((module) => {
            if (String(module?.type ?? '') !== 'info1') return module;
            const options =
              module?.options && typeof module.options === 'object'
                ? removeAvatar(module.options as Record<string, unknown>)
                : module?.options;
            return { ...module, options };
          })
        : page.modules;
      return { ...page, modules };
    });
    const analyzeSessionId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = { pages: pagesForAnalyze };
    setAiAnalysis(null);
    setScoreLoading(true);
    setOptimizeLoading(true);
    void analyzeResumeScore(payload, analyzeSessionId)
      .then((res) => {
        const { cached, ...score } = res;
        void cached;
        setAiAnalysis((prev) => ({
          totalScore: score.totalScore,
          dimensionEvaluate: score.dimensionEvaluate,
          fieldOptimizeList: prev?.fieldOptimizeList ?? [],
        }));
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : tr('analyzeFail'));
      })
      .finally(() => setScoreLoading(false));
    void analyzeResumeOptimize(payload, analyzeSessionId)
      .then((res) => {
        const { cached, ...optimize } = res;
        void cached;
        setAiAnalysis((prev) => ({
          totalScore: prev?.totalScore ?? 0,
          dimensionEvaluate: prev?.dimensionEvaluate ?? [],
          fieldOptimizeList: optimize.fieldOptimizeList,
        }));
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : tr('analyzeFail'));
      })
      .finally(() => setOptimizeLoading(false));
  }, [analyzeLoading, message, tr]);
  return (
    <div className='relative flex h-full min-h-0 flex-1 flex-col text-black [transform:translateZ(0)] bg-[var(--resume-panel-bg)]'>
      <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-24'>
        <div className='m-[20px]'>
          <PanelHero {...panelHero} />
          <Suspense
            fallback={
              <div className='rounded-[20px] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.09),rgb(var(--panel-surface-rgb)/0.04))] px-4 py-10'>
                <div className='flex items-center justify-center gap-2 text-[13px] text-fg/58'>
                  <span
                    className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]'
                    aria-hidden
                  />
                  <span>{tr('loadingPanel')}</span>
                </div>
              </div>
            }
          >
            {isAiScore ? (
              <AiScore
                scoreLoading={scoreLoading}
                optimizeLoading={optimizeLoading}
                analysis={aiAnalysis}
              />
            ) : isResumeTemplate ? (
              <ResumeTemplate />
            ) : isGeneralSettings ? (
              <GeneralSettings />
            ) : isPageSettings ? (
              <PageSettings />
            ) : (
              <ModuleEdit />
            )}
          </Suspense>
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
                {addModuleList.map(({ type, label }) => {
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
                      title={tr('maxModulesTooltip', { max })}
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
              <span className='relative z-[1] drop-shadow-sm'>{tr('addModule')}</span>
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
              <span className='relative z-[1] drop-shadow-sm'>{tr('startAnalyze')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default memo(observer(Resume));
