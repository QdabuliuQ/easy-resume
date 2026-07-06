'use client';
import { Book, Briefcase, DocDetail, Edit, Notes, Setting, Star, Up } from '@icon-park/react';
import { Collapse, Spin } from 'antd';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { memo, useId, useMemo, type ComponentType } from 'react';
import { photo6 } from '@/lib/brandAssets';
import type { ResumeAiScoreResult } from '@/lib/ai/score/types';
import GaugeRing from './gaugeRing';
import { clampScore0to100, scoreMeta } from './scoreMeta';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.07)_0%,rgb(var(--panel-surface-rgb)/0.02)_100%)]';
const collapsePanelClass =
  '[&_.ant-collapse]:!border-0 [&_.ant-collapse-item]:!border-0 [&_.ant-collapse-header]:!relative [&_.ant-collapse-header]:!z-[2] [&_.ant-collapse-header]:!shrink-0 [&_.ant-collapse-header]:!items-center [&_.ant-collapse-header]:!border-b [&_.ant-collapse-header]:!border-fg/[0.06] [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-header]:!px-4 [&_.ant-collapse-header]:!text-[13px] [&_.ant-collapse-header]:!text-fg/90 [&_.ant-collapse-header]:!rounded-none [&_.ant-collapse-header]:hover:!bg-surface/[0.03] [&_.ant-collapse-content]:!relative [&_.ant-collapse-content]:!z-0 [&_.ant-collapse-content]:!border-0 [&_.ant-collapse-content-box]:!px-4 [&_.ant-collapse-content-box]:!pb-4 [&_.ant-collapse-content-box]:!pt-0 [&_.ant-collapse-content-box]:!isolate';
const analyzeBtnClass =
  'bg-add-module-gradient relative isolate flex h-11 w-full cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-xl text-[14px] font-semibold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] outline-none transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const DIM_ICONS: ComponentType<{ theme?: 'outline' | 'filled'; size?: number; fill?: string; className?: string }>[] = [
  Setting,
  Notes,
  Briefcase,
  Book,
];
const EMPTY_DIMENSION_ROWS: NonNullable<ResumeAiScoreResult['dimensionEvaluate']> = [];

function statusTone(status: string): { dot: string; text: string; fill: string } {
  if (status === '优秀')
    return { dot: 'bg-emerald-400', text: 'text-emerald-400', fill: 'var(--panel-tone-emerald)' };
  if (status === '待补充')
    return { dot: 'bg-violet-400', text: 'text-violet-300', fill: 'rgb(167 139 250)' };
  return { dot: 'bg-amber-400', text: 'text-amber-400', fill: 'var(--panel-tone-amber)' };
}

