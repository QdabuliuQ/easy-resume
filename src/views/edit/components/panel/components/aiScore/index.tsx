'use client';
import { Book, Briefcase, Notes, Right, Setting, Up } from '@icon-park/react';
import { App, Collapse, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useId, useMemo, type ComponentType } from 'react';
import type { ResumeAiAnalyzeResult, ResumeAiFieldOptimize } from '@/api/resumeAiScoreAnalyze';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import {
  applyResumeAiFieldOptimize,
  fieldOptimizeListKey,
  findResumeModule,
  resumeModuleItemLabel,
} from '@/lib/resumeAiFieldApply';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType as moduleTypeMeta } from '@/modules/utils/constant';

const PRIMARY_FILL = 'var(--color-primary)';
const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)]';

function clampScore0to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreMeta(score: number, ta: (key: string) => string) {
  if (score >= 90) return { label: ta('bandStrong'), tone: 'text-emerald-300', chip: 'bg-emerald-400/14 text-emerald-300 border-emerald-300/20' };
  if (score >= 75) return { label: ta('bandSolid'), tone: 'text-amber-200', chip: 'bg-amber-300/14 text-amber-200 border-amber-200/20' };
  return { label: ta('bandWeak'), tone: 'text-rose-400', chip: 'bg-rose-300/14 text-rose-400 border-rose-200/20' };
}

function GaugeRing({ gradId, score }: { gradId: string; score: number }) {
  const r = 78;
  const cx = 110;
  const cy = 100;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const dash = `${score} 100`;
  return (
    <svg viewBox='0 0 220 118' className='mx-auto block h-[118px] w-full max-w-[220px]' aria-hidden>
      <defs>
        <linearGradient id={gradId} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
          <stop offset='100%' stopColor='var(--color-primary)' />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill='none'
        stroke='var(--panel-chart-track)'
        strokeWidth='14'
        strokeLinecap='round'
        pathLength={100}
      />
      {score > 0 ? (
        <path
          d={d}
          fill='none'
          stroke={`url(#${gradId})`}
          strokeWidth='14'
          strokeLinecap='round'
          pathLength={100}
          strokeDasharray={dash}
        />
      ) : null}
    </svg>
  );
}

const collapsePanelClass =
  '[&_.ant-collapse]:!border-fg/[0.06] [&_.ant-collapse-item]:!border-fg/[0.06] [&_.ant-collapse-header]:!relative [&_.ant-collapse-header]:!z-[2] [&_.ant-collapse-header]:!shrink-0 [&_.ant-collapse-header]:!items-center [&_.ant-collapse-header]:!border-b [&_.ant-collapse-header]:!border-fg/[0.06] [&_.ant-collapse-header]:!py-2.5 [&_.ant-collapse-header]:!px-3 [&_.ant-collapse-header]:!text-[13px] [&_.ant-collapse-header]:!text-fg/90 [&_.ant-collapse-header]:!rounded-none [&_.ant-collapse-header]:hover:!bg-surface/[0.04] [&_.ant-collapse-content]:!relative [&_.ant-collapse-content]:!z-0 [&_.ant-collapse-content]:!border-fg/[0.06] [&_.ant-collapse-content-box]:!px-3 [&_.ant-collapse-content-box]:!pb-3 [&_.ant-collapse-content-box]:!pt-1 [&_.ant-collapse-content-box]:!isolate';

const DIM_ICONS: ComponentType<{ theme?: 'outline' | 'filled'; size?: number; fill?: string; className?: string }>[] = [
  Setting,
  Notes,
  Briefcase,
  Book,
];

const EMPTY_DIMENSION_ROWS: NonNullable<ResumeAiAnalyzeResult['dimensionEvaluate']> = [];
const EMPTY_FIELD_LIST: NonNullable<ResumeAiAnalyzeResult['fieldOptimizeList']> = [];

function statusTone(status: string): { dot: string; text: string; fill: string } {
  if (status === '优秀')
    return { dot: 'bg-emerald-400', text: 'text-emerald-400', fill: 'var(--panel-tone-emerald)' };
  if (status === '待补充')
    return { dot: 'bg-red-400', text: 'text-red-400', fill: 'var(--panel-tone-rose)' };
  return { dot: 'bg-amber-400', text: 'text-amber-400', fill: 'var(--panel-tone-amber)' };
}

