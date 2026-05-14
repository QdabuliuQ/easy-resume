'use client';

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
    <div className='flex w-full flex-col items-center gap-2 py-1'>
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div className='h-px w-full shrink-0' style={{ backgroundColor: color }} />
    </div>
  );
}
