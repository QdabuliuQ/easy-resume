'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType5({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='relative flex w-full items-center'>
      <div
        className='pointer-events-none absolute inset-y-0 left-0 z-0 w-full opacity-20'
        style={{
          backgroundColor: color,
          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
        }}
        aria-hidden
      />
      <div
        className='relative z-[1] flex h-full shrink-0 items-center py-0 pl-5 pr-8 font-bold leading-none text-white'
        style={{
          backgroundColor: color,
          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
          fontSize: fontSizeCss,
        }}
      >
        {title}
      </div>
    </div>
  );
}
