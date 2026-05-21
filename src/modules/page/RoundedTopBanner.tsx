import { memo } from 'react';
import {
  RESUME_PAGE_ROUNDED_BANNER_HEIGHT_PX,
} from '@/lib/resumePageLayout';

type RoundedTopBannerProps = {
  color: string;
  height?: number;
};

/** 首页顶部弧形色带，绝对定位，不挡点击 */
export default memo(function RoundedTopBanner({
  color,
  height = RESUME_PAGE_ROUNDED_BANNER_HEIGHT_PX,
}: RoundedTopBannerProps) {
  const arcR = Math.max(12, Math.round(height * 0.42));
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-x-0 top-0 z-0'
      style={{ height }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: color,
          borderBottomLeftRadius: `50% ${arcR}px`,
          borderBottomRightRadius: `50% ${arcR}px`,
        }}
      />
    </div>
  );
});
