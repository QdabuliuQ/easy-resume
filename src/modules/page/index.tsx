import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';

export default memo(function Page(props: GlobalStyle & { children: React.ReactNode }) {

  const { width, height, verticalMargin, horizontalMargin, backgroundColor } = props;

  return <div style={{width, height, padding: `${verticalMargin}px ${horizontalMargin}px`, backgroundColor}}>{props.children}</div>;
});
