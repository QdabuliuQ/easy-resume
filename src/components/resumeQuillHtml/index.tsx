import { sanitizeRichTextHtml, looksLikeRichHtml } from '@/utils/sanitizeHtml';
import type { CSSProperties, ReactNode } from 'react';
import 'quill/dist/quill.snow.css';
import '@/styles/resumeQuillEmbed.css';

const QL_EMBED_EDITOR_STYLE: CSSProperties = {
  height: 'auto',
  minHeight: 0,
  maxHeight: 'none',
  overflow: 'visible',
};

export { looksLikeRichHtml };

export default function ResumeQuillHtml({
  html,
  className = '',
  style,
  shrink = false,
}: {
  html: string;
  className?: string;
  style?: CSSProperties;
  shrink?: boolean;
}) {
  return (
    <div className={`resume-quill-embed ${shrink ? 'w-fit max-w-full' : 'w-full'} ${className}`.trim()} style={style}>
      <div
        className="ql-editor"
        style={QL_EMBED_EDITOR_STYLE}
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
      />
    </div>
  );
}

export function RichHtmlOrText({
  value,
  plainClassName = '',
  style,
  shrink = false,
}: {
  value: string;
  plainClassName?: string;
  style?: CSSProperties;
  shrink?: boolean;
}): ReactNode {
  if (!value.trim()) return null;
  if (!looksLikeRichHtml(value)) {
    return <span className={`${shrink ? 'inline-block ' : ''}${plainClassName}`.trim()}>{value}</span>;
  }
  return <ResumeQuillHtml html={value} className={plainClassName} style={style} shrink={shrink} />;
}
