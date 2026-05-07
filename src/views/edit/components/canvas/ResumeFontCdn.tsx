'use client';
import { memo } from 'react';
import {
  normResumeFont,
  RESUME_FONT_LINK_STYLESHEET_HREF,
  resumeAlibabaPuHuiTiFontFacesCss,
  resumeFontPreconnectJsdelivr,
  resumeFontPreconnectLoli,
} from '@/lib/resumeFont';

function ResumeFontCdn({ font }: { font: unknown }) {
  const id = normResumeFont(font);
  const href = RESUME_FONT_LINK_STYLESHEET_HREF[id];
  return (
    <>
      {resumeFontPreconnectLoli(id) ? (
        <link rel='preconnect' href='https://fonts.loli.net' crossOrigin='' />
      ) : null}
      {resumeFontPreconnectJsdelivr(id) ? (
        <link rel='preconnect' href='https://cdn.jsdelivr.net' crossOrigin='' />
      ) : null}
      {id === 'alibaba' ? (
        <style dangerouslySetInnerHTML={{ __html: resumeAlibabaPuHuiTiFontFacesCss() }} />
      ) : href ? (
        <link rel='stylesheet' href={href} crossOrigin='anonymous' />
      ) : null}
    </>
  );
}

export default memo(ResumeFontCdn);
