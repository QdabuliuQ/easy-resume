'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式22：双竖条饰标 + 标题 + 底部分割 */
export function SectionHeaderType22({
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
      className='flex w-full items-center gap-2.5 border-b-[1.5px]'
    >
      <span className='flex h-[14px] shrink-0 items-stretch gap-[3px]' aria-hidden>
        <span className='w-[3px] rounded-[1px]' style={{ backgroundColor: color }} />
        <span className='w-[3px] rounded-[1px] opacity-45' style={{ backgroundColor: color }} />
      </span>
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
