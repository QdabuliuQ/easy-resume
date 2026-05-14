'use client';

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
    <div className='w-full border-b pb-[3px]' style={{ borderColor: color }}>
      <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
    </div>
  );
}
