'use client';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式23：序号方块 + 标题 + 延伸线 */
export function SectionHeaderType23({
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
      ? String(Math.floor(sectionOrdinal)).padStart(2, '0')
      : '01';
  const ordFs = `${Math.max(10, Math.round(fontSizeNum * 0.72))}px`;
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full items-center gap-2.5'>
      <span
        className='inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-[4px] px-1 font-bold tabular-nums leading-none'
        style={{ backgroundColor: color, fontSize: ordFs, color: '#fff' }}
      >
        {ord}
      </span>
      <span className='shrink-0 font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
        {title}
      </span>
      <div
        className='h-[1.5px] min-w-0 flex-1 rounded-full'
        style={{ backgroundColor: color, opacity: 0.35 }}
        aria-hidden
      />
    </div>
  );
}
