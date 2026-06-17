import SelectableRichDescription from '@/components/selectableRichDescription';
import { formatResumeDateRange } from '@/utils/resumeDateDisplay';
import type { GlobalStyle } from '../utils/common.type';
import SafeText from '../shared/safeText';

export interface ProjectItemLike {
  name?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ProjectItemsBodyProps {
  moduleId: string;
  items: ProjectItemLike[];
  globalStyle: GlobalStyle;
  selectable?: boolean;
}

export default function ProjectItemsBody({
  moduleId,
  items,
  globalStyle,
  selectable = false,
}: ProjectItemsBodyProps) {
  const { fontSize, lineHeight } = globalStyle;
  return (
    <div className='min-w-0 w-full'>
      {items.map((item, index) => {
        const name = typeof item.name === 'string' ? item.name : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const dateText = formatResumeDateRange(startDate, endDate);
        const role = typeof item.role === 'string' ? item.role : '';
        const description = typeof item.description === 'string' ? item.description : '';
        return (
          <div
            key={`${index}-${name}-${startDate}-${endDate}`}
            className='min-w-0 w-full text-black not-last:mb-[10px]'
            style={{ fontSize: `${fontSize}px` }}
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='min-w-0 flex-[5] break-words font-bold'>
                <SafeText text={name} selectable={selectable} dataItemId={`${moduleId}_${index}_name`} />
              </div>
              {dateText && (
                <div className='shrink-0 text-right whitespace-nowrap'>
                  <SafeText
                    text={dateText}
                    selectable={selectable}
                    dataItemId={`${moduleId}_${index}_date`}
                  />
                </div>
              )}
            </div>
            {role && (
              <div className='mb-[5px] flex min-w-0 justify-between'>
                <div className='min-w-0 flex-[6] break-words'>
                  <SafeText text={role} selectable={selectable} dataItemId={`${moduleId}_${index}_role`} />
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
