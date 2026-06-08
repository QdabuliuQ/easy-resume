import { memo } from 'react';
import { normResumeFont, resumeLocalFontFacesCss } from '@/lib/resumeFont';

function ResumeFontCdn({ font }: { font: unknown }) {
  const id = normResumeFont(font);
  if (id === 'system') return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: resumeLocalFontFacesCss(id),
      }}
    />
  );
}

export default memo(ResumeFontCdn);
