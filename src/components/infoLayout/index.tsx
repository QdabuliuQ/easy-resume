'use client';
import { Modal } from 'antd';
import {
  Add,
  AutoHeightOne,
  BirthdayCake,
  BoyTwo,
  Briefcase,
  BuildingTwo,
  City,
  Delete,
  Family,
  Finance,
  IdCardV,
  LocalTwo,
  Mail,
  Male,
  PhoneCall,
  WebPage,
  Wechat,
  Weight,
  Workbench,
} from '@icon-park/react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { memo, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react';
import { info } from '@/modules/utils/constant';

const CHIP_ICON_FILL = 'var(--info-layout-chip-icon)';
const MAX_COLS = 4;
const SKIP_KEYS = new Set(['name', 'avatar']);

const INFO_FIELD_ICONS: Record<
  string,
  ComponentType<{
    theme?: 'outline';
    size?: number;
    fill?: string;
    className?: string;
  }>
> = {
  phone: PhoneCall,
  email: Mail,
  city: City,
  status: Workbench,
  intentCity: BuildingTwo,
  intentPosts: Briefcase,
  wechat: Wechat,
  birthday: BirthdayCake,
  gender: Male,
  stature: AutoHeightOne,
  weight: Weight,
  ethnic: BoyTwo,
  origin: LocalTwo,
  maritalStatus: Family,
  politicalStatus: IdCardV,
  site: WebPage,
  expectedSalary: Finance,
};

function FieldIcon({ fieldKey }: { fieldKey: string }) {
  const Icon = INFO_FIELD_ICONS[fieldKey];
  if (!Icon) return null;
  return (
    <Icon theme='outline' size={14} fill={CHIP_ICON_FILL} className='shrink-0' />
  );
}

export function sanitizeLayoutRows(rows: Array<Array<string>>): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const row of rows) {
    const next: string[] = [];
    for (const key of row) {
      if (!key || SKIP_KEYS.has(key) || seen.has(key)) continue;
      seen.add(key);
      next.push(key);
      if (next.length === MAX_COLS) {
        out.push(next.splice(0, MAX_COLS));
      }
    }
    if (next.length) out.push(next);
  }
  return out;
}

function findRowIndex(rows: string[][], key: string) {
  return rows.findIndex((row) => row.includes(key));
}

export function moveField(
  rows: string[][],
  activeId: string,
  overId: string,
): string[][] {
  const fromRow = findRowIndex(rows, activeId);
  if (fromRow < 0) return rows;
  const fromIndex = rows[fromRow].indexOf(activeId);

  if (overId === 'row-new') {
    const next = rows.map((r) => [...r]);
    next[fromRow].splice(fromIndex, 1);
    next.push([activeId]);
    return sanitizeLayoutRows(next);
  }

  const slotMatch = /^slot-(\d+)-(\d+)$/.exec(overId);
  const isRowTarget = overId.startsWith('row-');
  let toRow: number;
  let preferIndex: number | null = null;

  if (slotMatch) {
    toRow = Number(slotMatch[1]);
    preferIndex = Number(slotMatch[2]);
  } else if (isRowTarget) {
    toRow = Number(overId.slice(4));
    preferIndex = null;
  } else {
    toRow = findRowIndex(rows, overId);
    preferIndex = toRow >= 0 ? rows[toRow].indexOf(overId) : -1;
  }

  if (Number.isNaN(toRow) || toRow < 0 || toRow >= rows.length) return rows;
  if (!slotMatch && !isRowTarget && overId === activeId) return rows;

  if (fromRow === toRow && !slotMatch && !isRowTarget) {
    const toIndex = preferIndex ?? -1;
    if (toIndex < 0 || toIndex === fromIndex) return rows;
    const next = rows.map((r) => [...r]);
    next[fromRow] = arrayMove(next[fromRow], fromIndex, toIndex);
    return sanitizeLayoutRows(next);
  }

  const next = rows.map((r) => [...r]);
  next[fromRow].splice(fromIndex, 1);

  let destRow = toRow;
  if (next[fromRow].length === 0 && toRow > fromRow) destRow = toRow - 1;
  if (destRow < 0 || destRow >= next.length) {
    return sanitizeLayoutRows([...next, [activeId]]);
  }

  let insertAt: number;
  if (slotMatch) {
    insertAt = Math.min(preferIndex ?? next[destRow].length, next[destRow].length);
  } else if (isRowTarget) {
    insertAt = next[destRow].length;
  } else {
    insertAt = next[destRow].indexOf(overId);
    if (insertAt < 0) insertAt = next[destRow].length;
  }
  next[destRow].splice(insertAt, 0, activeId);
  return sanitizeLayoutRows(next);
}

function appendField(rows: string[][], key: string): string[][] {
  if (rows.some((r) => r.includes(key))) return rows;
  if (!rows.length) return [[key]];
  const last = rows[rows.length - 1];
  if (last.length < MAX_COLS) {
    return sanitizeLayoutRows([
      ...rows.slice(0, -1),
      [...last, key],
    ]);
  }
  return sanitizeLayoutRows([...rows, [key]]);
}

function removeField(rows: string[][], key: string): string[][] {
  return sanitizeLayoutRows(rows.map((r) => r.filter((k) => k !== key)));
}

