import { memo } from 'react';
import { resumeFontStack } from '@/lib/resumeFont';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { GlobalStyle } from '../utils/common.type';

export default memo(function Page(props: GlobalStyle & { children: React.ReactNode }) {
  const { width, height } = globalStylePageDimensions(props);
  const {
    backgroundColor,
    padding: pagePadding = 0,
    resumeFont,
    children,
  } = props;

  return (
    <div
      style={{
        width,
        height,
        padding: `${pagePadding}px`,
        backgroundColor,
        fontFamily: resumeFontStack(resumeFont),
      }}
    >
      {children}
    </div>
  );
});
