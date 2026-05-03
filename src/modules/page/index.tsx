import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';

export default memo(function Page(props: GlobalStyle & { children: React.ReactNode }) {
  const { width, height, backgroundColor, padding: pagePadding = 0 } = props;

  return (
    <div
      style={{
        width,
        height,
        padding: `${pagePadding}px`,
        backgroundColor,
      }}
    >
      {props.children}
    </div>
  );
});
