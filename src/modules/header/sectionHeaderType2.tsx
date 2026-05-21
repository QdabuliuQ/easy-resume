'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType2({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='relative flex w-full flex-col items-center justify-center gap-1'>
      <span className='font-bold leading-none relative top-[-1px]' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div className='h-px w-full shrink-0 absolute bottom-0' style={{ backgroundColor: color }} />
    </div>
  );
}
