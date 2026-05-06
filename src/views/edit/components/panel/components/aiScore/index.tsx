'use client';
import { Book, Briefcase, Notes, Right, Setting, Up } from '@icon-park/react';
import { Collapse, message, Spin } from 'antd';
import { memo, useCallback, useId, useMemo, type ComponentType } from 'react';
import type { ResumeAiAnalyzeResult, ResumeAiFieldOptimize } from '@/api/resumeAiScoreAnalyze';
import aiScore from '@/assets/ai-score.svg';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType as moduleTypeMeta } from '@/modules/utils/constant';

const PRIMARY_FILL = 'var(--color-primary)';

function clampScore0to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
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
        stroke='#3f3f46'
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
  '[&_.ant-collapse]:!border-white/[0.06] [&_.ant-collapse-item]:!border-white/[0.06] [&_.ant-collapse-header]:!relative [&_.ant-collapse-header]:!z-[2] [&_.ant-collapse-header]:!shrink-0 [&_.ant-collapse-header]:!items-center [&_.ant-collapse-header]:!border-b [&_.ant-collapse-header]:!border-white/[0.06] [&_.ant-collapse-header]:!py-2.5 [&_.ant-collapse-header]:!px-3 [&_.ant-collapse-header]:!text-[13px] [&_.ant-collapse-header]:!text-white/90 [&_.ant-collapse-header]:!rounded-none [&_.ant-collapse-header]:hover:!bg-white/[0.04] [&_.ant-collapse-content]:!relative [&_.ant-collapse-content]:!z-0 [&_.ant-collapse-content]:!border-white/[0.06] [&_.ant-collapse-content-box]:!px-3 [&_.ant-collapse-content-box]:!pb-3 [&_.ant-collapse-content-box]:!pt-1 [&_.ant-collapse-content-box]:!isolate';

const DIM_ICONS: ComponentType<{ theme?: 'outline' | 'filled'; size?: number; fill?: string; className?: string }>[] = [
  Setting,
  Notes,
  Briefcase,
  Book,
];

function statusTone(status: string): { dot: string; text: string; fill: string } {
  if (status === '优秀') return { dot: 'bg-emerald-400', text: 'text-emerald-400', fill: '#34d399' };
  if (status === '待补充') return { dot: 'bg-red-400', text: 'text-red-400', fill: '#f87171' };
  return { dot: 'bg-amber-400', text: 'text-amber-400', fill: '#fbbf24' };
}

function tokenizeFieldKey(fieldKey: string): Array<string | number> {
  const out: Array<string | number> = [];
  const re = /(\w+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fieldKey)) !== null) {
    if (m[1] !== undefined) out.push(m[1]);
    else out.push(Number(m[2]));
  }
  return out;
}

function setOptionsByFieldKey(options: Record<string, unknown>, fieldKey: string, value: unknown) {
  const tokens = tokenizeFieldKey(fieldKey);
  if (tokens.length === 0) {
    options[fieldKey] = value;
    return;
  }
  let cur: unknown = options;
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = tokens[i];
    const nextTok = tokens[i + 1];
    let child: unknown = Array.isArray(cur)
      ? (cur as unknown[])[key as number]
      : (cur as Record<string, unknown>)[String(key)];
    if (child == null || typeof child !== 'object') {
      child = typeof nextTok === 'number' ? [] : {};
      if (Array.isArray(cur)) (cur as unknown[])[key as number] = child;
      else (cur as Record<string, unknown>)[String(key)] = child as object;
    }
    cur = child;
  }
  const last = tokens[tokens.length - 1];
  if (Array.isArray(cur)) (cur as unknown[])[last as number] = value;
  else (cur as Record<string, unknown>)[String(last)] = value;
}

function moduleTypeLabel(mt: string): string {
  const meta = moduleTypeMeta[mt as keyof typeof moduleTypeMeta];
  return meta?.name ?? mt;
}

type ResumeDraft = NonNullable<ReturnType<typeof configStore.getConfig>>;

function applyOneToDraft(draft: ResumeDraft, item: ResumeAiFieldOptimize): boolean {
  if (!draft.pages[item.pageIndex]) return false;
  const mod = draft.pages[item.pageIndex].modules?.find(
    (m: { id: string; type: string }) => m.id === item.moduleId && m.type === item.moduleType
  );
  if (!mod) return false;
  const opts =
    mod.options && typeof mod.options === 'object'
      ? (mod.options as Record<string, unknown>)
      : {};
  setOptionsByFieldKey(opts, item.fieldKey, item.optimizeValue);
  mod.options = opts;
  return true;
}

function applyFieldOptimize(item: ResumeAiFieldOptimize) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    message.warning('暂无简历配置');
    return;
  }
  const next = JSON.parse(JSON.stringify(cfg)) as ResumeDraft;
  if (!applyOneToDraft(next, item)) {
    message.error(!cfg.pages[item.pageIndex] ? '页面不存在' : '未找到对应模块');
    return;
  }
  configStore.setConfig(next);
  message.success('修改完成');
}

function applyAllFieldOptimizes(list: ResumeAiFieldOptimize[]) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    message.warning('暂无简历配置');
    return;
  }
  const toApply = list.filter(
    (f) => typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
  );
  if (toApply.length === 0) {
    message.info('暂无可应用的建议（需含「建议修改」内容）');
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
  if (fail === 0) message.success(`已批量应用 ${ok} 条建议`);
  else message.warning(`已应用 ${ok} 条，${fail} 条未匹配到模块`);
}

function EmptyAnalysisHint() {
  return <div className='py-6 text-center text-[12px] text-white/40'>暂无分析结果</div>;
}

