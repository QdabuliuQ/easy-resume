'use client';
import { Book, Briefcase, Notes, Right, Setting, Up } from '@icon-park/react';
import { App, Collapse, Spin } from 'antd';
import { memo, useCallback, useId, useMemo, type ComponentType } from 'react';
import type { ResumeAiAnalyzeResult, ResumeAiFieldOptimize } from '@/api/resumeAiScoreAnalyze';
import { configStore, moduleActiveStore } from '@/mobx';
import { moduleType as moduleTypeMeta } from '@/modules/utils/constant';

const PRIMARY_FILL = 'var(--color-primary)';
const panelShellClass =
  'overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.025)_100%),rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_34px_rgba(0,0,0,0.12)]';

function clampScore0to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreMeta(score: number) {
  if (score >= 90) return { label: '竞争力很强', tone: 'text-emerald-300', chip: 'bg-emerald-400/14 text-emerald-300 border-emerald-300/20' };
  if (score >= 75) return { label: '基础扎实，可继续打磨', tone: 'text-amber-200', chip: 'bg-amber-300/14 text-amber-200 border-amber-200/20' };
  return { label: '建议优先补齐关键信息', tone: 'text-rose-200', chip: 'bg-rose-300/14 text-rose-200 border-rose-200/20' };
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
type MessageApi = ReturnType<typeof App.useApp>['message'];

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

function applyFieldOptimize(item: ResumeAiFieldOptimize, messageApi: MessageApi) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    messageApi.warning('暂无简历配置');
    return;
  }
  const next = JSON.parse(JSON.stringify(cfg)) as ResumeDraft;
  if (!applyOneToDraft(next, item)) {
    messageApi.error(!cfg.pages[item.pageIndex] ? '页面不存在' : '未找到对应模块');
    return;
  }
  configStore.setConfig(next);
  messageApi.success('修改完成');
}

