import { sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import type { CSSProperties } from 'react';
import 'quill/dist/quill.snow.css';
import '@/styles/resumeQuillEmbed.css';

const QL_EMBED_EDITOR_STYLE: CSSProperties = {
  height: 'auto',
  minHeight: 0,
  maxHeight: 'none',
  overflow: 'visible',
};

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
        style={QL_EMBED_EDITOR_STYLE}
        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
      />
    </div>
  );
}
