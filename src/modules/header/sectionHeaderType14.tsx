'use client';
import type { CSSProperties } from 'react';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式14：四角细框线，宽度随标题 */
export function SectionHeaderType14({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  const arm = 7;
  const thick = 1.5;
  const corner = (pos: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      width: arm,
      height: arm,
      borderColor: color,
      pointerEvents: 'none',
    };
    if (pos === 'tl') {
      return {
        ...base,
        top: 0,
        left: 0,
        borderTop: `${thick}px solid`,
        borderLeft: `${thick}px solid`,
      };
    }
    if (pos === 'tr') {
      return {
        ...base,
        top: 0,
        right: 0,
        borderTop: `${thick}px solid`,
        borderRight: `${thick}px solid`,
      };
    }
    if (pos === 'bl') {
      return {
        ...base,
        bottom: 0,
        left: 0,
        borderBottom: `${thick}px solid`,
        borderLeft: `${thick}px solid`,
      };
    }
    return {
      ...base,
      bottom: 0,
      right: 0,
      borderBottom: `${thick}px solid`,
      borderRight: `${thick}px solid`,
    };
  };
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center'>
      <div className='relative inline-flex h-full max-w-full items-center px-2.5'>
        <span style={corner('tl')} aria-hidden />
        <span style={corner('tr')} aria-hidden />
        <span style={corner('bl')} aria-hidden />
        <span style={corner('br')} aria-hidden />
        <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
          {title}
        </span>
      </div>
    </div>
  );
}
