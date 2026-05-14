'use client';

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
    <span className='block min-w-0 break-words font-bold leading-snug' style={{ color, fontSize: fontSizeCss }}>
      {title}
    </span>
  );
}