function moduleTypeLabel(mt: string): string {
  const meta = moduleTypeMeta[mt as keyof typeof moduleTypeMeta];
  return meta?.name ?? mt;
}

type ResumeDraft = NonNullable<ReturnType<typeof configStore.getConfig>>;
type MessageApi = ReturnType<typeof App.useApp>['message'];

function applyOneToDraft(draft: ResumeDraft, item: ResumeAiFieldOptimize): boolean {
  return applyResumeAiFieldOptimize(draft, item);
}

function applyFieldOptimize(item: ResumeAiFieldOptimize, messageApi: MessageApi, ta: (key: string) => string) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    messageApi.warning(ta('noConfig'));
    return;
  }
  const next = JSON.parse(JSON.stringify(cfg)) as ResumeDraft;
  if (!applyOneToDraft(next, item)) {
    const page = cfg.pages[item.pageIndex];
    const mod = page ? findResumeModule(cfg, item.pageIndex, item.moduleId) : undefined;
    const msg = !page
      ? ta('pageMissing')
      : !mod
        ? ta('moduleMissing')
        : item.moduleItemId?.trim()
          ? ta('itemMissing')
          : ta('moduleMissing');
    messageApi.error(msg);
    return;
  }
  configStore.setConfig(next);
  messageApi.success(ta('modifiedOk'));
}

function applyAllFieldOptimizes(
  list: ResumeAiFieldOptimize[],
  messageApi: MessageApi,
  ta: (key: string, v?: Record<string, string | number>) => string
) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    messageApi.warning(ta('noConfig'));
    return;
  }
  const toApply = list.filter(
    (f) => typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
  );
  if (toApply.length === 0) {
    messageApi.info(ta('noSuggestions'));
    return;
  }
  const next = JSON.parse(JSON.stringify(cfg)) as ResumeDraft;
  let ok = 0;
  let fail = 0;
  for (const item of toApply) {
    if (applyOneToDraft(next, item)) ok += 1;
    else fail += 1;
  }
  configStore.setConfig(next);
  if (fail === 0) messageApi.success(ta('batchApplied', { ok }));
  else messageApi.warning(ta('batchPartial', { ok, fail }));
}

function EmptyAnalysisHint() {
  const ta = useTranslations('Edit.aiScore');
  return (
    <div className='rounded-2xl border border-dashed border-fg/[0.09] bg-[var(--panel-inset-bg)] px-4 py-6 text-center'>
      <p className='text-[12px] font-medium text-fg/72'>{ta('emptyTitle')}</p>
      <p className='mt-1 text-[11px] leading-relaxed text-fg/62'>
        {ta('emptyHint')}
      </p>
    </div>
  );
}

function collapseExpandIcon({ isActive }: { isActive?: boolean }) {
  return (
    <Up
      theme='outline'
      size={14}
      fill='rgb(var(--panel-surface-rgb)/0.45)'
      className={`shrink-0 transition-transform duration-200 ${isActive ? '' : 'rotate-180'}`}
    />
  );
}

