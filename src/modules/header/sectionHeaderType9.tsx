'use client';

export function SectionHeaderType9({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div className='flex w-full items-center gap-3 py-1'>
      <div className='h-px min-w-0 flex-1 shrink-0' style={{ backgroundColor: color }} />
      <span className='shrink-0 whitespace-nowrap font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div className='h-px min-w-0 flex-1 shrink-0' style={{ backgroundColor: color }} />
    </div>
  );
}
