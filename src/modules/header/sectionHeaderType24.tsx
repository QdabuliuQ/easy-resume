'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式24：对称粗短线夹标题 */
export function SectionHeaderType24({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center justify-center gap-3'>
      <span
        className='inline-block h-[2.5px] w-7 shrink-0 rounded-full'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className='shrink-0 font-bold leading-none tracking-[0.08em]'
        style={{ color, fontSize: fontSizeCss }}
      >
        {title}
      </span>
      <span
        className='inline-block h-[2.5px] w-7 shrink-0 rounded-full'
        style={{ backgroundColor: color }}
        aria-hidden
      />
    </div>
  );
}
