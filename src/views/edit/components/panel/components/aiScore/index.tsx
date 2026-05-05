'use client';
import { Briefcase, Notes, Right, Setting, Up } from '@icon-park/react';
import { Collapse } from 'antd';
import { memo, useId } from 'react';
import aiScore from '@/assets/ai-score.svg';

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
      <path
        d={d}
        fill='none'
        stroke={`url(#${gradId})`}
        strokeWidth='14'
        strokeLinecap='round'
        pathLength={100}
        strokeDasharray={dash}
      />
    </svg>
  );
}

const collapsePanelClass =
  '[&_.ant-collapse]:!border-white/[0.06] [&_.ant-collapse-item]:!border-white/[0.06] [&_.ant-collapse-header]:!items-center [&_.ant-collapse-header]:!min-h-0 [&_.ant-collapse-header]:!py-2.5 [&_.ant-collapse-header]:!px-3 [&_.ant-collapse-header]:!text-[13px] [&_.ant-collapse-header]:!text-white/90 [&_.ant-collapse-header]:!rounded-none [&_.ant-collapse-header]:hover:!bg-white/[0.04] [&_.ant-collapse-content]:!border-white/[0.06] [&_.ant-collapse-content-box]:!px-3 [&_.ant-collapse-content-box]:!pb-3 [&_.ant-collapse-content-box]:!pt-1';

const scoreDetailItems = [
  {
    key: 'panel',
    label: '评分明细',
    children: (
      <div className='divide-y divide-white/[0.06]'>
        <div className='flex gap-3 py-3 first:pt-1'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/25'>
            <Setting theme='filled' size={20} fill='#34d399' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-1.5 text-[13px]'>
              <span className='text-white/90'>简历结构</span>
              <span className='size-1.5 shrink-0 rounded-full bg-emerald-400' />
              <span className='text-emerald-400'>优秀</span>
            </div>
            <p className='mt-1 line-clamp-2 text-[11px] leading-snug text-white/45'>
              简历说明：格式干净简约，简历感清晰，模块划分合理。
            </p>
          </div>
        </div>
        <div className='flex gap-3 py-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/25'>
            <Notes theme='filled' size={20} fill='#fbbf24' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-1.5 text-[13px]'>
              <span className='text-white/90'>技能关键词</span>
              <span className='size-1.5 shrink-0 rounded-full bg-amber-400' />
              <span className='text-amber-400'>待优化</span>
            </div>
            <p className='mt-1 line-clamp-2 text-[11px] leading-snug text-white/45'>
              简历说明：添加更多与目标岗位匹配的技术关键词。
            </p>
          </div>
        </div>
        <div className='flex gap-3 py-3 last:pb-1'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/25'>
            <Briefcase theme='filled' size={20} fill='#f87171' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-1.5 text-[13px]'>
              <span className='text-white/90'>工作经历</span>
              <span className='size-1.5 shrink-0 rounded-full bg-red-400' />
              <span className='text-red-400'>需补充</span>
            </div>
            <p className='mt-1 line-clamp-2 text-[11px] leading-snug text-white/45'>
              简历说明：建议补充量化成果与项目结果描述。
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

const suggestionItems = [
  {
    key: 'panel',
    label: 'AI 优化建议',
    children: (
      <ul className='flex flex-col gap-2.5 pt-1'>
        {[
          '建议更具体地描述您在重点项目中的职责边界与交付结果。',
          '技能区可增加与岗位 JD 重合度高的工具链与中间件名称。',
          '工作经历按 STAR 补充背景、行动与量化指标，便于 ATS 解析。',
        ].map((t) => (
          <li key={t} className='flex gap-2 text-[12px] leading-snug text-white/55'>
            <Right theme='filled' size={14} fill='#38bdf8' className='mt-0.5 shrink-0' />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

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

function AiScore({ score: scoreProp = 88 }: { score?: number }) {
  const score = clampScore0to100(scoreProp);
  const gradId = useId().replace(/:/g, '');
  return (
    <div className='flex h-full min-h-0 flex-col gap-3 overflow-auto text-left'>
      <header className='flex shrink-0 items-start justify-between gap-2 px-0.5 pt-0.5'>
        <h1 className='bg-gradient-primary bg-clip-text text-[18px] font-bold leading-tight text-transparent select-none flex items-center'>
        <img src={aiScore.src} alt='' className='w-[40px] object-contain p-1' width={aiScore.width} height={aiScore.height} />
          AI 智能评分分析
        </h1>
      </header>
      <section className='shrink-0 rounded-lg border border-white/[0.06] bg-[#2a292d] px-3 pb-4 pt-3'>
        <p className='mb-1 text-center text-[12px] text-white/45'>智能综合评分</p>
        <div className='relative mx-auto w-full max-w-[220px]'>
          <GaugeRing gradId={gradId} score={score} />
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1 pt-6'>
            <span className='text-[28px] font-bold leading-none text-white/95'>
              <span>{score}</span>
              <span className='text-[20px] font-bold'>分</span>
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
