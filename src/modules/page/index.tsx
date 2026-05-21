import { memo } from 'react';
import { resumeFontStack } from '@/lib/resumeFont';
import {
  normResumePageLayout,
  resumePageContentInnerWidthCss,
  resumePageInnerHeightDeductionPx,
} from '@/lib/resumePageLayout';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { GlobalStyle } from '../utils/common.type';
import SideColPanel from './SideColPanel';
import RoundedTopBanner from './RoundedTopBanner';
import TopLineBanner from './TopLineBanner';

type PageProps = GlobalStyle & {
  children: React.ReactNode;
  /** leftCol / rightCol 时侧栏内容（通常为 info1） */
  sideSlot?: React.ReactNode;
  /** 仅首页展示 rounded 顶栏 */
  firstPage?: boolean;
};

export default memo(function Page(props: PageProps) {
  const { width, height } = globalStylePageDimensions(props);
  const {
    backgroundColor,
    color,
    padding: pagePadding = 0,
    resumeFont,
    layout: layoutRaw,
    firstPage = false,
    sideSlot,
    children,
  } = props;
  const layout = normResumePageLayout(layoutRaw);
  const sideCol = layout === 'leftCol' || layout === 'rightCol';
  const pageIndex = firstPage ? 0 : 1;
  const innerWidth = sideCol
    ? '100%'
    : resumePageContentInnerWidthCss(width, layout, pagePadding);
  const innerHeight = `calc(${height} - ${resumePageInnerHeightDeductionPx(
    { padding: pagePadding, layout },
    pageIndex,
  )}px)`;
  const contentShell = (
    <div
      style={{
        width: innerWidth,
        height: innerHeight,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        backgroundColor,
        fontFamily: resumeFontStack(resumeFont),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {layout === 'rounded' && firstPage ? <RoundedTopBanner color={color} /> : null}
      {layout === 'line' ? <TopLineBanner color={color} /> : null}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: sideCol ? 'flex' : 'block',
          flexDirection: sideCol ? 'row' : undefined,
          alignItems: sideCol ? 'stretch' : undefined,
          padding: sideCol ? 0 : pagePadding,
          boxSizing: 'border-box',
        }}
      >
        {layout === 'leftCol' ? (
          <SideColPanel color={color} padding={pagePadding}>
            {sideSlot}
          </SideColPanel>
        ) : null}
        <div
          style={{
            flex: sideCol ? 1 : undefined,
            minWidth: sideCol ? 0 : undefined,
            padding: sideCol ? pagePadding : 0,
            boxSizing: 'border-box',
          }}
        >
          {contentShell}
        </div>
        {layout === 'rightCol' ? (
          <SideColPanel color={color} padding={pagePadding}>
            {sideSlot}
          </SideColPanel>
        ) : null}
      </div>
    </div>
  );
});
