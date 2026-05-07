import fs from 'node:fs';
import path from 'node:path';
import { normResumeFont, resumeLocalFontFacesCss } from '@/lib/resumeFont';

function resumeProjectRoot(): string {
  const v = process.env.RESUME_PROJECT_ROOT?.trim();
  return v ? path.resolve(v) : process.cwd();
}

/** 仅服务端 PDF：按需内嵌 ttf；system 不嵌字体 */
export function resumePdfFontLinkTags(font: unknown): string {
  const id = normResumeFont(font);
  if (id === 'system') return '';
  const fontsDir = path.join(resumeProjectRoot(), 'public', 'fonts');
  const subset: Array<{ family: string; weight: number; file: string }> =
    id === 'noto-sans-sc'
      ? [
          { family: 'Noto Sans SC', weight: 400, file: 'NotoSansSC-Regular.ttf' },
          { family: 'Noto Sans SC', weight: 700, file: 'NotoSansSC-Bold.ttf' },
        ]
      : [
          {
            family: 'Noto Serif SC',
            weight: 400,
            file: 'NotoSerifSC-Regular.ttf',
          },
          { family: 'Noto Serif SC', weight: 700, file: 'NotoSerifSC-Bold.ttf' },
        ];
  try {
    const css = subset
      .map(({ family, weight, file }) => {
        const fp = path.join(fontsDir, file);
        const b64 = fs.readFileSync(fp).toString('base64');
        return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('data:font/truetype;base64,${b64}') format('truetype');}`;
      })
      .join('\n');
    return `<style>${css}</style>`;
  } catch {
    const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    return `<style>${resumeLocalFontFacesCss(bp, id)}</style>`;
  }
}
