'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式17：细竖线 + 字距标题 + 发丝横线延伸 */
export function SectionHeaderType17({
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
        className='inline-block h-[55%] w-px shrink-0'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className='shrink-0 font-semibold leading-none tracking-[0.14em]'
        style={{ color, fontSize: fontSizeCss }}
      >
        {title}
      </span>
      <div
        className='h-px min-w-0 flex-1'
        style={{ backgroundColor: color, opacity: 0.28 }}
        aria-hidden
      />
    </div>
  );
}
