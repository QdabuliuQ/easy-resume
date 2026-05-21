'use client';
import type { GlobalStyle } from '@/modules/utils/common.type';
import type { ReactNode } from 'react';
import { header11TitleRowMinHeightPx } from './header11Layout';
import { sectionHeaderRowHeightStyle } from './sectionHeaderLayout';
import { sectionHeaderFontSizeNum } from './sectionHeaderFont';

export { HEADER11_DOT_PX, header11DotPx, header11TitleRowMinHeightPx } from './header11Layout';

function HeaderType11Title({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <span className='min-w-0 break-words font-bold leading-none' style={{ color, fontSize: fontSizeCss }}>
      {title}
    </span>
  );
}

export function SectionHeaderType11TitleRow({
  title,
  globalStyle,
}: {
  title: string;
  globalStyle: GlobalStyle;
}) {
  const { color, fontSize } = globalStyle;
  const fsRaw = Number(fontSize);
  const fsNum = Number.isFinite(fsRaw) && fsRaw > 0 ? fsRaw : 13;
  const fs = `${fsNum}px`;
  return (
    <div style={sectionHeaderRowHeightStyle} className='flex w-full min-w-0 items-center gap-2.5'>
      <span
        className='shrink-0 rounded-full w-[9px] h-[9px]'
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <HeaderType11Title title={title} color={color} fontSizeCss={fs} />
    </div>
  );
}

export function SectionHeaderType11TitleOnly({
  title,
  globalStyle,
}: {
  title: string;
  globalStyle: GlobalStyle;
}) {
  const { color, fontSize } = globalStyle;
  const fsRaw = Number(fontSize);
  const fsNum = Number.isFinite(fsRaw) && fsRaw > 0 ? fsRaw : 13;
  return <HeaderType11Title title={title} color={color} fontSizeCss={`${fsNum}px`} />;
}

/** 样式 11：左侧圆点 + 竖线，右侧标题与正文（画布 / 设置预览共用） */
export function SectionHeaderType11TimelineLayout({
  title,
  globalStyle,
  children,
}: {
  title: string;
  globalStyle: GlobalStyle;
  children: ReactNode;
}) {
  const color = globalStyle.color ?? '#333';
  const fsNum = sectionHeaderFontSizeNum(globalStyle);
  const titleRowMinH = header11TitleRowMinHeightPx(fsNum);
  return (
    <div className='flex w-full min-w-0 gap-3'>
      <div className='flex w-[18px] shrink-0 flex-col items-center'>
        <div
          className='flex w-full shrink-0 flex-col items-center justify-center'
          style={{ minHeight: titleRowMinH }}
        >
          <span
            className='shrink-0 rounded-full w-[9px] h-[9px]'
            style={{ backgroundColor: color }}
            aria-hidden
          />
        </div>
        <div className='min-h-0 w-px flex-1' style={{ minHeight: 8, backgroundColor: color }} />
      </div>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <div className='mb-1 flex shrink-0 items-center' style={{ minHeight: titleRowMinH }}>
          <SectionHeaderType11TitleOnly title={title} globalStyle={globalStyle} />
        </div>
        <div className='min-h-0 min-w-0'>{children}</div>
      </div>
    </div>
  );
}
