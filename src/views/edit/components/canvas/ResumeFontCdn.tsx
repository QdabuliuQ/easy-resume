'use client';
import { memo } from 'react';
import { normResumeFont, resumeLocalFontFacesCss } from '@/lib/resumeFont';

function ResumeFontCdn({ font }: { font: unknown }) {
  const id = normResumeFont(font);
  if (id === 'system') return null;
  const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: resumeLocalFontFacesCss(bp, id),
      }}
    />
  );
}

export default memo(ResumeFontCdn);
