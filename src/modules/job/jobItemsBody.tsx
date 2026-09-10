import { RESUME_ITEM_ROW_ATTR } from '@/components/moduleOperation/constants';
import SelectableRichDescription from '@/components/selectableRichDescription';
import { formatResumeDateRange } from '@/utils/resumeDateDisplay';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import type { GlobalStyle } from '../utils/common.type';
import SafeText from '../shared/safeText';

export interface JobItemLike {
  id?: string;
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
        const hasStableId = typeof item.id === 'string' && item.id.trim().length > 0;
        const itemId = hasStableId ? item.id!.trim() : String(index);
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
        const dateText = formatResumeDateRange(startDate, endDate);
        const description = typeof item.description === 'string' ? item.description : '';

        return (
          <div
            key={itemId}
            className='min-w-0 w-full text-black not-last:mb-[10px]'
            style={{ fontSize: fontSize + 'px' }}
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2' {...{ [RESUME_ITEM_ROW_ATTR]: '' }}>
              <div className='min-w-0 flex-[5] break-words font-bold'>
                <SafeText text={company} selectable={selectable} dataItemId={`${moduleId}_${itemId}_company`} />
              </div>
              {dateText && (
                <div className='shrink-0 text-right whitespace-nowrap'>
                  <SafeText
                    text={dateText}
                    selectable={selectable}
                    dataItemId={`${moduleId}_${itemId}_date`}
                  />
                </div>
              )}
            </div>
            {(post || department || city) && (
              <div className='mb-[5px] flex min-w-0 justify-between gap-2' {...{ [RESUME_ITEM_ROW_ATTR]: '' }}>
                <div className='min-w-0 flex-[6] break-words'>
                  <SafeText text={post} selectable={selectable} dataItemId={`${moduleId}_${itemId}_post`} />
                  <SafeText
                    text={department}
                    selectable={selectable}
                    className={post && department ? 'ml-1' : undefined}
                    dataItemId={`${moduleId}_${itemId}_department`}
                  />
                </div>
                <div className='shrink-0 text-right'>
                  <SafeText
                    text={normalizeResumeCityDisplay(city)}
                    selectable={selectable}
                    dataItemId={`${moduleId}_${itemId}_city`}
                  />
                </div>
              </div>
            )}
            <SelectableRichDescription
              html={description}
              fontSize={fontSize}
              lineHeight={lineHeight}
              selectable={selectable}
              dataItemId={`${moduleId}_${itemId}_description`}
            />
          </div>
        );
      })}
    </div>
  );
}