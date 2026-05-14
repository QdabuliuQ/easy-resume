'use client';
import type { CSSProperties } from 'react';

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
          style={{ ...trapMain, fontSize: fontSizeCss }}
        >
          {title}
        </div>
      </div>
      <div className='h-px min-w-0 flex-1 opacity-40' style={{ backgroundColor: color }} />
    </div>
  );
}
