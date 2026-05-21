'use client';
import { HeaderTypeIcon } from './headerTypeIcon';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType8({
  title,
  color,
  fontSizeCss,
  moduleType,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
  moduleType?: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center gap-2'>
      <div
        className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px]'
        style={{ backgroundColor: color }}
        aria-hidden
      >
        <HeaderTypeIcon moduleType={moduleType} color='#fff' />
      </div>
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
