'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式26：右侧折角色块标签（白字） */
export function SectionHeaderType26({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center'>
      <div
        className='inline-flex h-full max-w-full items-center pl-3 pr-5 font-bold leading-none'
        style={{
          backgroundColor: color,
          fontSize: fontSizeCss,
          color: '#fff',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
        }}
      >
        {title}
      </div>
      <div
        className='h-[2px] min-w-0 flex-1'
        style={{ backgroundColor: color, opacity: 0.3 }}
        aria-hidden
      />
    </div>
  );
}
