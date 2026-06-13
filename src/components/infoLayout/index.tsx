'use client';
import { Popover } from 'antd';
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
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { memo, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { info } from '@/modules/utils/constant';

const CHIP_ICON_FILL = 'var(--info-layout-chip-icon)';

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
    <Icon
      theme='outline'
      size={14}
      fill={CHIP_ICON_FILL}
      className='shrink-0'
    />
  );
}

function FieldChip(props: {
  fieldKey: string;
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <div className='info-layout-chip info-layout-chip-field box-border flex h-full min-h-[32px] w-full max-w-full min-w-0 cursor-move items-center gap-1 rounded-lg border px-2 py-1.5 text-[12px] leading-none'>
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
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
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

function AddFieldChip(props: {
  fieldKey: string;
  label: string;
  onAdd: () => void;
}) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <button
      type='button'
      className='info-layout-chip info-layout-chip-add box-border flex h-full min-h-[32px] w-full max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] leading-none outline-none transition-colors'
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

/** 12 栅格；每项占 3 列 → 一行最多 4 个 */
const GRID_COLS = 12;
const FIELD_W = 3;
const ROW_H = 34;
const ROW_GAP = 12;
/** Popover 内容区宽度（528 - 左右 padding 12×2） */
const WIDTH = 504;

function rowsToLayout(rows: Array<Array<string>>) {
  const next: Array<{ i: string; x: number; y: number; w: number; h: number }> =
    [];
  let baseY = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let xAcc = 0;
    let yLine = baseY;
    for (let j = 0; j < row.length; j++) {
      if (xAcc + FIELD_W > GRID_COLS) {
        xAcc = 0;
        yLine += 1;
      }
      next.push({
        i: row[j],
        x: xAcc,
        y: yLine,
        w: FIELD_W,
        h: 1,
      });
      xAcc += FIELD_W;
    }
    baseY = yLine + 1;
  }
  return next;
}

type GridItem = { i: string; x: number; y: number; w: number; h: number };

function normalizeLayoutItems(items: GridItem[]): GridItem[] {
  if (!items.length) return [];
  const byY = new Map<number, GridItem[]>();
  for (const item of items) {
    const y = Math.max(0, Math.round(item.y));
    const list = byY.get(y) ?? [];
    list.push(item);
    byY.set(y, list);
  }
  const sortedYs = Array.from(byY.keys()).sort((a, b) => a - b);
  const yMap = new Map<number, number>();
  sortedYs.forEach((oldY, idx) => yMap.set(oldY, idx));
  const final: GridItem[] = [];
  for (const oldY of sortedYs) {
    const row = [...(byY.get(oldY) ?? [])].sort((a, b) => a.x - b.x);
    let x = 0;
    let y = yMap.get(oldY)!;
    for (const item of row) {
      if (x + FIELD_W > GRID_COLS) {
        x = 0;
        y += 1;
      }
      final.push({ ...item, x, y, w: FIELD_W, h: 1 });
      x += FIELD_W;
    }
  }
  return final;
}

function gridContentHeightPx(itemCount: number, maxY: number): number {
  if (itemCount === 0) return ROW_H + ROW_GAP;
  return (maxY + 1) * (ROW_H + ROW_GAP) + ROW_GAP;
}

function InfoLayout(props: {
  layout: Array<Array<string>>;
  onDragStop: (newLayout: Array<any>) => void;
}) {
  const ti = useTranslations('Edit.infoLayout');
  const [layout, setLayout] = useState<Array<any>>([]);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(WIDTH);

  useEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;
    const syncWidth = () => {
      const next = Math.floor(el.clientWidth);
      if (next > 0) setGridWidth(next);
    };
    syncWidth();
    const ro = new ResizeObserver(syncWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setLayout(rowsToLayout(props.layout));
  }, [props.layout]);

  const applyLayout = (raw: GridItem[]) => {
    const packed = normalizeLayoutItems(raw);
    setLayout(packed);
    return packed;
  };

  const onDrag = (newLayout: GridItem[]) => {
    setLayout(normalizeLayoutItems(newLayout));
  };

  const onDragStop = (newLayout: GridItem[]) => {
    const finalLayout = applyLayout(newLayout);
    props.onDragStop(finalLayout);
  };

  const removeItem = (value: string) => {
    const newLayout = layout.filter((item) => item.i !== value);
    onDragStop(newLayout);
  };

  const addItem = (value: string) => {
    if (!layout.length) {
      onDragStop([{ i: value, x: 0, y: 0, w: FIELD_W, h: 1 }]);
      return;
    }
    const maxY = Math.max(...layout.map((l) => l.y));
    const lastRow = layout
      .filter((l) => l.y === maxY)
      .sort((a, b) => a.x - b.x);
    const usedWidth = lastRow.reduce((s, l) => s + (l.w || FIELD_W), 0);
    if (usedWidth + FIELD_W <= GRID_COLS) {
      onDragStop([
        ...layout,
        { i: value, x: usedWidth, y: maxY, w: FIELD_W, h: 1 },
      ]);
    } else {
      onDragStop([
        ...layout,
        { i: value, x: 0, y: maxY + 1, w: FIELD_W, h: 1 },
      ]);
    }
  };

  const addableFieldKeys = useMemo(() => {
    const keys: string[] = [];
    for (const key in info) {
      if (
        Object.prototype.hasOwnProperty.call(info, key) &&
        !layout.some((item) => item.i === key) &&
        key !== 'name' &&
        key !== 'avatar'
      ) {
        keys.push(key);
      }
    }
    return keys;
  }, [layout]);

  const gridMaxY = layout.length ? Math.max(...layout.map((l) => l.y)) : 0;
  const gridHeightPx = gridContentHeightPx(layout.length, gridMaxY);

  const gridChromeClassName =
    'w-full max-w-full overflow-x-hidden [&_.react-grid-layout]:!min-h-0 [&_.react-grid-layout]:!overflow-hidden [&_.react-grid-item.react-draggable-dragging]:!z-[100] [&_.react-grid-item.react-draggable-dragging]:!rounded-lg [&_.react-grid-item.react-draggable-dragging]:!opacity-95 [&_.react-grid-item.react-draggable-dragging]:!shadow-[0_6px_16px_rgb(0_0_0/0.18)] [&_.react-grid-item.react-grid-placeholder]:!z-[99] [&_.react-grid-item.react-grid-placeholder]:!h-[34px] [&_.react-grid-item.react-grid-placeholder]:!min-h-0 [&_.react-grid-item.react-grid-placeholder]:!max-h-[34px] [&_.react-grid-item.react-grid-placeholder]:!rounded-lg [&_.react-grid-item.react-grid-placeholder]:!border-2 [&_.react-grid-item.react-grid-placeholder]:!border-dashed [&_.react-grid-item.react-grid-placeholder]:!border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] [&_.react-grid-item.react-grid-placeholder]:!bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] [&_.react-grid-item.react-grid-placeholder]:!opacity-100';

  const layoutPopoverContent = (
    <div className={gridChromeClassName}>
      <div
        ref={gridWrapRef}
        className='w-full overflow-hidden rounded-lg bg-[var(--info-layout-grid-bg)]'
        style={{ height: gridHeightPx }}
      >
        <GridLayout
          className='layout'
          layout={layout}
          cols={GRID_COLS}
          rowHeight={ROW_H}
          width={gridWidth}
          margin={[ROW_GAP, ROW_GAP]}
          isResizable={false}
          compactType={null}
          preventCollision={false}
          useCSSTransforms
          onDrag={onDrag}
          onDragStop={onDragStop}
        >
          {layout.map((item) => {
            const label = info[item.i as keyof typeof info];
            return (
              <div
                key={item.i}
                className='box-border flex h-full w-full cursor-move items-stretch'
              >
                <FieldChip
                  fieldKey={item.i}
                  label={label}
                  onRemove={() => removeItem(item.i)}
                />
              </div>
            );
          })}
        </GridLayout>
      </div>
      {addableFieldKeys.length > 0 ? (
        <div className='info-layout-chip-divider mt-3 grid grid-cols-4 gap-2 border-t py-3 bg-[var(--info-layout-grid-bg)] px-3 rounded-lg'>
          {addableFieldKeys.map((key) => (
            <AddFieldChip
              key={key}
              fieldKey={key}
              label={info[key as keyof typeof info]}
              onAdd={() => addItem(key)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <Popover
      trigger='click'
      mouseEnterDelay={0.15}
      mouseLeaveDelay={0.35}
      placement='bottomLeft'
      styles={{
        body: {
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 12,
          paddingTop: 12,
          width: WIDTH + 24,
          maxWidth: 'min(calc(100vw - 24px), 528px)',
          backgroundColor: 'var(--info-layout-popover-bg)',
          borderRadius: 10,
          boxShadow: 'var(--info-layout-popover-shadow)',
        },
      }}
      zIndex={1100}
      content={layoutPopoverContent}
    >
      <button
        type='button'
        className='info-layout-trigger inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium outline-none transition-[background-color,border-color,color]'
      >
        {ti('fieldLayout')}
      </button>
    </Popover>
  );
}

export default memo(observer(InfoLayout));
