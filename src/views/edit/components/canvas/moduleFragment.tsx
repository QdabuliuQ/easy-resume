'use client';

interface SectionListOptions {
  title?: string;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import ResumeQuillHtml from '@/components/resumeQuillHtml';
import SectionModuleShell from '@/modules/layout/sectionModuleShell';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

export interface CanvasModuleFragmentConfig {
  type: string;
  sourceId: string;
  domId: string;
  showHeader: boolean;
  options: Record<string, any>;
  sectionOrdinal?: number;
}

function normalizeSectionListOptions(
  type: string,
  raw: unknown,
  tf: (key: 'jobFallback' | 'projectFallback' | 'educationFallback' | 'certificateFallback') => string,
): SectionListOptions {
  const o: SectionListOptions = raw != null && typeof raw === 'object' ? { ...(raw as SectionListOptions) } : {};
  const titleTrim = typeof o.title === 'string' ? o.title.trim() : '';
  switch (type) {
    case 'job':
      return { ...o, title: titleTrim || tf('jobFallback'), items: Array.isArray(o.items) ? o.items : [] };
    case 'project':
      return { ...o, title: titleTrim || tf('projectFallback'), items: Array.isArray(o.items) ? o.items : [] };
    case 'education':
      return { ...o, title: titleTrim || tf('educationFallback'), items: Array.isArray(o.items) ? o.items : [] };
    case 'certificate':
      return { ...o, title: titleTrim || tf('certificateFallback'), items: Array.isArray(o.items) ? o.items : [] };
    default:
      return o;
  }
}

function renderCertificateBody(options: SectionListOptions, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, unknown>, index: number) => {
        const name = typeof item.name === 'string' ? item.name : '';
        const date = typeof item.date === 'string' ? item.date : '';
        return (
          <div
            key={`${index}-${name}-${date}`}
            className='flex w-full justify-between text-black not-last:mb-[5px]'
            style={{ fontSize: `${globalStyle.fontSize}px` }}
          >
            <div className='flex-6'>{name}</div>
            <div className='flex-4 text-right'>{date}</div>
          </div>
        );
      })}
    </div>
  );
}

function renderSkillBody(options: { description?: string }, globalStyle: GlobalStyle) {
  const description = options.description ?? '';
  return plainTextFromRichHtml(description) ? (
    <ResumeQuillHtml
      html={description}
      style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
      className='text-black'
    />
  ) : <div />;
}

function renderOtherBody(options: { description?: string }, globalStyle: GlobalStyle) {
  const description = options.description ?? '';
  return plainTextFromRichHtml(description) ? (
    <ResumeQuillHtml
      html={description}
      style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
      className='text-black'
    />
  ) : <div />;
}

