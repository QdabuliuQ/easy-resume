'use client';
import { useDebounceFn } from 'ahooks';
import { memo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Input, message, Popover, Select, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume';
import resume from '@/json/resume';
import ModuleManage from './moduleManage';

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
  const [pickerDraft, setPickerDraft] = useState(defaultResume.globalStyle.color);
  const pickerDraftRef = useRef(pickerDraft);
  pickerDraftRef.current = pickerDraft;
  const [bgPickerDraft, setBgPickerDraft] = useState(
    defaultResume.globalStyle.backgroundColor,
  );
  const bgPickerDraftRef = useRef(bgPickerDraft);
  bgPickerDraftRef.current = bgPickerDraft;
  const ignoreNextBlur = useRef(false);

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

  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading) return;
    setPdfLoading(true);
    try {
      const base = (name || '简历').trim() || '简历';
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: configStore.getConfig ?? defaultResume,
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
              className='size-[30px] shrink-0 rounded-md border border-[#555] shadow-inner'
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
              className='size-[30px] shrink-0 rounded-md border border-[#555] shadow-inner'
              style={{ backgroundColor: pageBgColor }}
            />
          </Popover>
        </Tooltip>
        <ModuleManage />
        <button
          type='button'
          disabled={pdfLoading}
          onClick={() => void exportPdf()}
          className='bg-gradient-primary inline-flex h-[30px] min-w-[100px] cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-[20px] text-[13px] font-bold text-[#333] shadow-none hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 text-white'
        >
          {pdfLoading ? (
            <>
              <span
                className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white'
                aria-hidden
              />
              <span>导出中…</span>
            </>
          ) : (
            '导出 PDF'
          )}
        </button>
        <div className='bg-gradient-primary flex h-[30px] cursor-pointer items-center justify-center rounded-full px-[20px] text-[13px] font-bold transition-[filter] duration-200 hover:brightness-110'>
          导出JSON
        </div>
      </div>
    </div>
  );
}

export default memo(observer(Header));
