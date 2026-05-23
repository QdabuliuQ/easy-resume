import { memo, type ReactNode } from 'react';
import { RESUME_PAGE_SIDE_COL_WIDTH_RATIO } from '@/lib/resumePageLayout';

type SideColPanelProps = {
  color: string;
  padding: number;
  children?: ReactNode;
};

export default memo(function SideColPanel({
  color,
  padding,
  children,
}: SideColPanelProps) {
  const pct = `${Math.round(RESUME_PAGE_SIDE_COL_WIDTH_RATIO * 100)}%`;
  return (
    <div
      data-resume-side-col
      className='flex shrink-0 flex-col self-stretch overflow-hidden'
      style={{
        width: pct,
        flexBasis: pct,
        backgroundColor: color,
        padding,
        boxSizing: 'border-box',
      }}
    >
      {children ? (
        <div className='min-h-0 w-full flex-1 overflow-hidden'>{children}</div>
      ) : null}
    </div>
  );
});
