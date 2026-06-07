import ResumeQuillHtml from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import type { CSSProperties } from 'react';

type SelectableRichDescriptionProps = {
  html: string;
  fontSize: number;
  lineHeight: CSSProperties['lineHeight'];
  className?: string;
  selectable?: boolean;
  dataItemId?: string;
};

export default function SelectableRichDescription({
  html,
  fontSize,
  lineHeight,
  className = 'text-black',
  selectable = true,
  dataItemId,
}: SelectableRichDescriptionProps) {
  if (!plainTextFromRichHtml(html)) {
    return null;
  }

  const content = (
    <ResumeQuillHtml
      html={html}
      style={{ fontSize: `${fontSize}px`, lineHeight }}
      className={className}
    />
  );

  if (!selectable && !dataItemId) {
    return content;
  }

  return <div data-selectable={selectable ? 'true' : undefined} data-item-id={dataItemId}>{content}</div>;
}