function applyAllFieldOptimizes(list: ResumeAiFieldOptimize[], messageApi: MessageApi) {
  const cfg = configStore.getConfig;
  if (!cfg?.pages?.length) {
    messageApi.warning('暂无简历配置');
    return;
  }
  const toApply = list.filter(
    (f) => typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
  );
  if (toApply.length === 0) {
    messageApi.info('暂无可应用的建议（需含「建议修改」内容）');
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
  if (fail === 0) messageApi.success(`已批量应用 ${ok} 条建议`);
  else messageApi.warning(`已应用 ${ok} 条，${fail} 条未匹配到模块`);
}

function EmptyAnalysisHint() {
  return (
    <div className='rounded-2xl border border-dashed border-white/[0.09] bg-black/10 px-4 py-6 text-center'>
      <p className='text-[12px] font-medium text-white/72'>暂无分析结果</p>
      <p className='mt-1 text-[11px] leading-relaxed text-white/42'>
        完成一次分析后，这里会展示评分拆解与可直接应用的优化建议。
      </p>
    </div>
  );
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
  const { message: messageApi } = App.useApp();
  const gradId = useId().replace(/:/g, '');
  const score = clampScore0to100(
    typeof scoreProp === 'number' ? scoreProp : analysis?.totalScore ?? 0
  );
  const scoreState = scoreMeta(score);
  const dimensionRows = analysis?.dimensionEvaluate?.length ? analysis.dimensionEvaluate : [];
  const fieldList = analysis?.fieldOptimizeList?.length ? analysis.fieldOptimizeList : [];
  const excellentCount = dimensionRows.filter((row) => row.status === '优秀').length;
  const pendingCount = dimensionRows.filter((row) => row.status === '待补充').length;
  const actionableCount = fieldList.filter(
    (f) => typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0
  ).length;
  const onApply = useCallback((item: ResumeAiFieldOptimize) => {
    applyFieldOptimize(item, messageApi);
  }, [messageApi]);
  const onApplyAll = useCallback(() => {
    applyAllFieldOptimizes(fieldList, messageApi);
  }, [fieldList, messageApi]);
  const scoreDetailItems = useMemo(
    () => [
      {
        key: 'panel',
        label: (
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate font-medium text-white/92'>评分明细</span>
            <span className='rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/55'>
              {dimensionRows.length || 0} 项
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
                  return (
                    <div
                      key={`${row.dimensionName}-${i}`}
                      className='rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.045]'
                    >
                      <div className='flex gap-3'>
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/25'>
                        <Icon theme='filled' size={20} fill={tone.fill} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2 text-[13px]'>
                          <span className='font-medium text-white/92'>{row.dimensionName}</span>
                          <span className={`inline-flex items-center rounded-full border border-white/[0.06] px-2 py-0.5 text-[11px] ${tone.text}`}>
                            <span className={`mr-1 size-1.5 shrink-0 rounded-full ${tone.dot}`} />
                            {row.status}
                          </span>
                        </div>
                        <p className='mt-1.5 text-[11px] leading-relaxed text-white/48'>
                          简历说明：{row.remark}
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
    [loading, dimensionRows]
  );
  const suggestionItems = useMemo(
    () => [
      {
        key: 'panel',
        label: (
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate font-medium text-white/92'>AI 优化建议</span>
            <span className='rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/55'>
              {actionableCount} 条可应用
            </span>
          </div>
        ),
        children: (
          <div className='mt-[5px]'>
            {fieldList.length > 0 ? (
              <>
                <div className='flex items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-2.5'>
                  <div className='min-w-0'>
                    <p className='text-[12px] font-medium text-white/88'>可直接写回简历</p>
                    <p className='mt-0.5 text-[11px] leading-relaxed text-white/42'>
                      优先处理可量化成果、角色职责与技能表述。
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
                    一键应用
                  </button>
                </div>
              <ul className='flex flex-col gap-2 pt-2'>
                {fieldList.map((f) => {
                  const hasVal = typeof f.optimizeValue === 'string' && f.optimizeValue.trim().length > 0;
                  return (
                    <li
                      key={`${f.pageIndex}-${f.moduleId}-${f.fieldKey}`}
                      className='rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-3 text-[12px] leading-snug text-white/55 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.045]'
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
                          <span className='rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70'>
                            {moduleTypeLabel(f.moduleType)}
                          </span>
                          {hasVal ? (
                            <span className='rounded-full border border-emerald-300/14 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300'>
                              可应用
                            </span>
                          ) : null}
                        </div>
                        <p className='mt-1.5 text-[12px] leading-relaxed text-white/70'>
                          {f.optimizeReason}
                        </p>
                        {hasVal ? (
                          <div className='mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2'>
                            <span className='block text-[11px] uppercase tracking-[0.18em] text-white/35'>
                              建议修改
                            </span>
                            <span className='mt-1 block text-[12px] leading-relaxed text-white/60'>
                              {f.optimizeValue}
                            </span>
                            <button
                              type='button'
                              onClick={() => onApply(f)}
                              className='cursor-pointer mt-2 inline-flex items-center rounded-lg border border-emerald-300/16 bg-emerald-400/12 px-2.5 py-1 text-[12px] font-medium text-emerald-300 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-emerald-300/28 hover:bg-emerald-400/18'
                            >
                              应用
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
    [loading, fieldList, actionableCount, onApply, onApplyAll]
  );
  return (
    <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 text-left'>
      {loading ? (
        <div className='absolute inset-0 z-[8] flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#1c1b1f]/58 backdrop-blur-sm'>
          <Spin size='large' />
          <span className='text-[12px] text-white/55'>正在分析简历…</span>
        </div>
      ) : null}
      <section className={`${panelShellClass} shrink-0 px-4 pb-4 pt-4`}>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <p className='text-[12px] uppercase tracking-[0.16em] text-white/38'>智能综合评分</p>
            <p className={`mt-1 text-[13px] font-medium ${scoreState.tone}`}>{scoreState.label}</p>
          </div>
          <div className='flex items-center gap-2 text-[11px] text-white/45'>
            <span className='rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1'>优秀 {excellentCount}</span>
            <span className='rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1'>待补充 {pendingCount}</span>
          </div>
        </div>
        <div className='relative mx-auto w-full max-w-[220px]'>
          <GaugeRing gradId={gradId} score={score} />
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 pt-6'>
            <span className='text-[38px] font-bold leading-none text-white/95'>
              <span>{score}</span>
              <span className='text-[15px] font-bold relative top-[-2px]'>分</span>
            </span>
          </div>
        </div>
        <div className='mt-3 grid grid-cols-2 gap-2'>
          <div className='rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-2.5'>
            <p className='text-[11px] uppercase tracking-[0.14em] text-white/34'>可应用建议</p>
            <p className='mt-1 text-[16px] font-semibold text-white/92'>{actionableCount}</p>
          </div>
          <div className='rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-2.5'>
            <p className='text-[11px] uppercase tracking-[0.14em] text-white/34'>分析维度</p>
            <p className='mt-1 text-[16px] font-semibold text-white/92'>{dimensionRows.length}</p>
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
