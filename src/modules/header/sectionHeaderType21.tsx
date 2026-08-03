'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式21：实心圆角方标（白字，标题宽） */
export function SectionHeaderType21({
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
        className='inline-flex h-full max-w-full items-center rounded-[5px] px-3 font-bold leading-none'
        style={{ backgroundColor: color, fontSize: fontSizeCss, color: '#fff' }}
      >
        {title}
      </div>
    </div>
  );
}