function EmptyAnalysisHint() {
  const ta = useTranslations('Edit.aiScore');
  return (
    <div className='rounded-2xl border border-dashed border-fg/[0.1] bg-[var(--panel-inset-bg)] px-4 py-5 text-center'>
      <div className='mx-auto mb-3 w-[min(148px,52%)]'>
        <Image
          src={photo6}
          alt=''
          width={400}
          height={400}
          className='h-auto w-full'
          loading='lazy'
        />
      </div>
      <p className='text-[13px] font-medium text-fg/82'>{ta('emptyTitle')}</p>
      <p className='mx-auto mt-1.5 max-w-[28ch] text-[11px] leading-relaxed text-fg/55'>{ta('emptyHint')}</p>
    </div>
  );
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className='flex min-h-[88px] flex-col items-center justify-center gap-2 py-5'>
      <Spin size='small' />
      <span className='text-[11px] text-fg/55'>{label}</span>
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
  scoreLoading = false,
  analysis = null,
  onAnalyze,
}: {
  score?: number;
  scoreLoading?: boolean;
  analysis?: ResumeAiScoreResult | null;
  onAnalyze?: () => void;
}) {
  const ta = useTranslations('Edit.aiScore');
  const gradId = useId().replace(/:/g, '');
  const score = clampScore0to100(typeof scoreProp === 'number' ? scoreProp : analysis?.totalScore ?? 0);
  const scoreState = useMemo(() => scoreMeta(score, ta), [score, ta]);
  const dimensionRows = analysis?.dimensionEvaluate ?? EMPTY_DIMENSION_ROWS;
  const excellentCount = dimensionRows.filter((row) => row.status === '优秀').length;
  const pendingCount = dimensionRows.filter((row) => row.status === '待补充').length;
  const scoreDetailItems = useMemo(
    () => [
      {
        key: 'panel',
        label: (
          <div className='flex min-w-0 items-center gap-2'>
            <DocDetail theme='outline' size={16} fill='var(--color-primary)' className='shrink-0' />
            <span className='truncate font-medium text-fg/92'>{ta('dimensionsTitle')}</span>
            <span className='rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2 py-0.5 text-[11px] text-fg/55'>
              {ta('dimensionsCount', { n: dimensionRows.length || 0 })}
            </span>
          </div>
        ),
        children: (
          <div className='pb-1 pt-2'>
            {dimensionRows.length > 0 ? (
              <div className='flex flex-col gap-2'>
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
                      className='rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-3 transition-colors hover:border-fg/[0.12]'
                    >
                      <div className='flex gap-3'>
                        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fg/[0.06] bg-[var(--panel-inset-bg-strong)]'>
                          <Icon theme='filled' size={20} fill={tone.fill} />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2 text-[13px]'>
                            <span className='font-medium text-fg/92'>{row.dimensionName}</span>
                            <span
                              className={`inline-flex items-center rounded-full border border-fg/[0.06] px-2 py-0.5 text-[11px] ${tone.text}`}
                            >
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
            ) : scoreLoading ? (
              <SectionLoading label={ta('analyzing')} />
            ) : (
              <EmptyAnalysisHint />
            )}
          </div>
        ),
      },
    ],
    [scoreLoading, dimensionRows, ta],
  );
  return (
    <div className='relative flex h-full min-h-0 flex-col'>
      <div className='min-h-0 flex-1 overflow-auto pb-3'>
        <section className={`${panelShellClass} relative px-4 pb-4 pt-4`}>
          {scoreLoading ? (
            <div className='absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--panel-scrim)]/80 backdrop-blur-[2px]'>
              <Spin size='default' />
              <span className='text-[11px] text-fg/55'>{ta('analyzing')}</span>
            </div>
          ) : null}
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <Star theme='filled' size={16} fill='var(--color-primary)' className='shrink-0' />
              <p className='text-[14px] font-semibold text-fg/92'>{ta('scoreCardTitle')}</p>
            </div>
            <div className='flex shrink-0 items-center gap-1.5 text-[11px]'>
              <span className='rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-emerald-300/90'>
                {ta('chipExcellent', { n: excellentCount })}
              </span>
              <span className='rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-violet-300/90'>
                {ta('chipPending', { n: pendingCount })}
              </span>
            </div>
          </div>
          <p className={`mt-3 text-[15px] font-semibold leading-snug ${scoreState.tone}`}>{scoreState.label}</p>
          <p className='mt-1 text-[12px] text-fg/55'>{ta('scoreSubtitle')}</p>
          <div className='relative mx-auto mt-4 w-full max-w-[220px]'>
            <GaugeRing gradId={gradId} score={score} />
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-0.5 pt-5'>
              <span className='text-[36px] font-bold leading-none text-fg/95'>
                {score}
                <span className='ml-0.5 text-[14px] font-semibold'>{ta('scoreUnit')}</span>
              </span>
              <span className='mt-1 text-[11px] text-fg/52'>{ta('scoreGaugeLabel')}</span>
            </div>
          </div>
          <div className='mt-4 grid grid-cols-2 gap-2.5'>
            <div className='rounded-2xl border border-emerald-400/15 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent)] px-3 py-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10'>
                <Star theme='outline' size={18} fill='var(--color-primary)' />
              </div>
              <p className='mt-2.5 text-[12px] font-medium text-fg/78'>{ta('chipExcellentLabel')}</p>
              <p className='mt-1 text-[22px] font-bold leading-none text-fg/95'>
                {excellentCount}
                <span className='ml-1 text-[12px] font-medium text-fg/55'>{ta('countUnit')}</span>
              </p>
              <p className='mt-1.5 text-[10px] leading-relaxed text-fg/48'>{ta('excellentCardDesc')}</p>
            </div>
            <div className='rounded-2xl border border-violet-400/15 bg-[linear-gradient(145deg,rgb(139_92_246/0.1),transparent)] px-3 py-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/25 bg-violet-400/10'>
                <Edit theme='outline' size={18} fill='rgb(167 139 250)' />
              </div>
              <p className='mt-2.5 text-[12px] font-medium text-fg/78'>{ta('pendingCardLabel')}</p>
              <p className='mt-1 text-[22px] font-bold leading-none text-fg/95'>
                {pendingCount}
                <span className='ml-1 text-[12px] font-medium text-fg/55'>{ta('countUnit')}</span>
              </p>
              <p className='mt-1.5 text-[10px] leading-relaxed text-fg/48'>{ta('pendingCardDesc')}</p>
            </div>
          </div>
        </section>
        <div className={`${panelShellClass} mt-3 ${collapsePanelClass}`}>
          <Collapse
            bordered={false}
            ghost
            expandIconPosition='end'
            defaultActiveKey={['panel']}
            expandIcon={collapseExpandIcon}
            items={scoreDetailItems}
          />
        </div>
      </div>
      {onAnalyze ? (
        <div className='shrink-0 border-t border-fg/[0.06] bg-[linear-gradient(180deg,transparent,rgb(var(--panel-surface-rgb)/0.04))] px-1 pt-3'>
          <button
            type='button'
            disabled={scoreLoading}
            aria-busy={scoreLoading}
            onClick={onAnalyze}
            className={analyzeBtnClass}
          >
            {scoreLoading ? (
              <span
                className='relative z-[1] inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white'
                aria-hidden
              />
            ) : (
              <Star theme='filled' size={16} fill='#fff' className='relative z-[1]' />
            )}
            <span className='relative z-[1]'>{ta('startAnalyze')}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default memo(AiScore);