function collapseExpandIcon({ isActive }: { isActive?: boolean }) {
  return (
    <Up
      theme='outline'
      size={14}
      fill='rgba(255,255,255,0.45)'
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
  hasAnalysis?: boolean;
  loading?: boolean;
  analysis?: ResumeAiAnalyzeResult | null;
}) {
  const gradId = useId().replace(/:/g, '');
  const score = clampScore0to100(
    typeof scoreProp === 'number' ? scoreProp : analysis?.totalScore ?? 0
  );
  const dimensionRows = analysis?.dimensionEvaluate?.length ? analysis.dimensionEvaluate : [];
  const fieldList = analysis?.fieldOptimizeList?.length ? analysis.fieldOptimizeList : [];
  const onApply = useCallback((item: ResumeAiFieldOptimize) => {
    applyFieldOptimize(item);
  }, []);
  const onApplyAll = useCallback(() => {
    applyAllFieldOptimizes(fieldList);
  }, [fieldList]);
  const scoreDetailItems = useMemo(
    () => [
      {
        key: 'panel',
        label: '评分明细',
        children: (
          <div className='mt-[5px]'>
            {dimensionRows.length > 0 ? (
              <div className='divide-y divide-white/[0.06]'>
                {dimensionRows.map((row, i) => {
                  const Icon = DIM_ICONS[i % DIM_ICONS.length] ?? Setting;
                  const tone = statusTone(row.status);
                  const isLast = i === dimensionRows.length - 1;
                  return (
                    <div
                      key={`${row.dimensionName}-${i}`}
                      className={`flex gap-3 py-3 ${i === 0 ? 'pt-1' : ''} ${isLast ? 'pb-1' : ''}`}
                    >
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/25'>
                        <Icon theme='filled' size={20} fill={tone.fill} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-1.5 text-[13px]'>
                          <span className='text-white/90'>{row.dimensionName}</span>
                          <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} />
                          <span className={tone.text}>{row.status}</span>
                        </div>
                        <p className='mt-1 text-[11px] leading-snug text-white/45'>
                          简历说明：{row.remark}
                        </p>
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
    [loading, dimensionRows]
  );
  const suggestionItems = useMemo(
    () => [
      {
        key: 'panel',
        label: 'AI 优化建议',
        children: (
          <div className='mt-[5px]'>
            {fieldList.length > 0 ? (
              <>
                <div className='flex pt-0.5'>
                  <button
                    type='button'
                    onClick={onApplyAll}
                    disabled={
                      !fieldList.some(
                        (f) =>
                          typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
                      )
                    }
                    className='cursor-pointer block w-full rounded-md bg-emerald-500/20 px-3 py-1.5 text-[12px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-35'
                  >
                    一键应用
                  </button>
                </div>
              <ul className='flex flex-col gap-1 pt-1'>
                {fieldList.map((f) => {
                  const hasVal = typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0;
                  return (
                    <li
                      key={`${f.pageIndex}-${f.moduleId}-${f.fieldKey}`}
                      className='flex gap-2 rounded-md px-2.5 py-2 text-[12px] leading-snug text-white/55 transition-colors hover:bg-white/[0.06]'
                      onMouseEnter={() => moduleActiveStore.setModuleActive(f.moduleId)}
                      onMouseLeave={() => {
                        if (moduleActiveStore.getModuleActive === f.moduleId) {
                          moduleActiveStore.setModuleActive('global');
                        }
                      }}
                    >
                      <Right theme='filled' size={14} fill={PRIMARY_FILL} className='mt-0.5 shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-white/55'>
                          <b className='font-semibold text-white/90'>{moduleTypeLabel(f.moduleType)}</b>
                          ：{f.optimizeReason}
                        </span>
                        {hasVal ? (
                          <div className='mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
                            <span className='text-white/50'>
                              建议修改：{f.optimizeValue}
                            </span>
                            <button
                              type='button'
                              onClick={() => onApply(f)}
                              className='shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline'
                            >
                              应用
                            </button>
                          </div>
                        ) : null}
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
    [loading, fieldList, onApply, onApplyAll]
  );
  return (
    <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto text-left'>
      {loading ? (
        <div className='absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#1c1b1f]/55 backdrop-blur-sm rounded-sm'>
          <Spin size='large' />
          <span className='text-[12px] text-white/55'>正在分析简历…</span>
        </div>
      ) : null}
      <header className='flex shrink-0 items-start justify-between gap-2 px-0.5 pt-0.5'>
        <h1 className='bg-gradient-primary bg-clip-text text-[18px] font-bold leading-tight text-transparent select-none flex items-center'>
          <img src={aiScore.src} alt='' className='w-[40px] object-contain p-1' width={aiScore.width} height={aiScore.height} />
          AI 智能评分分析
        </h1>
      </header>
      <section className='shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-[#2a292d] px-3 pb-4 pt-4'>
        <p className='mb-1 text-center text-[12px] text-white/45'>智能综合评分</p>
        <div className='relative mx-auto w-full max-w-[220px]'>
          <GaugeRing gradId={gradId} score={score} />
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 pt-6'>
            <span className='text-[38px] font-bold leading-none text-white/95'>
              <span>{score}</span>
              <span className='text-[15px] font-bold relative top-[-2px]'>分</span>
            </span>
          </div>
        </div>
      </section>
      <div className={`overflow-hidden rounded-lg border border-white/[0.06] bg-[#2a292d] ${collapsePanelClass}`}>
        <Collapse
          bordered={false}
          ghost
          expandIconPosition='end'
          defaultActiveKey={['panel']}
          expandIcon={collapseExpandIcon}
          items={scoreDetailItems}
        />
      </div>
      <div className={`overflow-hidden rounded-lg border border-white/[0.06] bg-[#2a292d] ${collapsePanelClass}`}>
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
