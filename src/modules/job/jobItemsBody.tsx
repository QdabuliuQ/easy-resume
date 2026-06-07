import SelectableRichDescription from '@/components/selectableRichDescription';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import type { GlobalStyle } from '../utils/common.type';
import SafeText from '../shared/safeText';

export interface JobItemLike {
  company?: string;
  post?: string;
  department?: string;
  city?: string | string[];
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface JobItemsBodyProps {
  moduleId: string;
  items: JobItemLike[];
  globalStyle: GlobalStyle;
  selectable?: boolean;
}

export default function JobItemsBody({
  moduleId,
  items,
  globalStyle,
  selectable = false,
}: JobItemsBodyProps) {
  const { fontSize, lineHeight } = globalStyle;

  return (
    <div className='min-w-0 w-full'>
      {items.map((item, index) => {
        const company = typeof item.company === 'string' ? item.company : '';
        const post = typeof item.post === 'string' ? item.post : '';
        const department = typeof item.department === 'string' ? item.department : '';
        const city = Array.isArray(item.city)
          ? item.city.join(' - ')
          : typeof item.city === 'string'
            ? item.city
            : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const description = typeof item.description === 'string' ? item.description : '';

        return (
          <div
            key={`${index}-${company}-${startDate}-${endDate}`}
            className='min-w-0 w-full text-black not-last:mb-[10px]'
            style={{ fontSize: fontSize + 'px' }}
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='min-w-0 flex-[5] break-words font-bold'>
                <SafeText text={company} selectable={selectable} dataItemId={`${moduleId}_${index}_company`} />
              </div>
              <div className='shrink-0 text-right whitespace-nowrap'>
                <SafeText
                  text={`${startDate} - ${endDate}`}
                  selectable={selectable}
                  dataItemId={`${moduleId}_${index}_date`}
                />
              </div>
            </div>
            {(post || department || city) && (
              <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
                <div className='min-w-0 flex-[6] break-words'>
                  <SafeText text={post} selectable={selectable} dataItemId={`${moduleId}_${index}_post`} />
                  <SafeText
                    text={department}
                    selectable={selectable}
                    className={post && department ? 'ml-1' : undefined}
                    dataItemId={`${moduleId}_${index}_department`}
                  />
                </div>
                <div className='shrink-0 text-right'>
                  <SafeText
                    text={normalizeResumeCityDisplay(city)}
                    selectable={selectable}
                    dataItemId={`${moduleId}_${index}_city`}
                  />
                </div>
              </div>
            )}
            <SelectableRichDescription
              html={description}
              fontSize={fontSize}
              lineHeight={lineHeight}
              selectable={selectable}
              dataItemId={`${moduleId}_${index}_description`}
            />
          </div>
        );
      })}
    </div>
  );
}