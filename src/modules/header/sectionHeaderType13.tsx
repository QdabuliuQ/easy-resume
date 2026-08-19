'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式13：圆角色块胶囊 + 左侧小方点 */
export function SectionHeaderType13({
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
        className='inline-flex h-full max-w-full items-center gap-2 rounded-full px-3'
        style={{ backgroundColor: color, opacity: 1 }}
      >
        <span
          className='inline-block h-[6px] w-[6px] shrink-0 rounded-[1px]'
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
          aria-hidden
        />
        <span
          className='font-bold leading-none'
          style={{ fontSize: fontSizeCss, color: '#fff' }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
