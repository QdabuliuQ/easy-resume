'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式25：平行四边形色带标题 */
export function SectionHeaderType25({
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
        className='inline-flex h-full max-w-full items-center px-4 font-bold leading-none'
        style={{
          backgroundColor: color,
          fontSize: fontSizeCss,
          color: '#fff',
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}
      >
        {title}
      </div>
    </div>
  );
}
