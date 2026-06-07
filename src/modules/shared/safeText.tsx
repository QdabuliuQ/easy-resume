import type { CSSProperties, ReactNode } from 'react';

export default function SafeText({
  text,
  selectable,
  className,
  style,
  children,
  dataItemId,
}: {
  text?: string;
  selectable: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  dataItemId?: string;
}) {
  return (
    <span
      className={className}
      style={style}
      data-selectable={selectable ? 'true' : undefined}
      data-item-id={dataItemId}
    >
      {children ?? text ?? ''}
    </span>
  );
}
