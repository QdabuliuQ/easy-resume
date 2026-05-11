'use client';
// 纸张：GlobalStyle.pageSize；顶栏窄屏 Popover：../../views/edit/components/header；PDF/PNG：./sectionHeaderHtml.ts
import {
  FileDoneOutlined,
  ProjectOutlined,
  ReadOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { More } from '@icon-park/react';
import { GlobalStyle } from '@/modules/utils/common.type';
import { memo, type CSSProperties } from 'react';

export type SectionHeaderConfig = {
  title: string;
  moduleType?: string;
  /** 样式 10：NN/ 前缀序号（不含 info1 的模块序，画布/PDF 传入） */
  sectionOrdinal?: number;
};

function HeaderTypeIcon({ moduleType, color }: { moduleType?: string; color: string }) {
  if (moduleType === 'education') {
    return <ReadOutlined style={{ color }} />;
  }
  if (moduleType === 'job') {
    return <SolutionOutlined style={{ color }} />;
  }
  if (moduleType === 'project') {
    return <ProjectOutlined style={{ color }} />;
  }
  if (moduleType === 'skill') {
    return <ThunderboltOutlined style={{ color }} />;
  }
  if (moduleType === 'certificate') {
    return <FileDoneOutlined style={{ color }} />;
  }
  if (moduleType === 'other') {
    return <More theme='outline' size={13} fill='#fff' />;
  }
  return <ReadOutlined style={{ color: '#fff' }} />;
}

export function normHeaderType(gs: GlobalStyle): number {
  const n = Number(gs.headerType);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(10, Math.floor(n));
}

function SectionHeader({
  config,
  globalStyle,
}: {
  config: SectionHeaderConfig;
  globalStyle: GlobalStyle;
}) {
  const { title, moduleType, sectionOrdinal } = config;
  const { color, fontSize } = globalStyle;
  const fsRaw = Number(fontSize);
  const fsNum = Number.isFinite(fsRaw) && fsRaw > 0 ? fsRaw : 13;
  const fs = `${fsNum}px`;
  const triScale = fsNum / 13;
  const triH = Math.max(4, Math.round(6 * triScale));
  const triW = Math.max(6, Math.round(9 * triScale));
  const triGap = Math.max(4, Math.round(5 * triScale));
  const triBoxH = Math.max(16, triH * 2 + 4);
  const triBoxW = Math.max(20, triW + triGap + 4);
  const t = normHeaderType(globalStyle);
  if (t === 7) {
    return (
      <span className='block min-w-0 break-words font-bold leading-snug' style={{ color, fontSize: fs }}>
        {title}
      </span>
    );
  }
  if (t === 2) {
    return (
      <div className='flex w-full flex-col items-center gap-2 py-1'>
        <span className='font-bold leading-none' style={{ color, fontSize: fs }}>
          {title}
        </span>
        <div className='h-px w-full shrink-0' style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (t === 3) {
    const slantPx = 15;
    const trapClip = `polygon(0 0, calc(100% - ${slantPx}px) 0, 100% 100%, 0 100%)`;
    const trapMain: CSSProperties = {
      backgroundColor: color,
      clipPath: trapClip,
    };
    const trapTail: CSSProperties = {
      backgroundColor: color,
      opacity: 0.38,
      clipPath: trapClip,
    };
    return (
      <div className='flex w-full items-end gap-0 py-0.5'>
        <div className='relative inline-flex shrink-0 items-stretch'>
          <div
            className='pointer-events-none absolute inset-y-0.5 z-0 w-full left-[7px] bottom-0'
            style={{
              ...trapTail,
            }}
            aria-hidden
          />
          <div
            className='relative z-[1] flex items-center py-[5px] pl-3 pr-10 font-bold leading-none text-white'
            style={{ ...trapMain, fontSize: fs }}
          >
            {title}
          </div>
        </div>
        <div className='h-px min-w-0 flex-1 opacity-40' style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (t === 4) {
    return (
      <div className='w-full border-b pb-[3px]' style={{ borderColor: color }}>
        <span className='font-bold leading-none' style={{ color, fontSize: fs }}>
          {title}
        </span>
      </div>
    );
  }
  if (t === 5) {
    return (
      <div className='relative w-full flex items-stretch  '>
        <div
          className='pointer-events-none absolute inset-y-0 left-0 z-0 w-full opacity-20'
          style={{ backgroundColor: color, clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)', }}
          aria-hidden
        />
        <div
          className='relative z-[1] flex shrink-0 items-center pl-5 pr-8 py-[4px] font-bold text-white'
          style={{
            backgroundColor: color,
            clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
            fontSize: fs,
          }}
        >
          {title}
        </div>
      </div>
    );
  }
  if (t === 6) {
    const tri: CSSProperties = {
      width: 0,
      height: 0,
      borderTop: `${triH}px solid transparent`,
      borderBottom: `${triH}px solid transparent`,
      borderLeft: `${triW}px solid ${color}`,
    };
    return (
      <div className='flex w-full items-center py-1'>
        <div
          className='relative shrink-0'
          style={{ width: triBoxW, height: triBoxH }}
          aria-hidden
        >
          <span className='absolute top-1/2 left-0 -translate-y-1/2' style={tri} />
          <span
            className='absolute top-1/2 -translate-y-1/2 opacity-40'
            style={{ ...tri, left: triGap }}
          />
        </div>
        <span className='shrink-0 font-bold leading-none mr-[10px]' style={{ color, fontSize: fs }}>
          {title}
        </span>
        <div className='min-h-px min-w-0 flex-1' style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (t === 10) {
    const ord =
      sectionOrdinal != null && Number.isFinite(sectionOrdinal) && sectionOrdinal > 0
        ? `${String(Math.floor(sectionOrdinal)).padStart(2, '0')}/`
        : null;
    const prefixFs = `${Math.max(12, Math.round(fsNum * 0.88))}px`;
    return (
      <div className='w-full py-1 flex items-end'>
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-0.5'>
          {ord ? (
            <span
              className='shrink-0 font-medium tabular-nums leading-none tracking-tight'
              style={{ color, fontSize: prefixFs, opacity: 0.72 }}
            >
              {ord}
            </span>
          ) : null}
          <span className='min-w-0 flex-1 font-bold leading-none' style={{ color, fontSize: fs }}>
            {title}
          </span>
        </div>
        <div className='flex-1 ml-3 h-px w-full shrink-0' style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (t === 9) {
    return (
      <div className='flex w-full items-center gap-3 py-1'>
        <div className='h-px min-w-0 flex-1 shrink-0' style={{ backgroundColor: color }} />
        <span className='shrink-0 whitespace-nowrap font-bold leading-none' style={{ color, fontSize: fs }}>
          {title}
        </span>
        <div className='h-px min-w-0 flex-1 shrink-0' style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (t === 8) {
    return (
      <div className='flex w-full items-center gap-2 py-1'>
        <div
          className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px]'
          style={{ backgroundColor: color }}
          aria-hidden
        >
          <HeaderTypeIcon moduleType={moduleType} color='#fff' />
        </div>
        <span className='font-bold leading-none' style={{ color, fontSize: fs }}>
          {title}
        </span>
      </div>
    );
  }
  return (
    <div style={{ color }} className='relative flex items-center py-[7px] pl-[15px] font-bold'>
      <span className='leading-none' style={{ fontSize: fs }}>
        {title}
      </span>
      <div
        style={{ backgroundColor: color }}
        className='absolute left-0 top-0 h-full w-[3px]'
      />
      <div
        style={{ backgroundColor: color }}
        className='absolute left-0 top-0 h-full w-full opacity-[0.1]'
      />
    </div>
  );
}

export default memo(SectionHeader);
