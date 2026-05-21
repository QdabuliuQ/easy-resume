'use client';
// 纸张：GlobalStyle.pageSize；顶栏窄屏 Popover：../../views/edit/components/header；PDF/PNG：./sectionHeaderHtml.ts
import { GlobalStyle } from '@/modules/utils/common.type';
import { memo } from 'react';
import { normHeaderType } from './normHeaderType';
import { sectionHeaderFontSizeCss, sectionHeaderFontSizeNum } from './sectionHeaderFont';
import { SectionHeaderType1 } from './sectionHeaderType1';
import { SectionHeaderType10 } from './sectionHeaderType10';
import { SectionHeaderType11TitleRow } from './sectionHeaderType11';
import { SectionHeaderType2 } from './sectionHeaderType2';
import { SectionHeaderType3 } from './sectionHeaderType3';
import { SectionHeaderType4 } from './sectionHeaderType4';
import { SectionHeaderType5 } from './sectionHeaderType5';
import { SectionHeaderType6 } from './sectionHeaderType6';
import { SectionHeaderType7 } from './sectionHeaderType7';
import { SectionHeaderType8 } from './sectionHeaderType8';
import { SectionHeaderType9 } from './sectionHeaderType9';
import type { SectionHeaderConfig } from './sectionHeaderTypes';

export type { SectionHeaderConfig } from './sectionHeaderTypes';
export { normHeaderType } from './normHeaderType';
export {
  HEADER11_DOT_PX,
  header11DotPx,
  header11TitleRowMinHeightPx,
  SectionHeaderType11TitleOnly,
  SectionHeaderType11TitleRow,
  SectionHeaderType11TimelineLayout,
} from './sectionHeaderType11';
export { SECTION_HEADER_ROW_HEIGHT_PX, sectionHeaderRowHeightStyle } from './sectionHeaderLayout';

function SectionHeader({
  config,
  globalStyle,
}: {
  config: SectionHeaderConfig;
  globalStyle: GlobalStyle;
}) {
  const { title, moduleType, sectionOrdinal } = config;
  const { color } = globalStyle;
  const fsNum = sectionHeaderFontSizeNum(globalStyle);
  const fs = sectionHeaderFontSizeCss(globalStyle);
  const t = normHeaderType(globalStyle);
  if (t === 7) {
    return <SectionHeaderType7 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 2) {
    return <SectionHeaderType2 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 3) {
    return <SectionHeaderType3 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 4) {
    return <SectionHeaderType4 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 5) {
    return <SectionHeaderType5 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 6) {
    return <SectionHeaderType6 title={title} color={color} fontSizeCss={fs} fontSizeNum={fsNum} />;
  }
  if (t === 10) {
    return (
      <SectionHeaderType10
        title={title}
        color={color}
        fontSizeCss={fs}
        fontSizeNum={fsNum}
        sectionOrdinal={sectionOrdinal}
      />
    );
  }
  if (t === 9) {
    return <SectionHeaderType9 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 11) {
    return <SectionHeaderType11TitleRow title={title} globalStyle={globalStyle} />;
  }
  if (t === 8) {
    return <SectionHeaderType8 title={title} color={color} fontSizeCss={fs} moduleType={moduleType} />;
  }
  return <SectionHeaderType1 title={title} color={color} fontSizeCss={fs} />;
}

export default memo(SectionHeader);
