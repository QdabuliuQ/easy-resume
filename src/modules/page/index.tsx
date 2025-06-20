import { memo, useMemo } from 'react';
import { GlobalStyle } from '../utils/common.type';

export default memo(function Page(props: {
  children: React.ReactNode;
  globalStyle: GlobalStyle;
}) {
  const pageStyle = useMemo(() => {
    return {
      width: props.globalStyle.width,
      height: props.globalStyle.height,
      padding: `${props.globalStyle.verticalMargin}px ${props.globalStyle.horizontalMargin}px`,
      backgroundColor: props.globalStyle.backgroundColor,
    };
  }, [props.globalStyle]);

  return <div style={pageStyle}>{props.children}</div>;
});
