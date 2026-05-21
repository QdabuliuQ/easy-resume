'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType7({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex min-w-0 items-center'>
      <span className='min-w-0 break-words font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
