'use client';
import type { CSSProperties } from 'react';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType3({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
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
    <div style={sectionHeaderRowHeightStyle} className='flex w-full gap-0 items-end'>
      <div className='relative h-full inline-flex shrink-0 items-stretch'>
        <div
          className='pointer-events-none absolute inset-y-0.5 z-0 w-full left-[7px] bottom-0'
          style={{
            ...trapTail,
          }}
          aria-hidden
        />
        <div
          className='relative z-[1] flex h-full items-center py-0 pl-3 pr-10 font-bold leading-none text-white'
          style={{ ...trapMain, fontSize: fontSizeCss, color: '#fff' }}
        >
          {title}
        </div>
      </div>
      <div className='h-px min-w-0 flex-1 opacity-40' style={{ backgroundColor: color }} />
    </div>
  );
}
