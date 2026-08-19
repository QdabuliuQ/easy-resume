'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式19：菱形饰点 + 标题 + 淡线 */
export function SectionHeaderType19({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center gap-2.5'>
      <span
        className='ml-px inline-block h-[6px] w-[6px] shrink-0 rotate-45'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className='shrink-0 font-semibold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div
        className='h-px min-w-0 flex-1'
        style={{
          backgroundImage: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
          opacity: 0.55,
        }}
        aria-hidden
      />
    </div>
  );
}