function AiScore({
  score: scoreProp,
  loading = false,
  analysis = null,
}: {
  score?: number;
  loading?: boolean;
  analysis?: ResumeAiAnalyzeResult | null;
}) {
  const ta = useTranslations('Edit.aiScore');
  const { message: messageApi } = App.useApp();
  const gradId = useId().replace(/:/g, '');
  const score = clampScore0to100(
    typeof scoreProp === 'number' ? scoreProp : analysis?.totalScore ?? 0
  );
  const scoreState = useMemo(() => scoreMeta(score, ta), [score, ta]);
  const dimensionRows = analysis?.dimensionEvaluate ?? EMPTY_DIMENSION_ROWS;
  const fieldList = analysis?.fieldOptimizeList ?? EMPTY_FIELD_LIST;
  const excellentCount = dimensionRows.filter((row) => row.status === '优秀').length;
  const pendingCount = dimensionRows.filter((row) => row.status === '待补充').length;
  const actionableCount = fieldList.filter(
    (f) => typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
  ).length;
  const onApply = useCallback((item: ResumeAiFieldOptimize) => {
    applyFieldOptimize(item, messageApi, ta);
  }, [messageApi, ta]);
  const onApplyAll = useCallback(() => {
    applyAllFieldOptimizes(fieldList, messageApi, ta);
  }, [fieldList, messageApi, ta]);
  const scoreDetailItems = useMemo(
    () => [
      {
        key: 'panel',
        label: (
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate font-medium text-fg/92'>{ta('dimensionsTitle')}</span>
            <span className='rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2 py-0.5 text-[11px] text-fg/55'>
              {ta('dimensionsCount', { n: dimensionRows.length || 0 })}
            </span>
          </div>
        ),
        children: (
          <div className='mt-[5px]'>
            {dimensionRows.length > 0 ? (
              <div className='flex flex-col gap-2 pt-1'>
                {dimensionRows.map((row, i) => {
                  const Icon = DIM_ICONS[i % DIM_ICONS.length] ?? Setting;
                  const tone = statusTone(row.status);
                  const statusLabel =
                    row.status === '优秀'
                      ? ta('statusExcellent')
                      : row.status === '待补充'
                        ? ta('statusPending')
                        : row.status;
                  return (
                    <div
                      key={`${row.dimensionName}-${i}`}
                      className='rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-3 transition-colors hover:border-fg/[0.12] hover:bg-surface/[0.045]'
                    >
                      <div className='flex gap-3'>
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fg/[0.06] bg-[var(--panel-inset-bg-strong)]'>
                        <Icon theme='filled' size={20} fill={tone.fill} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2 text-[13px]'>
                          <span className='font-medium text-fg/92'>{row.dimensionName}</span>
                          <span className={`inline-flex items-center rounded-full border border-fg/[0.06] px-2 py-0.5 text-[11px] ${tone.text}`}>
                            <span className={`mr-1 size-1.5 shrink-0 rounded-full ${tone.dot}`} />
                            {statusLabel}
                          </span>
                        </div>
                        <p className='mt-1.5 text-[11px] leading-relaxed text-fg/58'>
                          {ta('resumeNote', { remark: row.remark })}
                        </p>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : loading ? (
              <div className='min-h-[80px]' aria-hidden />
            ) : (
              <EmptyAnalysisHint />
            )}
          </div>
        ),
      },
    ],
    [loading, dimensionRows, ta]
  );
  const suggestionItems = useMemo(
    () => [
      {
        key: 'panel',
        label: (
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate font-medium text-fg/92'>{ta('suggestionsTitle')}</span>
            <span className='rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2 py-0.5 text-[11px] text-fg/55'>
              {ta('actionableCount', { n: actionableCount })}
            </span>
          </div>
        ),
        children: (
          <div className='mt-[5px]'>
            {fieldList.length > 0 ? (
              <>
                <div className='flex items-center justify-between gap-2 rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-2.5'>
                  <div className='min-w-0'>
                    <p className='text-[12px] font-medium text-fg/88'>{ta('applyBlurbTitle')}</p>
                    <p className='mt-0.5 text-[11px] leading-relaxed text-fg/62'>
                      {ta('applyBlurbDesc')}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={onApplyAll}
                    disabled={
                      !fieldList.some(
                        (f) =>
                          typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
                      )
                    }
                    className='shrink-0 cursor-pointer rounded-xl border border-emerald-300/16 bg-emerald-400/12 px-3 py-2 text-[12px] font-medium text-emerald-300 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-emerald-300/28 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0'
                  >
                    {ta('applyAll')}
                  </button>
                </div>
              <ul className='flex flex-col gap-2 pt-2'>
                {fieldList.map((f) => {
                  const hasVal = typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0;
                  const mod = configStore.getConfig
                    ? findResumeModule(configStore.getConfig, f.pageIndex, f.moduleId)
                    : undefined;
                  const itemLabel = resumeModuleItemLabel(mod, f.moduleItemId);
                  return (
                    <li
                      key={fieldOptimizeListKey(f)}
                      className='rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-3 text-[12px] leading-snug text-fg/55 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-fg/[0.12] hover:bg-surface/[0.045]'
                      onMouseEnter={() => moduleActiveStore.setModuleActive(f.moduleId)}
                      onMouseLeave={() => {
                        if (moduleActiveStore.getModuleActive === f.moduleId) {
                          moduleActiveStore.setModuleActive('global');
                        }
                      }}
                    >
                      <div className='flex gap-2'>
                        <Right theme='filled' size={14} fill={PRIMARY_FILL} className='mt-0.5 shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[11px] font-medium text-fg/70'>
                            {moduleTypeLabel(mod?.type ?? f.moduleType)}
                          </span>
                          {itemLabel ? (
                            <span className='max-w-[10rem] truncate rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[11px] text-fg/62'>
                              {itemLabel}
                            </span>
                          ) : null}
                          {hasVal ? (
                            <span className='rounded-full border border-emerald-300/14 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300'>
                              {ta('badgeApplicable')}
                            </span>
                          ) : null}
                        </div>
                        <ResumeQuillHtml
                          html={f.optimizeReason}
                          className='mt-1.5 text-[12px] leading-relaxed text-fg/70'
                        />
                        {hasVal ? (
                          <div className='mt-2 rounded-xl border border-fg/[0.06] bg-surface/[0.03] px-3 py-2'>
                            <span className='block text-[11px] uppercase tracking-[0.18em] text-fg/58'>
                              {ta('badgeSuggest')}
                            </span>
                            <ResumeQuillHtml
                              html={f.optimizeValue}
                              className='mt-1 text-[12px] leading-relaxed text-fg/60'
                            />
                            <button
                              type='button'
                              onClick={() => onApply(f)}
                              className='cursor-pointer mt-2 inline-flex items-center rounded-lg border border-emerald-300/16 bg-emerald-400/12 px-2.5 py-1 text-[12px] font-medium text-emerald-300 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-emerald-300/28 hover:bg-emerald-400/18'
                            >
                              {ta('applyOne')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              </>
            ) : loading ? (
              <div className='min-h-[80px]' aria-hidden />
            ) : (
              <EmptyAnalysisHint />
            )}
          </div>
        ),
      },
    ],
    [loading, fieldList, actionableCount, onApply, onApplyAll, ta]
  );
  return (
    <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 text-left'>
      {loading ? (
        <div className='absolute inset-0 z-[8] flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--panel-scrim)] backdrop-blur-sm'>
          <Spin size='large' />
          <span className='text-[12px] text-fg/55'>{ta('analyzing')}</span>
        </div>
      ) : null}
      <section className={`${panelShellClass} shrink-0 px-4 pb-4 pt-4`}>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <p className='text-[12px] uppercase tracking-[0.16em] text-fg/58'>{ta('scoreCardTitle')}</p>
            <p className={`mt-1 text-[13px] text-primary font-medium ${scoreState.tone}`}>{scoreState.label}</p>
          </div>
          <div className='flex items-center gap-2 text-[11px] text-fg/58'>
            <span className='rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-1'>{ta('chipExcellent', { n: excellentCount })}</span>
            <span className='rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-1'>{ta('chipPending', { n: pendingCount })}</span>
          </div>
        </div>
        <div className='relative mx-auto w-full max-w-[220px]'>
          <GaugeRing gradId={gradId} score={score} />
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 pt-6'>
            <span className='text-[38px] font-bold leading-none text-fg/95'>
              <span>{score}</span>
              <span className='text-[15px] font-bold relative top-[-2px]'>{ta('scoreUnit')}</span>
            </span>
          </div>
        </div>
        <div className='mt-3 grid grid-cols-2 gap-2'>
          <div className='rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-2.5'>
            <p className='text-[11px] uppercase tracking-[0.14em] text-fg/58'>{ta('applicableSectionTitle')}</p>
            <p className='mt-1 text-[16px] font-semibold text-fg/92'>{actionableCount}</p>
          </div>
          <div className='rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-2.5'>
            <p className='text-[11px] uppercase tracking-[0.14em] text-fg/58'>{ta('dimensionsSectionTitle')}</p>
            <p className='mt-1 text-[16px] font-semibold text-fg/92'>{dimensionRows.length}</p>
          </div>
        </div>
      </section>
      <div className={`${panelShellClass} ${collapsePanelClass}`}>
        <Collapse
          bordered={false}
          ghost
          expandIconPosition='end'
          defaultActiveKey={['panel']}
          expandIcon={collapseExpandIcon}
          items={scoreDetailItems}
        />
      </div>
      <div className={`${panelShellClass} ${collapsePanelClass}`}>
        <Collapse
          bordered={false}
          ghost
          expandIconPosition='end'
          defaultActiveKey={['panel']}
          expandIcon={collapseExpandIcon}
          items={suggestionItems}
        />
      </div>
    </div>
  );
}

export default memo(AiScore);
