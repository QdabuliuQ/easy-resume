'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式20：色块标签骑在底部分割线上 */
export function SectionHeaderType20({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='relative flex w-full items-stretch'>
      <div
        className='pointer-events-none absolute right-0 bottom-0 left-0 h-[2px]'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div
        className='relative z-[1] inline-flex h-full max-w-full items-center px-3 font-bold leading-none'
        style={{ backgroundColor: color, fontSize: fontSizeCss, color: '#fff' }}
      >
        {title}
      </div>
    </div>
  );
}
