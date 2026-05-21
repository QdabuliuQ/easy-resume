'use client';
import type { CSSProperties } from 'react';
import { SECTION_HEADER_ROW_HEIGHT_PX, sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType6({
  title,
  color,
  fontSizeCss,
  fontSizeNum,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
  fontSizeNum: number;
}) {
  const triScale = fontSizeNum / 13;
  const triH = Math.max(4, Math.round(6 * triScale));
  const triW = Math.max(6, Math.round(9 * triScale));
  const triGap = Math.max(4, Math.round(5 * triScale));
  const triBoxH = Math.min(SECTION_HEADER_ROW_HEIGHT_PX - 2, Math.max(12, triH * 2 + 4));
  const triBoxW = Math.max(20, triW + triGap + 4);
  const tri: CSSProperties = {
    width: 0,
    height: 0,
    borderTop: `${triH}px solid transparent`,
    borderBottom: `${triH}px solid transparent`,
    borderLeft: `${triW}px solid ${color}`,
  };
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center'>
      <div className='relative shrink-0' style={{ width: triBoxW, height: triBoxH }} aria-hidden>
        <span className='absolute top-1/2 left-0 -translate-y-1/2' style={tri} />
        <span
          className='absolute top-1/2 -translate-y-1/2 opacity-40'
          style={{ ...tri, left: triGap }}
        />
      </div>
      <span className='shrink-0 font-bold leading-none mr-[10px]' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div className='min-h-px min-w-0 flex-1' style={{ backgroundColor: color }} />
    </div>
  );
}
