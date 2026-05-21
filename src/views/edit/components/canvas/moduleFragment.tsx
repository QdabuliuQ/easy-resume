'use client';
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
): Record<string, any> {
  const o = raw != null && typeof raw === 'object' ? { ...(raw as Record<string, any>) } : {};
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

function renderCertificateBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, any>, index: number) => (
        <div
          key={`${index}-${item.name ?? ''}-${item.date ?? ''}`}
          className='flex w-full justify-between text-black not-last:mb-[5px]'
          style={{ fontSize: `${globalStyle.fontSize}px` }}
        >
          <div className='flex-6'>{item.name}</div>
          <div className='flex-4 text-right'>{item.date}</div>
        </div>
      ))}
    </div>
  );
}

function renderSkillBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return plainTextFromRichHtml(options.description) ? (
    <ResumeQuillHtml
      html={options.description}
      style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
      className='text-[#333]'
    />
  ) : <div />;
}

function renderOtherBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return plainTextFromRichHtml(options.description) ? (
    <ResumeQuillHtml
      html={options.description}
      style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
      className='text-[#333]'
    />
  ) : <div />;
}

function renderJobBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, any>, index: number) => (
        <div
          key={`${index}-${item.company ?? ''}-${item.startDate ?? ''}-${item.endDate ?? ''}`}
          className='w-full text-[#333] not-last:mb-[10px]'
          style={{ fontSize: `${globalStyle.fontSize}px` }}
        >
          <div className='mb-[5px] flex justify-between'>
            <div className='flex-5 font-bold'>{item.company}</div>
            <div className='flex-5 text-right'>
              {item.startDate} - {item.endDate}
            </div>
          </div>
          {(item.post || item.department || item.city) && (
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-6'>
                {item.post}
                {item.post ? ' ' : ''}
                {item.department}
              </div>
              <div className='flex-2 text-right'>
                {normalizeResumeCityDisplay(item.city)}
              </div>
            </div>
          )}
          {plainTextFromRichHtml(item.description) ? (
            <ResumeQuillHtml
              html={item.description}
              style={{
                fontSize: `${globalStyle.fontSize}px`,
                lineHeight: globalStyle.lineHeight,
              }}
              className='text-[#333]'
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function renderProjectBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return (
    <div className='w-full'>
      {(options.items ?? []).map((item: Record<string, any>, index: number) => (
        <div
          key={`${index}-${item.name ?? ''}-${item.startDate ?? ''}-${item.endDate ?? ''}`}
          className='w-full text-[#333] not-last:mb-[10px]'
          style={{ fontSize: `${globalStyle.fontSize}px` }}
        >
          <div className='mb-[5px] flex justify-between'>
            <div className='flex-5 font-bold'>{item.name}</div>
            <div className='flex-5 text-right'>
              {item.startDate} - {item.endDate}
            </div>
          </div>
          {item.role && (
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-6'>{item.role}</div>
            </div>
          )}
          {plainTextFromRichHtml(item.description) ? (
            <ResumeQuillHtml
              html={item.description}
              style={{
                fontSize: `${globalStyle.fontSize}px`,
                lineHeight: globalStyle.lineHeight,
              }}
              className='text-[#333]'
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function renderEducationBody(options: Record<string, any>, globalStyle: GlobalStyle) {
  return (
    <div className='w-full' style={{ fontSize: `${globalStyle.fontSize}px` }}>
      {(options.items ?? []).map((item: Record<string, any>, index: number) => (
        <div
          key={`${index}-${item.school ?? ''}-${item.startDate ?? ''}-${item.endDate ?? ''}`}
          className='w-full text-[#333] not-last:mb-[10px]'
        >
          <div className='mb-[5px] flex justify-between'>
            <div className='flex-5 flex items-center'>
              <span className='font-bold'>{item.school}</span>
              <div className='ml-[10px] flex items-center'>
                {(item.tags ?? []).map((tag: string, tagIndex: number) => (
                  <div
                    key={`${tagIndex}-${tag}`}
                    style={{
                      backgroundColor: globalStyle.color,
                      color: '#fff',
                      fontSize: `${globalStyle.fontSize - 4}px`,
                    }}
                    className='not-last:mr-[5px] rounded-[5px] px-[5px] py-[2px]'
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            <div className='flex-5 text-right'>
              {item.startDate} - {item.endDate}
            </div>
          </div>
          {item.degree && (
            <div className='mb-[5px] flex justify-between'>
              <div className='flex-7'>
                {item.major} {item.degree} {item.academy}
              </div>
              <div className='flex-3 text-right'>
                {normalizeResumeCityDisplay(item.city)}
              </div>
            </div>
          )}
          {plainTextFromRichHtml(item.description) ? (
            <ResumeQuillHtml
              html={item.description}
              style={{ fontSize: `${globalStyle.fontSize}px`, lineHeight: globalStyle.lineHeight }}
              className='text-[#333]'
            />
          ) : null}
        </div>
      ))}
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