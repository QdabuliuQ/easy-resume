'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式15：实心标题块 + 右侧递减虚线 */
export function SectionHeaderType15({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  const dashes = [1, 0.72, 0.48, 0.28, 0.14];
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center gap-2'>
      <div
        className='flex h-full shrink-0 items-center px-3 font-bold leading-none'
        style={{ backgroundColor: color, fontSize: fontSizeCss, color: '#fff' }}
      >
        {title}
      </div>
      <div className='flex min-w-0 flex-1 items-center gap-1.5' aria-hidden>
        {dashes.map((op, i) => (
          <span
            key={i}
            className='h-[2px] rounded-full'
            style={{
              width: 10 + i * 4,
              backgroundColor: color,
              opacity: op,
            }}
          />
        ))}
        <span className='h-px min-w-0 flex-1' style={{ backgroundColor: color, opacity: 0.2 }} />
      </div>
    </div>
  );
}
