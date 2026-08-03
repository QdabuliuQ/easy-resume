'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式18：左侧色点阵列 + 标题 + 底边 */
export function SectionHeaderType18({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div
      style={{ ...sectionHeaderRowHeightStyle, borderColor: color }}
      className='flex w-full items-center gap-2.5 border-b-[2px]'
    >
      <span className='flex shrink-0 flex-col gap-[3px]' aria-hidden>
        <span className='flex gap-[3px]'>
          <span className='h-[4px] w-[4px] rounded-[0.5px]' style={{ backgroundColor: color }} />
          <span className='h-[4px] w-[4px] rounded-[0.5px] opacity-40' style={{ backgroundColor: color }} />
        </span>
        <span className='flex gap-[3px]'>
          <span className='h-[4px] w-[4px] rounded-[0.5px] opacity-40' style={{ backgroundColor: color }} />
          <span className='h-[4px] w-[4px] rounded-[0.5px] opacity-20' style={{ backgroundColor: color }} />
        </span>
      </span>
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
