'use client';
import { RESUME_HEADER_MARK_ATTR } from '@/components/moduleOperation/constants';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

/** 样式12：水印序号 + 短下划线（默认 01） */
export function SectionHeaderType12({
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
  const mark =
    sectionOrdinal != null && Number.isFinite(sectionOrdinal) && sectionOrdinal > 0
      ? String(Math.floor(sectionOrdinal)).padStart(2, '0')
      : '01';
  const markFs = `${Math.max(20, Math.round(fontSizeNum * 1.85))}px`;
  const ruleW = Math.max(28, Math.round(fontSizeNum * 2.4));
  return (
    <div style={sectionHeaderRowHeightStyle} className='relative flex w-full items-center overflow-hidden'>
      <span
        className='pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 select-none font-bold leading-none tabular-nums'
        style={{ color, fontSize: markFs, opacity: 0.14 }}
        aria-hidden
        {...{ [RESUME_HEADER_MARK_ATTR]: '' }}
      >
        {mark}
      </span>
      <div className='relative z-[1] min-w-0 pl-9'>
        <span className='font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
          {title}
        </span>
        <div
          className='absolute left-9 bottom-0 h-[2px] rounded-full'
          style={{
            width: ruleW,
            backgroundColor: color,
            transform: 'translateY(4px)',
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
