'use client';

interface SectionListOptions {
  title?: string;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import CertificateItemsBody from '@/modules/certificate/certificateItemsBody';
import EducationItemsBody from '@/modules/education/educationItemsBody';
import SectionModuleShell from '@/modules/layout/sectionModuleShell';
import JobItemsBody from '@/modules/job/jobItemsBody';
import ProjectItemsBody from '@/modules/project/projectItemsBody';
import RichDescriptionBody from '@/modules/shared/richDescriptionBody';
import type { GlobalStyle } from '@/modules/utils/common.type';

export interface CanvasModuleFragmentConfig {
  type: string;
  sourceId: string;
  domId: string;
  showHeader: boolean;
  options: Record<string, any>;
  sectionOrdinal?: number;
  selectable?: boolean;
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

function renderCertificateBody(
  moduleId: string,
  options: SectionListOptions,
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <CertificateItemsBody
      moduleId={moduleId}
      items={(options.items ?? []) as Array<Record<string, unknown>>}
      globalStyle={globalStyle}
      selectable={selectable}
    />
  );
}

function renderSkillBody(
  moduleId: string,
  options: { description?: string },
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <RichDescriptionBody
      description={options.description}
      globalStyle={globalStyle}
      selectable={selectable}
      dataItemId={`${moduleId}_description`}
    />
  );
}

function renderOtherBody(
  moduleId: string,
  options: { description?: string },
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <RichDescriptionBody
      description={options.description}
      globalStyle={globalStyle}
      selectable={selectable}
      dataItemId={`${moduleId}_description`}
    />
  );
}

function renderJobBody(
  moduleId: string,
  options: SectionListOptions,
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <JobItemsBody
      moduleId={moduleId}
      items={(options.items ?? []) as Array<Record<string, unknown>>}
      globalStyle={globalStyle}
      selectable={selectable}
    />
  );
}

function renderProjectBody(
  moduleId: string,
  options: SectionListOptions,
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <ProjectItemsBody
      moduleId={moduleId}
      items={(options.items ?? []) as Array<Record<string, unknown>>}
      globalStyle={globalStyle}
      selectable={selectable}
    />
  );
}

function renderEducationBody(
  moduleId: string,
  options: SectionListOptions,
  globalStyle: GlobalStyle,
  selectable: boolean,
) {
  return (
    <EducationItemsBody
      moduleId={moduleId}
      items={(options.items ?? []) as Array<Record<string, unknown>>}
      globalStyle={globalStyle}
      selectable={selectable}
    />
  );
}

function renderFragmentBody(fragment: CanvasModuleFragmentConfig, globalStyle: GlobalStyle) {
  const selectable = fragment.selectable ?? true;
  const moduleId = fragment.sourceId;
  switch (fragment.type) {
    case 'certificate':
      return renderCertificateBody(moduleId, fragment.options, globalStyle, selectable);
    case 'skill':
      return renderSkillBody(moduleId, fragment.options, globalStyle, selectable);
    case 'other':
      return renderOtherBody(moduleId, fragment.options, globalStyle, selectable);
    case 'job':
      return renderJobBody(moduleId, fragment.options, globalStyle, selectable);
    case 'project':
      return renderProjectBody(moduleId, fragment.options, globalStyle, selectable);
    case 'education':
      return renderEducationBody(moduleId, fragment.options, globalStyle, selectable);
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