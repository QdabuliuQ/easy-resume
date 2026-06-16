import { memo } from 'react';
import { normResumeFont, resumeLocalFontFacesCss } from '@/lib/resumeFont';

function ResumeFontCdn({ font }: { font: unknown }) {
  const idRaw = normResumeFont(font);
  const id = idRaw === 'system' ? 'noto-sans-sc' : idRaw;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: resumeLocalFontFacesCss(id),
      }}
    />
  );
}

export default memo(ResumeFontCdn);
