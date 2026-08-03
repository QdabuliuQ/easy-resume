'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式16：圆点 + 双细线延伸 */
export function SectionHeaderType16({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center gap-2'>
      <span
        className='inline-block h-[7px] w-[7px] shrink-0 rounded-full'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className='shrink-0 font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div className='flex min-w-0 flex-1 flex-col justify-center gap-[3px]' aria-hidden>
        <div className='h-px w-full' style={{ backgroundColor: color, opacity: 0.85 }} />
        <div className='h-px w-full' style={{ backgroundColor: color, opacity: 0.35 }} />
      </div>
    </div>
  );
}
