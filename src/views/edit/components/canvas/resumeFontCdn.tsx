'use client';
import { memo, useEffect } from 'react';
import {
  normResumeFont,
  resumeLocalFontFacesCss,
  type ResumeExportFontId,
} from '@/lib/resumeFont';
import { ensureResumeFontSplitStyles } from '@/lib/resumeFontSplit';

function ResumeFontCdn({ font }: { font: unknown }) {
  const idRaw = normResumeFont(font);
  const id: ResumeExportFontId =
    idRaw === 'system' ? 'noto-sans-sc' : idRaw;

  useEffect(() => {
    let alive = true;
    let fullStyle: HTMLStyleElement | null = null;
    void ensureResumeFontSplitStyles(id)
      .then((ok) => {
        if (!alive || ok) return;
        fullStyle = document.createElement('style');
        fullStyle.dataset.resumeFontFull = id;
        fullStyle.textContent = resumeLocalFontFacesCss(id);
        document.head.appendChild(fullStyle);
      })
      .catch(() => {
        if (!alive) return;
        fullStyle = document.createElement('style');
        fullStyle.dataset.resumeFontFull = id;
        fullStyle.textContent = resumeLocalFontFacesCss(id);
        document.head.appendChild(fullStyle);
      });
    return () => {
      alive = false;
      fullStyle?.remove();
    };
  }, [id]);

  return null;
}

export default memo(ResumeFontCdn);