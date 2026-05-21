'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

export function SectionHeaderType4({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div
      style={{ borderColor: color, ...sectionHeaderRowHeightStyle }}
      className='flex w-full items-center border-b'
    >
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
