'use client';
import { useDebounceFn } from 'ahooks';
import { memo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Input, message, Popover, Select, Tooltip } from 'antd';
import { EditOutlined, RightOutlined } from '@ant-design/icons';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume';
import resume from '@/json/resume';
import SectionHeader from '@/modules/header/sectionHeader';
import type { GlobalStyle } from '@/modules/utils/common.type';
import ModuleManage from './moduleManage';
import { withBasePath } from '@/lib/withBasePath';
import { normResumeFont, type ResumeFontId } from '@/lib/resumeFont';

const RESUME_FONT_OPTIONS: { label: string; value: ResumeFontId }[] = [
  { value: 'noto-sans', label: '思源黑体 Noto Sans SC' },
  { value: 'noto-serif', label: '思源宋体 Noto Serif SC' },
  { value: 'alibaba', label: '阿里巴巴普惠体 3.0' },
  { value: 'lxgw-wenkai', label: '霞鹜文楷 LXGW WenKai' },
];

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
const HEADER_PREVIEW_TITLE = '模块标题';
const HEADER_TYPE_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;
function headerTypeNorm(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(7, Math.floor(n));
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

  const name = configStore.getConfig?.name ?? resume.name;
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
    title: `样式 ${n}`,
    label: (
      <div className='py-1.5'>
        <div
          className={
            n === 7
              ? 'grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-stretch gap-2 rounded border border-black/10 bg-white px-2 py-1.5 shadow-sm'
              : 'rounded border border-black/10 bg-white px-2 py-1.5 shadow-sm'
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
                    config={{ title: HEADER_PREVIEW_TITLE }}
                    globalStyle={headerPreviewGlobal(n, mergedGs)}
                  />
                </div>
              </div>
              <div className='min-h-[36px] min-w-0 rounded-sm border border-zinc-200 bg-zinc-50' />
            </>
          ) : (
            <SectionHeader
              config={{ title: HEADER_PREVIEW_TITLE }}
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
    const base = configStore.getConfig ?? JSON.parse(JSON.stringify(resume));
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
      }),
    );
  };

  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading) return;
    setPdfLoading(true);
    try {
      const base = (name || '简历').trim() || '简历';
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
          typeof data.error === 'string' ? data.error : `请求失败 ${res.status}`
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      message.success('已导出 PDF');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败');
    } finally {
      setPdfLoading(false);
    }
  };

  const exportPng = async () => {
    if (typeof window === 'undefined' || pngLoading) return;
    setPngLoading(true);
    try {
      const base = (name || '简历').trim() || '简历';
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
          typeof data.error === 'string' ? data.error : `请求失败 ${res.status}`
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.png`;
      a.click();
      URL.revokeObjectURL(href);
      message.success('已导出 PNG');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败');
    } finally {
      setPngLoading(false);
    }
  };

  const exportJson = () => {
    try {
      const cfg = snapshotForExport();
      const base = (name || '简历').trim() || '简历';
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const json = JSON.stringify(cfg, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.json`;
      a.click();
      URL.revokeObjectURL(href);
      message.success('已导出 JSON');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败');
    }
  };

  return (
    <div className='h-full px-[20px] flex items-center justify-between'>
      <div className='flex items-center gap-1.5 min-w-0 h-full'>
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
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: 6,
                paddingInline: 8,
                height: 28,
              },
            }}
          />
        ) : (
          <>
            <span className='text-white text-[14px] leading-[22px] truncate' title={name}>
              {name}
            </span>
            <Button
              type='text'
              size='small'
              icon={<EditOutlined />}
              aria-label='编辑姓名'
              className='!text-[#aaa] hover:!text-white !p-0 !h-7 !w-7 !min-w-7 inline-flex items-center justify-center shrink-0'
              onClick={startEdit}
            />
          </>
        )}
      </div>
      <div className='flex h-full items-center gap-2'>
        <Tooltip title='正文字号' placement='bottom'>
          <Select
            value={fontSize}
            options={fontSizeOptions}
            onChange={(v) => setGlobalFontSize(v)}
            className='min-w-[76px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='[&_.ant-select-item]:text-white/90 [&_.ant-select-item-option-selected]:!bg-white/15 [&_.ant-select-item-option-active]:!bg-white/10'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 4 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='简历字体' placement='bottom'>
          <Select
            value={resumeFontVal}
            options={RESUME_FONT_OPTIONS}
            onChange={(v) => setGlobalResumeFont(v)}
            popupMatchSelectWidth={false}
            className='min-w-[168px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='min-w-[220px] [&_.ant-select-item]:text-white/90 [&_.ant-select-item-option-selected]:!bg-white/15 [&_.ant-select-item-option-active]:!bg-white/10'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 4 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='页边距（版心内边距）' placement='bottom'>
          <Select
            value={pagePadding}
            options={pagePaddingOptions}
            onChange={(v) => setGlobalPagePadding(v)}
            className='min-w-[76px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='[&_.ant-select-item]:text-white/90 [&_.ant-select-item-option-selected]:!bg-white/15 [&_.ant-select-item-option-active]:!bg-white/10'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 4 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='模块间距' placement='bottom'>
          <Select
            value={moduleMarginVal}
            options={moduleMarginOptions}
            onChange={(v) => setGlobalModuleMargin(v)}
            className='min-w-[76px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='[&_.ant-select-item]:text-white/90 [&_.ant-select-item-option-selected]:!bg-white/15 [&_.ant-select-item-option-active]:!bg-white/10'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 4 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='行高' placement='bottom'>
          <Select
            value={lineHeightNorm}
            options={lineHeightOptions}
            onChange={(v) => setGlobalLineHeight(v)}
            className='min-w-[76px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='[&_.ant-select-item]:text-white/90 [&_.ant-select-item-option-selected]:!bg-white/15 [&_.ant-select-item-option-active]:!bg-white/10'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 4 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='模块标题样式' placement='bottom'>
          <Select
            virtual={false}
            value={headerTypeVal}
            optionLabelProp='title'
            options={headerTypeOptions}
            onChange={(v) => setGlobalHeaderType(v)}
            popupMatchSelectWidth={false}
            className='min-w-[88px] [&_.ant-select-selector]:!min-h-[30px] [&_.ant-select-selector]:!border-[#555] [&_.ant-select-selector]:!bg-[#2a2a2a] [&_.ant-select-selection-item]:!text-white [&_.ant-select-arrow]:!text-[#aaa]'
            popupClassName='[&_.ant-select-item]:!min-h-[unset] [&_.ant-select-item]:!py-1 [&_.ant-select-item-option-selected]:!bg-white/10 [&_.ant-select-item-option-active]:!bg-white/8'
            styles={{
              popup: {
                root: { backgroundColor: '#323236', padding: 6, minWidth: 268 },
              },
            }}
          />
        </Tooltip>
        <Tooltip title='主题色' placement='bottom'>
          <Popover
            trigger='click'
            placement='bottom'
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
                backgroundColor: '#323236',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #555',
              },
            }}
            content={
              <div className='w-[220px]'>
                <div className='mb-2 text-[11px] text-white/60'>预设</div>
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
                          ? 'border-white ring-2 ring-white/35'
                          : 'border-white/25'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className='mb-1.5 text-[11px] text-white/60'>自定义</div>
                <input
                  type='color'
                  value={pickerInputValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickerDraft(v);
                    debouncedThemeFromPicker.run(v);
                  }}
                  className='h-9 w-full cursor-pointer rounded border border-white/15 bg-transparent p-0'
                />
              </div>
            }
          >
            <button
              type='button'
              aria-label='主题色'
              className='size-[30px] shrink-0 cursor-pointer rounded-md border border-[#555] shadow-inner'
              style={{ backgroundColor: themeColor }}
            />
          </Popover>
        </Tooltip>
        <Tooltip title='背景色' placement='bottom'>
          <Popover
            trigger='click'
            placement='bottom'
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
                backgroundColor: '#323236',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #555',
              },
            }}
            content={
              <div className='w-[220px]'>
                <div className='mb-2 text-[11px] text-white/60'>预设</div>
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
                          ? 'border-white ring-2 ring-white/35'
                          : 'border-white/25'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className='mb-1.5 text-[11px] text-white/60'>自定义</div>
                <input
                  type='color'
                  value={bgPickerInputValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBgPickerDraft(v);
                    debouncedBgFromPicker.run(v);
                  }}
                  className='h-9 w-full cursor-pointer rounded border border-white/15 bg-transparent p-0'
                />
              </div>
            }
          >
            <button
              type='button'
              aria-label='背景色'
              className='size-[30px] shrink-0 cursor-pointer rounded-md border border-[#555] shadow-inner'
              style={{ backgroundColor: pageBgColor }}
            />
          </Popover>
        </Tooltip>
        <ModuleManage />
        <Popover
          open={exportPopOpen}
          onOpenChange={setExportPopOpen}
          placement='bottomRight'
          trigger='click'
          arrow={false}
          styles={{
            root: { zIndex: 1050 },
            body: {
              padding: 8,
              background: '#2e2d31',
              borderRadius: 10,
            },
          }}
          content={
            <div className='flex min-w-[132px] flex-col gap-0.5'>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setExportPopOpen(false);
                  void exportPdf();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                导出 PDF
              </button>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setExportPopOpen(false);
                  void exportPng();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                导出 PNG
              </button>
              <button
                type='button'
                disabled={pdfLoading || pngLoading}
                onClick={() => {
                  setExportPopOpen(false);
                  exportJson();
                }}
                className='cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
              >
                导出 JSON
              </button>
            </div>
          }
        >
          <button
            type='button'
            disabled={pdfLoading || pngLoading}
            aria-expanded={exportPopOpen}
            aria-haspopup='menu'
            className='flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-[13px] font-medium text-white/95 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70'
          >
            {pdfLoading || pngLoading ? (
              <>
                <span
                  className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white'
                  aria-hidden
                />
                <span>导出中…</span>
              </>
            ) : (
              <>
                <span>导出</span>
                <RightOutlined
                  className={`text-[10px] text-white/70 transition-transform duration-200 ${
                    exportPopOpen ? 'rotate-90' : ''
                  }`}
                />
              </>
            )}
          </button>
        </Popover>
      </div>
    </div>
  );
}

export default memo(observer(Header));
