import { memo } from 'react';
import { resumeFontStack } from '@/lib/resumeFont';
import {
  normResumePageLayout,
  resumePageContentInnerWidthCss,
  resumePageInnerHeightDeductionPx,
} from '@/lib/resumePageLayout';
import { cssLengthToPx, globalStylePageDimensions } from '@/lib/resumePageSize';
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
  /** 图片导出：单页长图，高度随内容撑开 */
  continuous?: boolean;
  /** 浏览器 snapDOM 截图锚点 */
  snapTarget?: boolean;
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
    continuous = false,
    snapTarget = false,
  } = props;
  const snapWidth = snapTarget ? `${Math.round(cssLengthToPx(width))}px` : width;
  const snapHeight = snapTarget ? `${Math.round(cssLengthToPx(height))}px` : height;
  const layout = normResumePageLayout(layoutRaw);
  const sideCol = layout === 'leftCol' || layout === 'rightCol';
  const innerWidth = sideCol
    ? '100%'
    : resumePageContentInnerWidthCss(snapWidth, layout, pagePadding);
  const innerHeight = `calc(${snapHeight} - ${resumePageInnerHeightDeductionPx({ padding: pagePadding, layout })}px)`;
  const snapMinH = snapTarget && continuous;
  const contentShell = (
    <div
      style={{
        width: innerWidth,
        height: continuous ? 'auto' : innerHeight,
        minHeight: snapMinH ? innerHeight : undefined,
        overflow: continuous ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
  return (
    <div
      data-resume-export-page={snapTarget ? '' : undefined}
      className={snapTarget ? 'png-page' : undefined}
      style={{
        position: 'relative',
        width: snapWidth,
        height: continuous ? 'auto' : snapHeight,
        minHeight: snapMinH ? snapHeight : undefined,
        backgroundColor,
        color,
        fontSize: `${props.fontSize}px`,
        lineHeight: props.lineHeight,
        fontFamily: resumeFontStack(resumeFont),
        display: 'flex',
        flexDirection: 'column',
        overflow: continuous ? 'visible' : 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {layout === 'rounded' && firstPage ? <RoundedTopBanner color={color} /> : null}
      {layout === 'line' ? <TopLineBanner color={color} /> : null}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: continuous ? 'none' : 1,
          minHeight: continuous ? undefined : 0,
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
