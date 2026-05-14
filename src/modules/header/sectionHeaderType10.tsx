'use client';

export function SectionHeaderType10({
  title,
  color,
  fontSizeCss,
  fontSizeNum,
  sectionOrdinal,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
  fontSizeNum: number;
  sectionOrdinal?: number;
}) {
  const ord =
    sectionOrdinal != null && Number.isFinite(sectionOrdinal) && sectionOrdinal > 0
      ? `${String(Math.floor(sectionOrdinal)).padStart(2, '0')}/`
      : null;
  const prefixFs = `${Math.max(12, Math.round(fontSizeNum * 0.88))}px`;
  return (
    <div className='w-full py-1 flex items-end'>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-0.5'>
        {ord ? (
          <span
            className='shrink-0 font-medium tabular-nums leading-none tracking-tight'
            style={{ color, fontSize: prefixFs, opacity: 0.72 }}
          >
            {ord}
          </span>
        ) : null}
        <span className='min-w-0 flex-1 font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
          {title}
        </span>
      </div>
      <div className='flex-1 ml-3 h-px w-full shrink-0' style={{ backgroundColor: color }} />
    </div>
  );
}
