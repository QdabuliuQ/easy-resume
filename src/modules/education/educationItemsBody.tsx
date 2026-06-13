import SelectableRichDescription from '@/components/selectableRichDescription';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import type { GlobalStyle } from '../utils/common.type';
import SafeText from '../shared/safeText';

export interface EducationItemLike {
  school?: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  city?: string | string[];
  tags?: unknown[];
  academy?: string;
  description?: string;
}

interface EducationItemsBodyProps {
  moduleId: string;
  items: EducationItemLike[];
  globalStyle: GlobalStyle;
  selectable?: boolean;
}

export default function EducationItemsBody({
  moduleId,
  items,
  globalStyle,
  selectable = false,
}: EducationItemsBodyProps) {
  const { fontSize, color, lineHeight } = globalStyle;
  return (
    <div className='min-w-0 w-full' style={{ fontSize: `${fontSize}px` }}>
      {items.map((item, index) => {
        const school = typeof item.school === 'string' ? item.school : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const degree = typeof item.degree === 'string' ? item.degree : '';
        const major = typeof item.major === 'string' ? item.major : '';
        const academy = typeof item.academy === 'string' ? item.academy : '';
        const city = Array.isArray(item.city)
          ? item.city.join(' - ')
          : typeof item.city === 'string'
            ? item.city
            : '';
        const description = typeof item.description === 'string' ? item.description : '';
        return (
          <div
            key={`${index}-${school}-${startDate}-${endDate}`}
            className='min-w-0 w-full text-black not-last:mb-[10px]'
          >
            <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
              <div className='flex min-w-0 flex-[7] flex-wrap items-center gap-x-[10px] gap-y-1'>
                <SafeText
                  text={school}
                  selectable={selectable}
                  className='min-w-0 break-words font-bold'
                  dataItemId={`${moduleId}_${index}_school`}
                />
                {tags.length > 0 && (
                  <SafeText
                    selectable={selectable}
                    dataItemId={`${moduleId}_${index}_tags`}
                    className='flex shrink-0 flex-wrap items-center'
                  >
                    {tags.map((tag, tagIndex) => {
                      const tagStr = typeof tag === 'string' ? tag : '';
                      return (
                        <span
                          key={`${tagIndex}-${tagStr}`}
                          style={{ backgroundColor: color, color: '#fff', fontSize: `${fontSize - 4}px` }}
                          className='not-last:mr-[5px] rounded-[5px] px-[5px] py-[2px]'
                        >
                          {tagStr}
                        </span>
                      );
                    })}
                  </SafeText>
                )}
              </div>
              <div className='shrink-0 text-right whitespace-nowrap'>
                <SafeText
                  text={`${startDate} - ${endDate}`}
                  selectable={selectable}
                  dataItemId={`${moduleId}_${index}_date`}
                />
              </div>
            </div>
            {(major || degree || academy) && (
              <div className='mb-[5px] flex min-w-0 justify-between gap-2'>
                <div className='flex min-w-0 flex-[7] flex-wrap items-center gap-x-[10px] break-words'>
                  {major && (
                    <SafeText
                      text={major}
                      selectable={selectable}
                      dataItemId={`${moduleId}_${index}_major`}
                    />
                  )}
                  {degree && (
                    <SafeText
                      text={degree}
                      selectable={selectable}
                      dataItemId={`${moduleId}_${index}_degree`}
                    />
                  )}
                  {academy && (
                    <SafeText
                      text={academy}
                      selectable={selectable}
                      dataItemId={`${moduleId}_${index}_academy`}
                    />
                  )}
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
