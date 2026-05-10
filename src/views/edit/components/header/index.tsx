'use client';
import { Link } from '@/i18n/navigation';
import { useDebounceFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { observer } from 'mobx-react';
import { Button, Input, message, Popover, Select, Tooltip } from 'antd';
import { EditOutlined, MenuOutlined, RightOutlined } from '@ant-design/icons';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume.json';
import SectionHeader from '@/modules/header/sectionHeader';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ModuleManage from './moduleManage';
import { withBasePath } from '@/lib/withBasePath';
import { normResumeFont, type ResumeFontId } from '@/lib/resumeFont';
import {
  RESUME_PAGE_SIZE_OPTIONS,
  normResumePageSize,
  type ResumePageSize,
} from '@/lib/resumePageSize';

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
const HEADER_TYPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
function headerTypeNorm(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(8, Math.floor(n));
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
function normHex(s: string) {
  const t = s.trim().toLowerCase();
  return t.startsWith('#') ? t : `#${t}`;
}
function hexForColorInput(s: string, fb: string) {
  const n = normHex(s);
  if (/^#[0-9a-f]{6}$/.test(n)) return n;
  if (/^#[0-9a-f]{3}$/.test(n)) {
    const x = n.slice(1);
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`;
  }
  return fb;
}
function Header() {
  const t = useTranslations('Edit.header');
  const resumeFontOptions = useMemo(
    () =>
      [
        { value: 'system' as const, label: t('fontSystem') },
        { value: 'noto-serif-sc' as const, label: t('fontSerif') },
        { value: 'noto-sans-sc' as const, label: t('fontSans') },
      ] satisfies { label: string; value: ResumeFontId }[],
    [t],
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);
  const [pickerDraft, setPickerDraft] = useState(defaultResume.globalStyle.color);
  const pickerDraftRef = useRef(pickerDraft);
  pickerDraftRef.current = pickerDraft;
  const [bgPickerDraft, setBgPickerDraft] = useState(
    defaultResume.globalStyle.backgroundColor,
  );
  const bgPickerDraftRef = useRef(bgPickerDraft);
  bgPickerDraftRef.current = bgPickerDraft;
  const ignoreNextBlur = useRef(false);
  const [exportPopOpen, setExportPopOpen] = useState(false);
  const [toolbarCompact, setToolbarCompact] = useState(false);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const [moreConfigOpen, setMoreConfigOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const apply = () => setToolbarCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!toolbarCompact) setCompactMenuOpen(false);
  }, [toolbarCompact]);

  useEffect(() => {
    if (toolbarCompact) setMoreConfigOpen(false);
  }, [toolbarCompact]);

  const name = configStore.getConfig?.name ?? defaultResume.name;
  const rawFs = Number(configStore.mergedGlobalStyle.fontSize);
  const fontSize = Number.isFinite(rawFs)
    ? rawFs
    : defaultResume.globalStyle.fontSize;
  const fontSizeOptions = FONT_SIZE_OPTIONS.some((o) => o.value === fontSize)
    ? FONT_SIZE_OPTIONS
    : [...FONT_SIZE_OPTIONS, { label: `${fontSize}px`, value: fontSize }].sort(
      (a, b) => a.value - b.value
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
    (o) => Math.abs(o.value - lineHeightNorm) < 1e-6
  )
    ? LINE_HEIGHT_OPTIONS
    : [
        ...LINE_HEIGHT_OPTIONS,
        {
          label: lineHeightNorm.toFixed(1),
          value: lineHeightNorm,
        },
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
  const pageSizeVal = normResumePageSize(
    configStore.mergedGlobalStyle.pageSize
  );

  const rawMm = Number(configStore.mergedGlobalStyle.moduleMargin);
  const moduleMarginVal = Number.isFinite(rawMm)
    ? rawMm
    : defaultResume.globalStyle.moduleMargin;
  const moduleMarginOptions = MODULE_MARGIN_OPTIONS.some(
    (o) => o.value === moduleMarginVal
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
      color: normHex(v),
    };
    configStore.setConfig(base);
  };
  const debouncedThemeFromPicker = useDebounceFn(
    (v: string) => setGlobalThemeColor(v),
    { wait: 280 },
  );
  const setGlobalBackgroundColor = (v: string) => {
    const base = configStore.getConfig
      ? JSON.parse(JSON.stringify(configStore.getConfig))
      : JSON.parse(JSON.stringify(defaultResume));
    base.globalStyle = {
      ...defaultResume.globalStyle,
      ...(base.globalStyle ?? {}),
      backgroundColor: normHex(v),
    };
    configStore.setConfig(base);
  };
  const debouncedBgFromPicker = useDebounceFn(
    (v: string) => setGlobalBackgroundColor(v),
    { wait: 280 },
  );
  const mergedGs = configStore.mergedGlobalStyle as GlobalStyle;
  const headerTypeVal = headerTypeNorm(mergedGs.headerType);
  const headerTypeOptions = HEADER_TYPE_VALUES.map((n) => ({
    value: n,
    title: t('headerStyleTemplate', { n }),
    label: (
      <div className='py-1.5'>
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
          ) : (
            <SectionHeader
              config={{ title: t('moduleTitlePreview'), moduleType: 'education' }}
              globalStyle={headerPreviewGlobal(n, mergedGs)}
            />
          )}
        </div>
      </div>
    ),
  }));
  const rawTheme = configStore.mergedGlobalStyle.color;
  const themeColor =
    typeof rawTheme === 'string' && rawTheme.trim()
      ? normHex(rawTheme)
      : defaultResume.globalStyle.color;
  const pickerInputValue = /^#[0-9a-f]{6}$/i.test(pickerDraft)
    ? pickerDraft
    : defaultResume.globalStyle.color;
  const rawBg = configStore.mergedGlobalStyle.backgroundColor;
  const pageBgColor =
    typeof rawBg === 'string' && rawBg.trim()
      ? normHex(rawBg)
      : defaultResume.globalStyle.backgroundColor;
  const bgPickerInputValue = hexForColorInput(
    bgPickerDraft,
    hexForColorInput(pageBgColor, '#ffffff'),
  );
  const commit = () => {
    const trimmed = draft.trim();
    const base = configStore.getConfig ?? JSON.parse(JSON.stringify(defaultResume));
    configStore.setConfig({ ...base, name: trimmed || name });
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };

  const cancel = () => {
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };

  const onBlur = () => {
    if (ignoreNextBlur.current) return;
    commit();
  };

  const snapshotForExport = () => {
    const raw = configStore.getConfig;
    if (!raw) return JSON.parse(JSON.stringify(defaultResume));
    return JSON.parse(
      JSON.stringify({
        ...raw,
        globalStyle: configStore.mergedGlobalStyle,
        exportPages: configStore.getExportPages,
      }),
    );
  };

  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading) return;
    setPdfLoading(true);
    try {
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch(withBasePath('/api/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: snapshotForExport(),
          filename: `${safe}.pdf`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : t('requestFailed', { status: res.status })
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportPdfOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setPdfLoading(false);
    }
  };

  const exportPng = async () => {
    if (typeof window === 'undefined' || pngLoading) return;
    setPngLoading(true);
    try {
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch(withBasePath('/api/png'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: snapshotForExport(),
          filename: `${safe}.png`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : t('requestFailed', { status: res.status })
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.png`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportPngOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setPngLoading(false);
    }
  };

  const exportJson = () => {
    try {
      const cfg = snapshotForExport();
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const json = JSON.stringify(cfg, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.json`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportJsonOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    }
  };

  const tc = toolbarCompact;
  // 紧凑模式（移动端弹窗）：Select 有自己的边框和背景
  const selCompactSkin =
    '[&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[color:var(--antd-select-compact-border)] [&_.ant-select-selector]:!bg-[var(--antd-select-compact-bg)] [&_.ant-select-selection-item]:!text-[var(--antd-select-compact-fg)] [&_.ant-select-arrow]:!text-[var(--antd-select-compact-muted)]';
  // 桌面模式：Select 嵌在 pill 壳里，去掉内层边框和背景，避免双重边框
  const selDesktopSkin =
    '[&_.ant-select-selector]:!min-h-[28px] [&_.ant-select-selector]:!border-none [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:!px-0 [&_.ant-select-selection-item]:!text-fg/90 [&_.ant-select-arrow]:!text-fg/50';
  const selSkin = tc ? selCompactSkin : selDesktopSkin;
  const selClass = (mw: string) =>
    tc ? `w-full min-w-0 [&_.ant-select-selector]:!w-full ${selSkin}` : `${mw} ${selSkin}`;
  const selPortal = tc ? { getPopupContainer: () => document.body } : {};
  const toolbarFieldShellClass =
    'inline-flex h-[38px] shrink-0 items-center gap-2 rounded-full border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--surface-fg-rgb)/0.05),rgb(var(--surface-fg-rgb)/0.025))] px-2.5 shadow-[inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.04)]';
  const toolbarFieldLabelClass =
    'shrink-0 pl-0.5 text-[13px] font-medium tracking-[0.02em] text-fg/48';
  const wrapBar = (
    label: string,
    node: ReactNode,
    desktopVariant: 'field' | 'bare' = 'field'
  ) =>
    tc ? (
      <div className='flex flex-col gap-1'>
        <span className='text-[13px] text-fg/45 pr-[5px]'>{label}</span>
        {node}
      </div>
    ) : (
      desktopVariant === 'bare' ? node : (
        <div className={toolbarFieldShellClass}>
          <span className={`${toolbarFieldLabelClass} pr-[5px]` }>{label}</span>
          {node}
        </div>
      )
    );
  const popBodyToDoc = tc ? { getPopupContainer: () => document.body } : {};
  const fullRowBtn = tc ? 'w-full justify-center' : '';

  const moreConfigButton = (
    <button
      type='button'
      aria-expanded={moreConfigOpen}
      aria-haspopup='dialog'
      className='flex h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.06] px-3.5 text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/10'
    >
      <span>{t('more')}</span>
      <RightOutlined
        className={`text-[10px] text-fg/70 transition-transform duration-200 ${
          moreConfigOpen ? 'rotate-90' : ''
        }`}
      />
    </button>
  );

  const secondaryToolbarFields = (
    <>
      {wrapBar(
        t('fontSizeLabel'),
        <Select
          value={fontSize}
          options={fontSizeOptions}
          onChange={(v) => setGlobalFontSize(v)}
          className={selClass('min-w-[76px]')}
          popupClassName='[&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('fontFamilyLabel'),
        <Select
          value={resumeFontVal}
          options={resumeFontOptions}
          onChange={(v) => setGlobalResumeFont(v)}
          popupMatchSelectWidth={false}
          className={selClass('min-w-[168px]')}
          popupClassName='min-w-[220px] [&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('headerStyleLabel'),
        <Select
          virtual={false}
          value={headerTypeVal}
          optionLabelProp='title'
          options={headerTypeOptions}
          onChange={(v) => setGlobalHeaderType(v)}
          popupMatchSelectWidth={false}
          className={selClass('min-w-[88px]')}
          popupClassName='[&_.ant-select-item]:!min-h-[unset] [&_.ant-select-item]:!py-1 [&_.ant-select-item-option-selected]:!bg-fg/10 [&_.ant-select-item-option-active]:!bg-fg/8'
          styles={{
            popup: {
              root: {
                backgroundColor: 'var(--antd-popup-bg)',
                padding: 6,
                minWidth: 268,
              },
            },
          }}
          {...selPortal}
        />
      )}
      <div className='basis-full'>
        <div className={tc ? 'mb-1 text-[13px] text-fg/45' : 'mb-1 text-[13px] text-fg/45'}>
          {t('moduleManage')}
        </div>
        <ModuleManage inline className='rounded-xl border border-fg/[0.08] bg-fg/[0.03] p-2.5' />
      </div>
    </>
  );

  const toolbarFields = (
    <>
      {wrapBar(
        t('paperLabel'),
        <Select
          value={pageSizeVal}
          options={RESUME_PAGE_SIZE_OPTIONS}
          onChange={(v) => setGlobalPageSize(v)}
          popupMatchSelectWidth={false}
          className={selClass('min-w-[118px]')}
          popupClassName='min-w-[200px] [&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('pagePaddingLabel'),
        <Select
          value={pagePadding}
          options={pagePaddingOptions}
          onChange={(v) => setGlobalPagePadding(v)}
          className={selClass('min-w-[76px]')}
          popupClassName='[&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('moduleMarginLabel'),
        <Select
          value={moduleMarginVal}
          options={moduleMarginOptions}
          onChange={(v) => setGlobalModuleMargin(v)}
          className={selClass('min-w-[76px]')}
          popupClassName='[&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('lineHeightLabel'),
        <Select
          value={lineHeightNorm}
          options={lineHeightOptions}
          onChange={(v) => setGlobalLineHeight(v)}
          className={selClass('min-w-[76px]')}
          popupClassName='[&_.ant-select-item]:text-fg/90 [&_.ant-select-item-option-selected]:!bg-fg/15 [&_.ant-select-item-option-active]:!bg-fg/10'
          styles={{
            popup: {
              root: { backgroundColor: 'var(--antd-popup-bg)', padding: 4 },
            },
          }}
          {...selPortal}
        />
      )}
      {wrapBar(
        t('themeColorLabel'),
        <Popover
          trigger='click'
          placement={tc ? 'left' : 'bottom'}
          {...popBodyToDoc}
          onOpenChange={(open) => {
            if (open) {
              const raw = configStore.mergedGlobalStyle.color;
              const next =
                typeof raw === 'string' && raw.trim()
                  ? normHex(raw)
                  : defaultResume.globalStyle.color;
              setPickerDraft(next);
              pickerDraftRef.current = next;
            } else {
              debouncedThemeFromPicker.cancel();
              const next = normHex(pickerDraftRef.current);
              const rawCur = configStore.mergedGlobalStyle.color;
              const cur =
                typeof rawCur === 'string' && rawCur.trim()
                  ? normHex(rawCur)
                  : defaultResume.globalStyle.color;
              if (next !== cur) setGlobalThemeColor(pickerDraftRef.current);
            }
          }}
          styles={{
            body: {
              backgroundColor: 'var(--antd-popup-bg)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--antd-popup-border)',
            },
          }}
          content={
            <div className='w-[220px]'>
              <div className='mb-2 text-[11px] text-fg/60'>{t('preset')}</div>
              <div className='mb-3 flex flex-wrap gap-2'>
                {THEME_PRESETS.map((c) => (
                  <button
                    key={c}
                    type='button'
                    aria-label={c}
                    onClick={() => {
                      debouncedThemeFromPicker.cancel();
                      setPickerDraft(c);
                      setGlobalThemeColor(c);
                    }}
                    className={`size-7 shrink-0 rounded-md border-2 transition-transform hover:scale-110 ${
                      normHex(c) === normHex(themeColor)
                        ? 'border-fg ring-2 ring-fg/35'
                        : 'border-fg/25'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className='mb-1.5 text-[11px] text-fg/60'>{t('custom')}</div>
              <input
                type='color'
                value={pickerInputValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setPickerDraft(v);
                  debouncedThemeFromPicker.run(v);
                }}
                className='h-9 w-full cursor-pointer rounded border border-fg/15 bg-transparent p-0'
              />
            </div>
          }
        >
          <button
            type='button'
            aria-label={t('themeColorAria')}
            className={`size-[30px] shrink-0 cursor-pointer rounded-md border shadow-inner border-[color:var(--antd-popup-border)] ${tc ? 'mx-auto' : ''}`}
            style={{ backgroundColor: themeColor }}
          />
        </Popover>
      )}
      {wrapBar(
        t('bgColorLabel'),
        <Popover
          trigger='click'
          placement={tc ? 'left' : 'bottom'}
          {...popBodyToDoc}
          onOpenChange={(open) => {
            if (open) {
              const raw = configStore.mergedGlobalStyle.backgroundColor;
              const next = hexForColorInput(
                typeof raw === 'string' && raw.trim()
                  ? raw
                  : defaultResume.globalStyle.backgroundColor,
                '#ffffff',
              );
              setBgPickerDraft(next);
              bgPickerDraftRef.current = next;
            } else {
              debouncedBgFromPicker.cancel();
              const next = normHex(bgPickerDraftRef.current);
              const rawCur = configStore.mergedGlobalStyle.backgroundColor;
              const cur =
                typeof rawCur === 'string' && rawCur.trim()
                  ? normHex(rawCur)
                  : defaultResume.globalStyle.backgroundColor;
              if (next !== cur) setGlobalBackgroundColor(bgPickerDraftRef.current);
            }
          }}
          styles={{
            body: {
              backgroundColor: 'var(--antd-popup-bg)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--antd-popup-border)',
            },
          }}
          content={
            <div className='w-[220px]'>
              <div className='mb-2 text-[11px] text-fg/60'>{t('preset')}</div>
              <div className='mb-3 flex flex-wrap gap-2'>
                {BG_PRESETS.map((c) => (
                  <button
                    key={c}
                    type='button'
                    aria-label={c}
                    onClick={() => {
                      debouncedBgFromPicker.cancel();
                      setBgPickerDraft(c);
                      setGlobalBackgroundColor(c);
                    }}
                    className={`size-7 shrink-0 rounded-md border-2 transition-transform hover:scale-110 ${
                      normHex(c) === normHex(pageBgColor)
                        ? 'border-fg ring-2 ring-fg/35'
                        : 'border-fg/25'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className='mb-1.5 text-[11px] text-fg/60'>{t('custom')}</div>
              <input
                type='color'
                value={bgPickerInputValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setBgPickerDraft(v);
                  debouncedBgFromPicker.run(v);
                }}
                className='h-9 w-full cursor-pointer rounded border border-fg/15 bg-transparent p-0'
              />
            </div>
          }
        >
          <button
            type='button'
            aria-label={t('bgColorAria')}
            className={`size-[30px] shrink-0 cursor-pointer rounded-md border shadow-inner border-[color:var(--antd-popup-border)] ${tc ? 'mx-auto' : ''}`}
            style={{ backgroundColor: pageBgColor }}
          />
        </Popover>
      )}
      {wrapBar(
        t('moreSettings'),
        tc ? secondaryToolbarFields : (
          <Popover
            open={moreConfigOpen}
            onOpenChange={setMoreConfigOpen}
            placement='bottomRight'
            trigger='click'
            arrow={false}
            {...popBodyToDoc}
            styles={{
              root: { zIndex: 1050 },
              body: {
                padding: 10,
                background: 'var(--antd-popup-panel)',
                borderRadius: 10,
              },
            }}
            content={
              <div className='flex max-w-[min(72vw,720px)] flex-wrap gap-2.5'>
                {secondaryToolbarFields}
              </div>
            }
          >
            {moreConfigButton}
          </Popover>
        ),
        'bare'
      )}
      {wrapBar(
        t('exportLabel'),
        <Popover
          open={exportPopOpen}
          onOpenChange={setExportPopOpen}
          placement='bottomRight'
          trigger='click'
          arrow={false}
          {...popBodyToDoc}
          styles={{
            root: { zIndex: 1050 },
            body: {
              padding: 8,
              background: 'var(--antd-popup-panel)',
              borderRadius: 10,
            },
          }}
          content={
            <div className='flex min-w-[132px] flex-col gap-0.5'>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setCompactMenuOpen(false);
                  setExportPopOpen(false);
                  void exportPdf();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {t('exportPdf')}
              </button>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setCompactMenuOpen(false);
                  setExportPopOpen(false);
                  void exportPng();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {t('exportPng')}
              </button>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setCompactMenuOpen(false);
                  setExportPopOpen(false);
                  exportJson();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {t('exportJson')}
              </button>
            </div>
          }
        >
          <button
            type='button'
            disabled={pdfLoading || pngLoading}
            aria-expanded={exportPopOpen}
            aria-haspopup='menu'
            className={`flex h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.06] px-3.5 text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/10 disabled:cursor-not-allowed disabled:opacity-70 ${fullRowBtn}`}
          >
            {pdfLoading || pngLoading ? (
              <>
                <span
                  className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-fg/25 border-t-[var(--text-strong)]'
                  aria-hidden
                />
                <span>{t('exporting')}</span>
              </>
            ) : (
              <>
                <span>{t('exportLabel')}</span>
                <RightOutlined
                  className={`text-[10px] text-fg/70 transition-transform duration-200 ${
                    exportPopOpen ? 'rotate-90' : ''
                  }`}
                />
              </>
            )}
          </button>
        </Popover>,
        'bare'
      )}
    </>
  );

  return (
    <div className='flex h-full items-center justify-between gap-4 px-4 md:px-5'>
      <div className='flex min-w-0 items-center gap-2 h-full'>
        <Link
          href='/'
          prefetch={false}
          className='flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg outline-none ring-[var(--text-strong)]/35 transition-opacity hover:opacity-90 focus-visible:ring-2'
          aria-label={t('backHome')}
        >
          <img
            src={withBasePath('/logo.png')}
            alt=''
            width={34}
            height={34}
            className='h-[32px] w-[32px] object-contain'
            draggable={false}
          />
        </Link>
        <div className='bg-gradient-primary-br h-[30px] w-[4px] shrink-0 rounded-full opacity-90' />
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            onPressEnter={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            onFocus={(e) => e.target.select()}
            maxLength={64}
            className='max-w-[280px] min-w-[120px]'
            styles={{
              input: {
                backgroundColor: 'var(--antd-input-bg)',
                color: 'var(--antd-input-fg)',
                border: '1px solid var(--antd-input-border)',
                borderRadius: 6,
                paddingInline: 8,
                height: 28,
              },
            }}
          />
        ) : (
          <>
            <span className='truncate text-[15px] font-medium leading-[22px] text-fg/96' title={name}>
              {name}
            </span>
            <Button
              type='text'
              size='small'
              icon={<EditOutlined />}
              aria-label={t('editNameAria')}
              className='!text-fg/45 hover:!text-[var(--text-strong)] !p-0 !h-7 !w-7 !min-w-7 inline-flex items-center justify-center shrink-0'
              onClick={startEdit}
            />
          </>
        )}
      </div>
      {toolbarCompact ? (
        <Popover
          open={compactMenuOpen}
          onOpenChange={setCompactMenuOpen}
          placement='bottomRight'
          trigger='click'
          arrow={false}
          getPopupContainer={() => document.body}
          styles={{
            root: { zIndex: 1050 },
            body: {
              padding: 12,
              background: 'var(--antd-popup-panel)',
              borderRadius: 10,
              maxHeight: 'min(78vh, 560px)',
              overflowY: 'auto',
            },
          }}
          content={
            <div className='w-[min(92vw,300px)] max-w-[92vw]'>
              <div className='flex flex-col gap-3 pr-0.5'>{toolbarFields}</div>
            </div>
          }
        >
          <button
            type='button'
            aria-expanded={compactMenuOpen}
            aria-haspopup='dialog'
            className='flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.06] px-3 text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/10'
          >
            <MenuOutlined className='text-[14px] text-fg/85' />
            <span>{t('typography')}</span>
            <RightOutlined
              className={`text-[10px] text-fg/70 transition-transform duration-200 ${
                compactMenuOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        </Popover>
      ) : (
        <div className='flex min-w-0 flex-1 items-center justify-end overflow-hidden'>
          <div className='flex min-w-0 flex-1 items-center justify-end'>
            <div className='flex min-w-max items-center gap-2.5 pl-1'>
              {toolbarFields}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(observer(Header));
