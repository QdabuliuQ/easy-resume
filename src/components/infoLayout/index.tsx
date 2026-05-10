'use client';
import { Popover } from 'antd';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { memo, useEffect, useMemo, useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { info } from '@/modules/utils/constant';
import { AddOne, Delete } from '@icon-park/react';

function FieldChip(props: {
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <div className='box-border flex min-h-[26px] max-h-[26px] w-full max-w-full min-w-0 cursor-move items-center gap-1 rounded-md border border-white/15 bg-neutral-700/95 px-1 py-0.5 text-[11px] leading-tight text-white shadow-sm'>
      <span
        className='min-w-0 flex-1 break-words text-center [word-break:break-word] text-[10px]'
        title={props.label}
      >
        {props.label}
      </span>
      <button
        type='button'
        className='inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0.5 text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white'
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
        <Delete theme='outline' size='12' fill='currentColor' />
      </button>
    </div>
  );
}

/** 与 FieldChip 同款容器与排版，右侧为添加按钮 */
function AddFieldChip(props: { label: string; onAdd: () => void }) {
  const t = useTranslations('Edit.infoLayout');
  return (
    <div className='box-border flex min-h-[26px] max-h-[26px] w-full max-w-full min-w-0 items-center gap-1 rounded-md border border-white/15 bg-neutral-700/95 px-1 py-0.5 text-[11px] leading-tight text-white shadow-sm'>
      <span
        className='min-w-0 flex-1 break-words text-center [word-break:break-word] text-[10px]'
        title={props.label}
      >
        {props.label}
      </span>
      <button
        type='button'
        className='inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0.5 text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white'
        aria-label={t('addAria')}
        title={t('addTitle')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onAdd();
        }}
      >
        <AddOne theme='outline' size='12' fill='currentColor' />
      </button>
    </div>
  );
}

/** 12 栅格；每项占 2 列 → 一行最多 6 个 */
const GRID_COLS = 12;
const FIELD_W = 2;
const ROW_H = 26;
const WIDTH = 500;

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

function packAfterDrag(groupedRows: Record<number, Array<any>>) {
  const final: Array<any> = [];
  let nextY = 0;
  const rowKeys = Object.keys(groupedRows).sort((a, b) => Number(a) - Number(b));

  rowKeys.forEach((rowIdx) => {
    const items = [...groupedRows[Number(rowIdx)]].sort((a, b) => a.x - b.x);
    let x = 0;
    let y = nextY;

    items.forEach((item) => {
      if (x + FIELD_W > GRID_COLS) {
        x = 0;
        y += 1;
      }
      final.push({
        ...item,
        x,
        y,
        w: FIELD_W,
        h: 1,
      });
      x += FIELD_W;
    });

    nextY = y + 1;
  });

  return final;
}

function InfoLayout(props: {
  layout: Array<Array<string>>;
  onDragStop: (newLayout: Array<any>) => void;
}) {
  const ti = useTranslations('Edit.infoLayout');
  const [layout, setLayout] = useState<Array<any>>([]);

  useEffect(() => {
    setLayout(rowsToLayout(props.layout));
  }, [props.layout]);

  const onDragStop = (newLayout: Array<any>) => {
    let correctedLayout = [...newLayout];

    const usedRows = new Set<number>();
    correctedLayout.forEach((item) => {
      usedRows.add(item.y);
    });

    const rowMapping: { [key: number]: number } = {};
    let newRowIndex = 0;
    const maxRow =
      usedRows.size > 0 ? Math.max(...Array.from(usedRows)) + 1 : 0;
    for (let i = 0; i < maxRow; i++) {
      if (usedRows.has(i)) {
        rowMapping[i] = newRowIndex++;
      }
    }

    const rowItems: Record<number, Array<any>> = {};
    correctedLayout.forEach((item) => {
      const mappedY = rowMapping[item.y] ?? item.y;
      if (!rowItems[mappedY]) {
        rowItems[mappedY] = [];
      }
      rowItems[mappedY].push({
        ...item,
        y: mappedY,
      });
    });

    const finalLayout = packAfterDrag(rowItems);

    setLayout(finalLayout);
    props.onDragStop(finalLayout);
  };

  const removeItem = (value: any) => {
    const newLayout = layout.filter((item) => item.i !== value);
    onDragStop(newLayout);
  };

  const addItem = (value: any) => {
    if (!layout.length) {
      onDragStop([{ i: value, x: 0, y: 0, w: FIELD_W, h: 1 }]);
      return;
    }
    const maxY = Math.max(...layout.map((l) => l.y));
    const lastRow = layout.filter((l) => l.y === maxY).sort((a, b) => a.x - b.x);
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

  /** Popover 内不要用 WidthProvider：会按气泡整宽测量，栅格错位、出现伪「重复」与横向灰条 */
  const gridChromeClassName =
    'w-[500px] max-w-[min(500px,calc(100vw-48px))] overflow-x-hidden [&_.react-grid-layout]:!min-h-0 [&_.react-grid-item.react-draggable-dragging]:!z-[100] [&_.react-grid-item.react-draggable-dragging]:!rounded-md [&_.react-grid-item.react-draggable-dragging]:!opacity-95 [&_.react-grid-item.react-draggable-dragging]:!shadow-lg [&_.react-grid-item.react-grid-placeholder]:!z-[99] [&_.react-grid-item.react-grid-placeholder]:!min-h-0 [&_.react-grid-item.react-grid-placeholder]:!rounded-lg [&_.react-grid-item.react-grid-placeholder]:!border-2 [&_.react-grid-item.react-grid-placeholder]:!border-dashed [&_.react-grid-item.react-grid-placeholder]:!border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] [&_.react-grid-item.react-grid-placeholder]:!bg-transparent [&_.react-grid-item.react-grid-placeholder]:!opacity-100';

  const layoutPopoverContent = (
    <div className={gridChromeClassName}>
      <div className='w-full rounded-lg'>
        <GridLayout
          className='layout'
          layout={layout}
          cols={GRID_COLS}
          rowHeight={ROW_H}
          width={WIDTH}
          margin={[6, 10]}
          isResizable={false}
          compactType={null}
          useCSSTransforms
          onDragStop={onDragStop}
        >
          {layout.map((item) => {
            const label = info[item.i as keyof typeof info];
            return (
              <div
                key={item.i}
                className='box-border flex h-full w-full cursor-move items-stretch px-px'
              >
                <FieldChip
                  label={label}
                  onRemove={() => removeItem(item.i)}
                />
              </div>
            );
          })}
        </GridLayout>
      </div>
      {addableFieldKeys.length > 0 ? (
        <div className='flex w-full flex-wrap gap-2 border-t border-white/10 pt-[10px] px-[6px]'>
          {addableFieldKeys.map((key) => (
            <div
              key={key}
              className='box-border min-w-0 shrink-0 basis-[calc((100%-2.5rem)/6)]'
            >
              <AddFieldChip
                label={info[key as keyof typeof info]}
                onAdd={() => addItem(key)}
              />
            </div>
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
      overlayInnerStyle={{
        padding: 14,
        width: WIDTH + 28,
        maxWidth: 'min(calc(100vw - 24px), 528px)',
        backgroundColor: '#262626',
        borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      }}
      zIndex={1100}
      content={layoutPopoverContent}
    >
      <button
        type='button'
        className='inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-neutral-700/90 px-3 text-[12px] font-medium text-white outline-none transition-colors hover:border-white/35 hover:bg-neutral-600/90'
      >
        {ti('fieldLayout')}
      </button>
    </Popover>
  );
}

export default memo(observer(InfoLayout));
