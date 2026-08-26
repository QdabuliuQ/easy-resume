'use client';
import ResponsiveSelect from '@/components/responsiveSelect';
import { ResponsiveDatePicker, ResponsiveRangeDatePicker } from '@/components/responsiveDatePicker';
import RichTextEditor from '@/components/richTextEditor/lazy';
import type { AiPolishStreamContext } from '@/components/richTextEditor/loadRichTextEditor';
import { Cascader, Input } from 'antd';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { observer } from 'mobx-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { configStore } from '@/mobx';
import { flattenModules } from '@/utils/resumePages';
import { resumeRangeEndDateString } from '@/utils/resumeDateDisplay';
import type { ParsedItemTarget } from '@/lib/inlineFieldEdit/parseItemTarget';
import { salaryFocusIndexFromTarget } from '@/lib/inlineFieldEdit/parseItemTarget';
import {
  findModuleLoc,
  readInlineField,
  writeInlineField,
} from '@/lib/inlineFieldEdit/fieldAccess';
import { polishDescription } from '@/api/polishDescription';
import { buildInlinePolishRequest } from '@/lib/inlineFieldEdit/buildInlinePolishRequest';
import type { InlineFieldKind, InlineFieldMeta } from '@/lib/inlineFieldEdit/resolveFieldMeta';
import { useInlineFieldAutoFocus } from '@/components/inlineFieldPopover/useInlineFieldAutoFocus';
import styles from '@/components/inlineFieldPopover/inlineFieldPopover.module.css';

function shellClassName(kind: InlineFieldKind) {
  if (kind === 'richText') return `${styles.shell} ${styles.shellRich}`;
  if (kind === 'salary') return `${styles.shell} ${styles.shellSalary}`;
  return styles.shell;
}

type InlineFieldEditorProps = {
  itemId: string;
  target: ParsedItemTarget;
  meta: InlineFieldMeta;
  width: number;
  onRequestClose: () => void;
};

function InlineFieldEditor({
  itemId,
  target,
  meta,
  width,
  onRequestClose,
}: InlineFieldEditorProps) {
  const moduleType = useMemo(() => {
    const modules = flattenModules(configStore.getConfig);
    return modules.find((m) => m.id === target.moduleId)?.type ?? '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.moduleId, configStore.getConfig]);

  const module = useMemo(() => {
    const loc = findModuleLoc(target.moduleId);
    if (!loc) return null;
    return configStore.getConfig?.pages[loc.page]?.modules[loc.module] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.moduleId, configStore.getConfig]);

  const initial = useMemo(
    () => (module ? readInlineField(module, moduleType, target, meta.kind) : ''),
    [module, moduleType, target, meta.kind],
  );

  const [local, setLocal] = useState(initial);
  useEffect(() => {
    setLocal(initial);
  }, [itemId, initial]);

  const { run: persist } = useDebounceFn(
    (value: unknown) => {
      const loc = findModuleLoc(target.moduleId);
      if (!loc) return;
      writeInlineField(loc, moduleType, target, meta.kind, value);
    },
    { wait: 100 },
  );

  const commit = useMemoizedFn((value: unknown) => {
    setLocal(value);
    persist(value);
  });

  const onAiPolishClick = useMemoizedFn(
    (richTextHtml: string, ctx?: AiPolishStreamContext) => {
      const req = buildInlinePolishRequest(module, moduleType, target, richTextHtml);
      if (!req) return Promise.reject(new Error('unsupported'));
      return polishDescription(req, ctx?.onStreamingHtml, ctx?.signal);
    },
  );

  const salaryFocusIndex = salaryFocusIndexFromTarget(target);
  const shellRef = useInlineFieldAutoFocus(itemId, meta.kind, salaryFocusIndex);
  const shellClass = shellClassName(meta.kind);

  if (meta.kind === 'text') {
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <Input
          maxLength={meta.maxLength ?? 30}
          value={String(local ?? '')}
          onChange={(e) => commit(e.target.value)}
          onPressEnter={onRequestClose}
        />
      </div>
    );
  }

  if (meta.kind === 'salary') {
    const [a, b] = Array.isArray(local) ? local : ['', ''];
    return (
      <div ref={shellRef} className={`${shellClass} flex items-center gap-2`} style={{ width }}>
        <Input
          maxLength={30}
          value={a}
          className={styles.salaryInput}
          onChange={(e) => commit([e.target.value, b])}
        />
        <span className={styles.salarySep}>-</span>
        <Input
          maxLength={30}
          value={b}
          className={styles.salaryInput}
          onChange={(e) => commit([a, e.target.value])}
        />
      </div>
    );
  }

  if (meta.kind === 'select' || meta.kind === 'multiSelect') {
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <ResponsiveSelect
          style={{ width: '100%' }}
          value={local as string | string[]}
          options={meta.options}
          mode={meta.kind === 'multiSelect' ? 'multiple' : undefined}
          onChange={(v) => commit(v)}
        />
      </div>
    );
  }

  if (meta.kind === 'cascaderMulti') {
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <Cascader
          style={{ width: '100%' }}
          options={meta.options}
          multiple
          maxTagCount='responsive'
          showCheckedStrategy={Cascader.SHOW_CHILD}
          value={local as string[][]}
          onChange={(v) => commit(v)}
        />
      </div>
    );
  }

  if (meta.kind === 'cascader') {
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <Cascader
          style={{ width: '100%' }}
          options={meta.options}
          value={local as string[]}
          onChange={(v) => commit(v)}
        />
      </div>
    );
  }

  if (meta.kind === 'date') {
    const raw = String(local ?? '');
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <ResponsiveDatePicker
          style={{ width: '100%' }}
          defaultValue={raw || undefined}
          onChange={(_, ds) => commit(Array.isArray(ds) ? ds.join('/') : ds || '')}
        />
      </div>
    );
  }

  if (meta.kind === 'dateRange') {
    const v = (local ?? {}) as { startDate?: string; endDate?: string };
    return (
      <div ref={shellRef} className={shellClass} style={{ width }}>
        <ResponsiveRangeDatePicker
          style={{ width: '100%' }}
          startDate={v.startDate}
          endDate={v.endDate}
          format='YYYY-MM'
          onChange={(dates, metaRange) => {
            commit({
              startDate: dates?.[0]?.format('YYYY-MM') ?? '',
              endDate: resumeRangeEndDateString(dates?.[1], metaRange.endIsPresent),
            });
          }}
        />
      </div>
    );
  }

  return (
    <div ref={shellRef} className={shellClass} style={{ width }}>
      <RichTextEditor
        instanceKey={`inline-${itemId}`}
        html={String(local ?? '')}
        onHtmlChange={(html) => commit(html)}
        onAiPolishClick={module ? onAiPolishClick : undefined}
      />
    </div>
  );
}

export default memo(observer(InlineFieldEditor));
