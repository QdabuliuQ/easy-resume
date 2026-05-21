'use client';
import { useTranslations } from 'next-intl';
import { memo, useMemo } from 'react';
import { observer } from 'mobx-react';
import { Form } from 'antd';
import ResponsiveColorPicker from '@/components/responsiveColorPicker';
import ResponsiveSelect from '@/components/responsiveSelect';
import { hexForColorInput } from '@/lib/resumeColorHex';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';
import SectionHeader, {
  SectionHeaderType11TimelineLayout,
} from '@/modules/header/sectionHeader';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ModuleManage from '@/views/edit/components/header/moduleManage';
import { normResumeFont, type ResumeFontId } from '@/lib/resumeFont';
import {
  RESUME_PAGE_SIZE_OPTIONS,
  normResumePageSize,
  type ResumePageSize,
} from '@/lib/resumePageSize';

const PAGE_SECTION_SHELL =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';
const FONT_SIZE_OPTIONS = Array.from({ length: 9 }, (_, i) => {
  const n = 10 + i;
  return { label: `${n}px`, value: n };
});
const LINE_HEIGHT_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const value = Math.round((1 + i * 0.1) * 10) / 10;
  return { label: value.toFixed(1), value };
});
const PAGE_PADDING_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45].map((n) => ({
  label: `${n}px`,
  value: n,
}));
const MODULE_MARGIN_OPTIONS = [10, 15, 20, 25, 30, 35, 40].map((n) => ({
  label: `${n}px`,
  value: n,
}));
const HEADER_TYPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
function headerTypeNorm(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(11, Math.floor(n));
}
function headerPreviewGlobal(t: number, base: GlobalStyle): GlobalStyle {
  return { ...base, headerType: t };
}
const THEME_PRESETS = [
  '#43a8ff',
  '#1677ff',
  '#1890ff',
  '#52c41a',
  '#fa8c16',
  '#f5222d',
  '#eb2f96',
  '#722ed1',
] as const;
const BG_PRESETS = ['#ffffff', '#f0fff4', '#f5f5f5', '#fffbe6'] as const;
const THEME_COLOR_FALLBACK = hexForColorInput(
  defaultResume.globalStyle.color,
  '#1890ff',
);
const BG_COLOR_FALLBACK = hexForColorInput(
  defaultResume.globalStyle.backgroundColor,
  '#ffffff',
);
function PageSettings() {
  const t = useTranslations('Edit.header');
  const [form] = Form.useForm();
  const resumeFontOptions = useMemo(
    () =>
      [
        { value: 'system' as const, label: t('fontSystem') },
        { value: 'noto-serif-sc' as const, label: t('fontSerif') },
        { value: 'noto-sans-sc' as const, label: t('fontSans') },
      ] satisfies { label: string; value: ResumeFontId }[],
    [t],
  );
  const rawFs = Number(configStore.mergedGlobalStyle.fontSize);
  const fontSize = Number.isFinite(rawFs)
    ? rawFs
    : defaultResume.globalStyle.fontSize;
  const fontSizeOptions = FONT_SIZE_OPTIONS.some((o) => o.value === fontSize)
    ? FONT_SIZE_OPTIONS
    : [...FONT_SIZE_OPTIONS, { label: `${fontSize}px`, value: fontSize }].sort(
        (a, b) => a.value - b.value,
      );
  const rawLh = Number(configStore.mergedGlobalStyle.lineHeight);
  const lineHeightBase = Number.isFinite(rawLh)
    ? rawLh
    : defaultResume.globalStyle.lineHeight;
  const lineHeight =
    Number.isFinite(lineHeightBase) && lineHeightBase >= 12
      ? lineHeightBase / (fontSize || defaultResume.globalStyle.fontSize)
      : lineHeightBase;
  const lineHeightNorm = Number.isFinite(lineHeight)
    ? Math.round(lineHeight * 10) / 10
    : defaultResume.globalStyle.lineHeight;
  const lineHeightOptions = LINE_HEIGHT_OPTIONS.some(
    (o) => Math.abs(o.value - lineHeightNorm) < 1e-6,
  )
    ? LINE_HEIGHT_OPTIONS
    : [
        ...LINE_HEIGHT_OPTIONS,
        { label: lineHeightNorm.toFixed(1), value: lineHeightNorm },
      ].sort((a, b) => Number(a.value) - Number(b.value));
  const rawPad = Number(configStore.mergedGlobalStyle.padding);
  const pagePadding = Number.isFinite(rawPad)
    ? rawPad
    : (defaultResume.globalStyle.padding ?? 0);
  const pagePaddingOptions = PAGE_PADDING_OPTIONS.some((o) => o.value === pagePadding)
    ? PAGE_PADDING_OPTIONS
    : [...PAGE_PADDING_OPTIONS, { label: `${pagePadding}px`, value: pagePadding }].sort(
        (a, b) => a.value - b.value,
      );
  const setGlobalFontSize = (v: number) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      fontSize: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalResumeFont = (v: ResumeFontId) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      resumeFont: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalPageSize = (v: ResumePageSize) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      pageSize: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalLineHeight = (v: number) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      lineHeight: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalPagePadding = (v: number) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      padding: v,
    };
    configStore.setConfig(base);
  };
  const resumeFontVal = normResumeFont(configStore.mergedGlobalStyle.resumeFont);
  const pageSizeVal = normResumePageSize(configStore.mergedGlobalStyle.pageSize);
  const rawMm = Number(configStore.mergedGlobalStyle.moduleMargin);
  const moduleMarginVal = Number.isFinite(rawMm)
    ? rawMm
    : defaultResume.globalStyle.moduleMargin;
  const moduleMarginOptions = MODULE_MARGIN_OPTIONS.some(
    (o) => o.value === moduleMarginVal,
  )
    ? MODULE_MARGIN_OPTIONS
    : [
        ...MODULE_MARGIN_OPTIONS,
        { label: `${moduleMarginVal}px`, value: moduleMarginVal },
      ].sort((a, b) => a.value - b.value);
  const setGlobalModuleMargin = (v: number) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      moduleMargin: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalHeaderType = (v: number) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      headerType: v,
    };
    configStore.setConfig(base);
  };
  const setGlobalThemeColor = (v: string) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      color: hexForColorInput(v, THEME_COLOR_FALLBACK),
    };
    configStore.setConfig(base);
  };
  const setGlobalBackgroundColor = (v: string) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      backgroundColor: hexForColorInput(v, BG_COLOR_FALLBACK),
    };
    configStore.setConfig(base);
  };
  const mergedGs = configStore.mergedGlobalStyle as GlobalStyle;
  const headerTypeVal = headerTypeNorm(mergedGs.headerType);
  const headerStylePreview = (n: number) => (
    <div
      className={
        n === 7
          ? 'grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-stretch gap-2 rounded border border-fg/10 bg-fg/[0.04] px-2 py-1.5 shadow-sm'
          : 'rounded border border-fg/10 bg-fg/[0.04] px-2 py-1.5 shadow-sm'
      }
    >
      {n === 7 ? (
        <>
          <div className='relative min-h-[36px] min-w-0'>
            <div
              className='pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-px'
              style={{ backgroundColor: mergedGs.color }}
              aria-hidden
            />
            <div className='relative z-[1] min-h-0 pr-2'>
              <SectionHeader
                config={{ title: t('moduleTitlePreview') }}
                globalStyle={headerPreviewGlobal(n, mergedGs)}
              />
            </div>
          </div>
          <div className='min-h-[36px] min-w-0 rounded-sm border border-zinc-200 bg-zinc-50' />
        </>
      ) : n === 11 ? (
        <SectionHeaderType11TimelineLayout
          title={t('moduleTitlePreview')}
          globalStyle={headerPreviewGlobal(n, mergedGs)}
        >
          <div className='min-h-6' />
        </SectionHeaderType11TimelineLayout>
      ) : (
        <SectionHeader
          config={{
            title: t('moduleTitlePreview'),
            moduleType: 'education',
            ...(n === 10 ? { sectionOrdinal: 1 } : {}),
          }}
          globalStyle={headerPreviewGlobal(n, mergedGs)}
        />
      )}
    </div>
  );
  const themeColorValue =
    typeof configStore.mergedGlobalStyle.color === 'string'
      ? configStore.mergedGlobalStyle.color
      : defaultResume.globalStyle.color;
  const bgColorValue =
    typeof configStore.mergedGlobalStyle.backgroundColor === 'string'
      ? configStore.mergedGlobalStyle.backgroundColor
      : defaultResume.globalStyle.backgroundColor;
  const fieldLabel = (text: string) => (
    <div className='flex items-center text-fg/85 text-[12px]'>{text}</div>
  );
  return (
    <div className='flex flex-col gap-5'>
      <div className={PAGE_SECTION_SHELL}>
        <div className='[&_.ant-form-item-label]:!pb-[5px] [&_.ant-form-item-label]:!h-[30px]'>
          <Form form={form} variant='filled' layout='vertical'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <Form.Item label={fieldLabel(t('paperLabel'))}>
                <ResponsiveSelect
                  value={pageSizeVal}
                  options={RESUME_PAGE_SIZE_OPTIONS}
                  onChange={(v) => setGlobalPageSize(v)}
                  popupMatchSelectWidth={false}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label={fieldLabel(t('pagePaddingLabel'))}>
                <ResponsiveSelect
                  value={pagePadding}
                  options={pagePaddingOptions}
                  onChange={(v) => setGlobalPagePadding(v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label={fieldLabel(t('moduleMarginLabel'))}>
                <ResponsiveSelect
                  value={moduleMarginVal}
                  options={moduleMarginOptions}
                  onChange={(v) => setGlobalModuleMargin(v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label={fieldLabel(t('lineHeightLabel'))}>
                <ResponsiveSelect
                  value={lineHeightNorm}
                  options={lineHeightOptions}
                  onChange={(v) => setGlobalLineHeight(v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label={fieldLabel(t('fontSizeLabel'))}>
                <ResponsiveSelect
                  value={fontSize}
                  options={fontSizeOptions}
                  onChange={(v) => setGlobalFontSize(v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label={fieldLabel(t('fontFamilyLabel'))}>
                <ResponsiveSelect
                  value={resumeFontVal}
                  options={resumeFontOptions}
                  onChange={(v) => setGlobalResumeFont(v)}
                  popupMatchSelectWidth={false}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                label={fieldLabel(t('themeColorLabel'))}
                className='[&_.ant-form-item-control-input-content]:flex [&_.ant-form-item-control-input-content]:justify-start'
              >
            <ResponsiveColorPicker
              value={themeColorValue}
              onChange={setGlobalThemeColor}
              presets={THEME_PRESETS}
              fallback={THEME_COLOR_FALLBACK}
              ariaLabel={t('themeColorAria')}
              title={t('themeColorLabel')}
              presetLabel={t('preset')}
            />
              </Form.Item>
              <Form.Item
                label={fieldLabel(t('bgColorLabel'))}
                className='[&_.ant-form-item-control-input-content]:flex [&_.ant-form-item-control-input-content]:justify-start'
              >
            <ResponsiveColorPicker
              value={bgColorValue}
              onChange={setGlobalBackgroundColor}
              presets={BG_PRESETS}
              fallback={BG_COLOR_FALLBACK}
              ariaLabel={t('bgColorAria')}
              title={t('bgColorLabel')}
              presetLabel={t('preset')}
            />
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>
      <div className={PAGE_SECTION_SHELL}>
        <div className='mb-3 text-[12px] font-semibold text-fg/72'>{t('headerStyleLabel')}</div>
        <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
          {HEADER_TYPE_VALUES.map((n) => {
            const sel = headerTypeVal === n;
            return (
              <button
                key={n}
                type='button'
                aria-pressed={sel}
                aria-label={t('headerStyleTemplate', { n })}
                onClick={() => setGlobalHeaderType(n)}
                className={`cursor-pointer rounded-xl border p-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-fg/30 ${
                  sel
                    ? 'border-fg/45 bg-fg/[0.09] shadow-[inset_0_0_0_1px_rgb(var(--surface-fg-rgb)/0.12)] ring-2 ring-fg/22'
                    : 'border-fg/[0.08] bg-fg/[0.02] hover:border-fg/[0.14] hover:bg-fg/[0.05]'
                }`}
              >
                <div className='mb-2 text-[11px] font-medium text-fg/55'>{t('headerStyleTemplate', { n })}</div>
                <div className='pointer-events-none min-w-0 select-none'>{headerStylePreview(n)}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className={PAGE_SECTION_SHELL}>
        <div className='mb-3 text-[12px] font-semibold text-fg/72'>{t('moduleManage')}</div>
        <ModuleManage inline  />
      </div>
    </div>
  );
}
export default memo(observer(PageSettings));
