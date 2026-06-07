import type { GlobalStyle } from '../utils/common.type';
import SafeText from '../shared/safeText';

export interface CertificateItemLike {
  name?: string;
  date?: string;
}

interface CertificateItemsBodyProps {
  moduleId: string;
  items: CertificateItemLike[];
  globalStyle: GlobalStyle;
  selectable?: boolean;
}

export default function CertificateItemsBody({
  moduleId,
  items,
  globalStyle,
  selectable = false,
}: CertificateItemsBodyProps) {
  return (
    <div className='min-w-0 w-full'>
      {items.map((item, index) => {
        const name = typeof item.name === 'string' ? item.name : '';
        const date = typeof item.date === 'string' ? item.date : '';
        return (
          <div
            key={`${index}-${name}-${date}`}
            className='flex min-w-0 w-full justify-between gap-2 text-black not-last:mb-[5px]'
            style={{ fontSize: `${globalStyle.fontSize}px` }}
          >
            <div className='min-w-0 flex-[6] break-words'>
              <SafeText text={name} selectable={selectable} dataItemId={`${moduleId}_${index}_name`} />
            </div>
            <div className='shrink-0 whitespace-nowrap text-right'>
              <SafeText text={date} selectable={selectable} dataItemId={`${moduleId}_${index}_date`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
