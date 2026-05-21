'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType1({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={{ color, ...sectionHeaderRowHeightStyle }} className='relative flex items-center pl-[15px] font-bold'>
      <span className='leading-none' style={{ fontSize: fontSizeCss }}>
        {title}
      </span>
      <div style={{ backgroundColor: color }} className='absolute left-0 top-0 h-full w-[3px]' />
      <div style={{ backgroundColor: color }} className='absolute left-0 top-0 h-full w-full opacity-[0.1]' />
    </div>
  );
}
