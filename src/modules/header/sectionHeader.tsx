'use client';
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
import { SectionHeaderType12 } from './sectionHeaderType12';
import { SectionHeaderType13 } from './sectionHeaderType13';
import { SectionHeaderType14 } from './sectionHeaderType14';
import { SectionHeaderType15 } from './sectionHeaderType15';
import { SectionHeaderType16 } from './sectionHeaderType16';
import { SectionHeaderType17 } from './sectionHeaderType17';
import { SectionHeaderType18 } from './sectionHeaderType18';
import { SectionHeaderType19 } from './sectionHeaderType19';
import { SectionHeaderType20 } from './sectionHeaderType20';
import { SectionHeaderType21 } from './sectionHeaderType21';
import { SectionHeaderType22 } from './sectionHeaderType22';
import { SectionHeaderType23 } from './sectionHeaderType23';
import { SectionHeaderType24 } from './sectionHeaderType24';
import { SectionHeaderType25 } from './sectionHeaderType25';
import { SectionHeaderType26 } from './sectionHeaderType26';
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
  if (t === 12) {
    return (
      <SectionHeaderType12
        title={title}
        color={color}
        fontSizeCss={fs}
        fontSizeNum={fsNum}
        sectionOrdinal={sectionOrdinal}
      />
    );
  }
  if (t === 13) {
    return <SectionHeaderType13 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 14) {
    return <SectionHeaderType14 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 15) {
    return <SectionHeaderType15 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 16) {
    return <SectionHeaderType16 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 17) {
    return <SectionHeaderType17 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 18) {
    return <SectionHeaderType18 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 19) {
    return <SectionHeaderType19 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 20) {
    return <SectionHeaderType20 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 21) {
    return <SectionHeaderType21 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 22) {
    return <SectionHeaderType22 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 23) {
    return (
      <SectionHeaderType23
        title={title}
        color={color}
        fontSizeCss={fs}
        fontSizeNum={fsNum}
        sectionOrdinal={sectionOrdinal}
      />
    );
  }
  if (t === 24) {
    return <SectionHeaderType24 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 25) {
    return <SectionHeaderType25 title={title} color={color} fontSizeCss={fs} />;
  }
  if (t === 26) {
    return <SectionHeaderType26 title={title} color={color} fontSizeCss={fs} />;
  }
  return <SectionHeaderType1 title={title} color={color} fontSizeCss={fs} />;
}

export default memo(SectionHeader);
