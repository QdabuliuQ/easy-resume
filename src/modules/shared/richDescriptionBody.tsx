import SelectableRichDescription from '@/components/selectableRichDescription';
import type { GlobalStyle } from '@/modules/utils/common.type';

export default function RichDescriptionBody({
  description,
  globalStyle,
  selectable = false,
  dataItemId,
}: {
  description?: string;
  globalStyle: GlobalStyle;
  selectable?: boolean;
  dataItemId?: string;
}) {
  return (
    <SelectableRichDescription
      html={description ?? ''}
      fontSize={globalStyle.fontSize}
      lineHeight={globalStyle.lineHeight}
      selectable={selectable}
      dataItemId={dataItemId}
    />
  );
}