function renderJobBody(options: SectionListOptions, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, unknown>, index: number) => {
        const company = typeof item.company === 'string' ? item.company : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const post = typeof item.post === 'string' ? item.post : '';
        const department = typeof item.department === 'string' ? item.department : '';
        const city = typeof item.city === 'string' ? item.city : '';
        const description = typeof item.description === 'string' ? item.description : '';
        return (
          <div
            key={`${index}-${company}-${startDate}-${endDate}`}
            className='w-full text-black not-last:mb-[10px]'
            style={{ fontSize: `${globalStyle.fontSize}px` }}
          >
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-5 font-bold'>{company}</div>
              <div className='flex-5 text-right'>
                {startDate} - {endDate}
              </div>
            </div>
            {(post || department || city) && (
              <div className='mb-[5px] flex justify-between'>
                <div className='flex-6'>
                  {post}
                  {post ? ' ' : ''}
                  {department}
                </div>
                <div className='flex-2 text-right'>
                  {normalizeResumeCityDisplay(city)}
                </div>
              </div>
            )}
            {plainTextFromRichHtml(description) ? (
              <ResumeQuillHtml
                html={description}
                style={{
                  fontSize: `${globalStyle.fontSize}px`,
                  lineHeight: globalStyle.lineHeight,
                }}
                className='text-black'
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function renderProjectBody(options: SectionListOptions, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, unknown>, index: number) => {
        const name = typeof item.name === 'string' ? item.name : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const role = typeof item.role === 'string' ? item.role : '';
        const description = typeof item.description === 'string' ? item.description : '';
        return (
          <div
            key={`${index}-${name}-${startDate}-${endDate}`}
            className='w-full text-black not-last:mb-[10px]'
            style={{ fontSize: `${globalStyle.fontSize}px` }}
          >
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-5 font-bold'>{name}</div>
              <div className='flex-5 text-right'>
                {startDate} - {endDate}
              </div>
            </div>
            {role && (
              <div className='mb-[5px] flex justify-between'>
                <div className='flex-6'>{role}</div>
              </div>
            )}
            {plainTextFromRichHtml(description) ? (
              <ResumeQuillHtml
                html={description}
                style={{
                  fontSize: `${globalStyle.fontSize}px`,
                  lineHeight: globalStyle.lineHeight,
                }}
                className='text-black'
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function renderEducationBody(options: SectionListOptions, globalStyle: GlobalStyle) {
  return (
    <div className='w-full' style={{ fontSize: `${globalStyle.fontSize}px` }}>
      {(options.items ?? []).map((item: Record<string, unknown>, index: number) => {
        const school = typeof item.school === 'string' ? item.school : '';
        const startDate = typeof item.startDate === 'string' ? item.startDate : '';
        const endDate = typeof item.endDate === 'string' ? item.endDate : '';
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const degree = typeof item.degree === 'string' ? item.degree : '';
        const major = typeof item.major === 'string' ? item.major : '';
        const academy = typeof item.academy === 'string' ? item.academy : '';
        const city = typeof item.city === 'string' ? item.city : '';
        const description = typeof item.description === 'string' ? item.description : '';
        return (
          <div
            key={`${index}-${school}-${startDate}-${endDate}`}
            className='w-full text-black not-last:mb-[10px]'
          >
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-5 flex items-center'>
                <span className='font-bold'>{school}</span>
                <div className='ml-[10px] flex items-center'>
                  {tags.map((tag: unknown, tagIndex: number) => {
                    const tagStr = typeof tag === 'string' ? tag : '';
                    return (
                      <div
                        key={`${tagIndex}-${tagStr}`}
                        style={{
                          backgroundColor: globalStyle.color,
                          color: '#fff',
                          fontSize: `${globalStyle.fontSize - 4}px`,
                        }}
                        className='not-last:mr-[5px] rounded-[5px] px-[5px] py-[2px]'
                      >
                        {tagStr}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className='flex-5 text-right'>
                {startDate} - {endDate}
              </div>
            </div>
            {degree && (
              <div className='mb-[5px] flex justify-between'>
                <div className='flex-7'>
                  {major} {degree} {academy}
                </div>
                <div className='flex-3 text-right'>
                  {normalizeResumeCityDisplay(city)}
                </div>
              </div>
            )}
            {plainTextFromRichHtml(description) ? (
              <ResumeQuillHtml
                html={description}
                style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
                className='text-black'
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function renderFragmentBody(fragment: CanvasModuleFragmentConfig, globalStyle: GlobalStyle) {
  switch (fragment.type) {
    case 'certificate':
      return renderCertificateBody(fragment.options, globalStyle);
    case 'skill':
      return renderSkillBody(fragment.options, globalStyle);
    case 'other':
      return renderOtherBody(fragment.options, globalStyle);
    case 'job':
      return renderJobBody(fragment.options, globalStyle);
    case 'project':
      return renderProjectBody(fragment.options, globalStyle);
    case 'education':
      return renderEducationBody(fragment.options, globalStyle);
    default:
      return null;
  }
}

function CanvasModuleFragment({
  fragment,
  globalStyle,
}: {
  fragment: CanvasModuleFragmentConfig;
  globalStyle: GlobalStyle;
}) {
  const tf = useTranslations('Edit.moduleFragment');
  const opts = normalizeSectionListOptions(fragment.type, fragment.options, tf);
  const frag = { ...fragment, options: opts };
  return (
    <SectionModuleShell
      moduleId={frag.domId}
      activeModuleId={frag.sourceId}
      headerConfig={frag.options as any}
      moduleType={frag.type}
      globalStyle={globalStyle}
      showHeader={frag.showHeader}
      sectionOrdinal={frag.sectionOrdinal}
    >
      {renderFragmentBody(frag, globalStyle)}
    </SectionModuleShell>
  );
}

export function canSplitModule(module: { type?: string } | null | undefined) {
  return module?.type != null && module.type !== 'info1';
}

export function isTextFlowModule(type: string) {
  return type === 'skill' || type === 'other';
}

export function isListFlowModule(type: string) {
  return type === 'certificate' || type === 'job' || type === 'project' || type === 'education';
}

export function itemDescriptionField(type: string): string | null {
  if (type === 'job' || type === 'project' || type === 'education') {
    return 'description';
  }
  return null;
}

export default memo(CanvasModuleFragment);