function FieldChip(props: {
  fieldKey: string;
  label: string;
  onRemove: () => void;
  dragHandleProps?: Record<string, unknown>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  dragging?: boolean;
}) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <div
      ref={props.setNodeRef}
      style={props.style}
      className={`info-layout-chip info-layout-chip-field box-border flex min-h-[36px] w-full min-w-0 cursor-grab items-center gap-1 rounded-lg border px-2 py-1.5 text-[12px] leading-none active:cursor-grabbing ${props.dragging ? 'opacity-90 shadow-[0_6px_16px_rgb(0_0_0/0.18)]' : ''}`}
      {...props.dragHandleProps}
    >
      <FieldIcon fieldKey={props.fieldKey} />
      <span
        className='min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px]'
        title={props.label}
      >
        {props.label}
      </span>
      <button
        type='button'
        className='info-layout-chip-btn info-layout-chip-btn-delete inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 outline-none transition-colors'
        aria-label={t('deleteAria')}
        title={t('deleteTitle')}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onRemove();
        }}
      >
        <Delete theme='outline' size='14' fill='currentColor' />
      </button>
    </div>
  );
}

function SortableFieldChip(props: {
  fieldKey: string;
  label: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.fieldKey });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 2 : undefined,
    touchAction: 'none',
  };
  return (
    <FieldChip
      fieldKey={props.fieldKey}
      label={props.label}
      onRemove={props.onRemove}
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

function EmptySlot({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[36px] rounded-lg border border-dashed transition-colors ${isOver ? 'border-[color:var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] opacity-100' : 'border-[color:var(--info-layout-chip-border)] opacity-40'}`}
    />
  );
}

function LayoutRow(props: {
  rowIndex: number;
  keys: string[];
  onRemove: (key: string) => void;
}) {
  const rowId = `row-${props.rowIndex}`;
  const { setNodeRef, isOver } = useDroppable({ id: rowId });
  const emptyCount = Math.max(0, MAX_COLS - props.keys.length);
  return (
    <div
      ref={setNodeRef}
      className={`grid min-h-[44px] grid-cols-4 gap-2 rounded-lg p-2 transition-colors ${isOver ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]' : 'bg-[var(--info-layout-grid-bg)]'}`}
    >
      <SortableContext items={props.keys} strategy={horizontalListSortingStrategy}>
        {props.keys.map((key) => (
          <SortableFieldChip
            key={key}
            fieldKey={key}
            label={info[key as keyof typeof info] ?? key}
            onRemove={() => props.onRemove(key)}
          />
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <EmptySlot
            key={`slot-${props.rowIndex}-${props.keys.length + i}`}
            id={`slot-${props.rowIndex}-${props.keys.length + i}`}
          />
        ))}
      </SortableContext>
    </div>
  );
}

function NewRowDropZone() {
  const ti = useTranslations('Edit.infoLayout');
  const { setNodeRef, isOver } = useDroppable({ id: 'row-new' });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[40px] items-center justify-center rounded-lg border border-dashed px-3 text-[12px] transition-colors ${isOver ? 'border-[color:var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[color:var(--color-primary)]' : 'border-[color:var(--info-layout-chip-border)] text-fg/40'}`}
    >
      {ti('newRowHint')}
    </div>
  );
}

function AddFieldChip(props: {
  fieldKey: string;
  label: string;
  onAdd: () => void;
}) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <button
      type='button'
      className='info-layout-chip info-layout-chip-add box-border flex min-h-[36px] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] leading-none outline-none transition-colors'
      title={t('addTitle')}
      aria-label={t('addAria')}
      onClick={(e) => {
        e.preventDefault();
        props.onAdd();
      }}
    >
      <FieldIcon fieldKey={props.fieldKey} />
      <span
        className='min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[12px]'
        title={props.label}
      >
        {props.label}
      </span>
      <Add theme='outline' size='14' fill='currentColor' />
    </button>
  );
}

function InfoLayout(props: {
  layout: Array<Array<string>>;
  onChange: (layout: string[][]) => void;
}) {
  const ti = useTranslations('Edit.infoLayout');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<string[][]>(() =>
    sanitizeLayoutRows(props.layout),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setRows(sanitizeLayoutRows(props.layout));
  }, [props.layout, open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const commit = (next: string[][]) => {
    const packed = sanitizeLayoutRows(next);
    setRows(packed);
    props.onChange(packed);
  };

  const addableFieldKeys = useMemo(() => {
    const used = new Set(rows.flat());
    return Object.keys(info).filter(
      (key) => !SKIP_KEYS.has(key) && !used.has(key),
    );
  }, [rows]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    commit(moveField(rows, String(active.id), String(over.id)));
  };

  const activeLabel = activeId
    ? info[activeId as keyof typeof info] ?? activeId
    : '';

  return (
    <>
      <button
        type='button'
        className='info-layout-trigger mb-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-medium outline-none transition-[background-color,border-color,color]'
        onClick={() => setOpen(true)}
      >
        {ti('fieldLayout')}
      </button>
      <Modal
        open={open}
        title={ti('fieldLayout')}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={560}
      >
        <p className='mb-3 text-[12px] leading-relaxed text-fg/55'>
          {ti('dragHint')}
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className='flex flex-col gap-2'>
            {rows.map((keys, idx) => (
              <LayoutRow
                key={`row-${idx}`}
                rowIndex={idx}
                keys={keys}
                onRemove={(key) => commit(removeField(rows, key))}
              />
            ))}
            {!rows.length ? (
              <div className='rounded-lg bg-[var(--info-layout-grid-bg)] px-3 py-6 text-center text-[12px] text-fg/45'>
                {ti('emptyHint')}
              </div>
            ) : (
              <NewRowDropZone />
            )}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <FieldChip
                fieldKey={activeId}
                label={activeLabel}
                onRemove={() => undefined}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        {addableFieldKeys.length > 0 ? (
          <div className='info-layout-chip-divider mt-3 grid grid-cols-4 gap-2 border-t pt-3'>
            {addableFieldKeys.map((key) => (
              <AddFieldChip
                key={key}
                fieldKey={key}
                label={info[key as keyof typeof info]}
                onAdd={() => commit(appendField(rows, key))}
              />
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

export default memo(observer(InfoLayout));
