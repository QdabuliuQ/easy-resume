import { memo } from 'react';
import { RESUME_PAGE_TOP_LINE_HEIGHT_PX } from '@/lib/resumePageLayout';

type TopLineBannerProps = {
  color: string;
  height?: number;
};

/** 每页顶部主题色横线，绝对定位，不占版心 */
export default memo(function TopLineBanner({
  color,
  height = RESUME_PAGE_TOP_LINE_HEIGHT_PX,
}: TopLineBannerProps) {
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-x-0 top-0 z-0'
      style={{ height, backgroundColor: color }}
    />
  );
});
