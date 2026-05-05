import { sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import type { CSSProperties } from 'react';

export default function ResumeQuillHtml({
  html,
  className = '',
  style,
}: {
  html: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`resume-quill-embed w-full ${className}`.trim()} style={style}>
      <div
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
      />
    </div>
  );
}
