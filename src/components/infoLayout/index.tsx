import { observer } from 'mobx-react';
import { memo, useEffect, useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { WidthProvider } from 'react-grid-layout';
import styles from './index.module.less';
import { info } from '@/modules/utils/constant';
import { AddOne, Delete } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';

const GridLayoutWithWidth = WidthProvider(GridLayout);

function FieldChip(props: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className='box-border flex h-full min-h-[28px] w-full max-w-full min-w-0 items-center gap-1.5 rounded-md border border-white/15 bg-neutral-700/95 px-2 py-1 text-[12px] leading-tight text-white shadow-sm'>
      <span
        className='min-w-0 flex-1 break-words text-center [word-break:break-word]'
        title={props.label}
      >
        {props.label}
      </span>
      <button
        type='button'
        className='inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0.5 text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white'
        aria-label='删除'
        title='删除'
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

/** 12 栅格中单列 ≈38px；每项占 4 列 ≈153px，可完整显示四字中文 + 删除 */
const GRID_COLS = 12;
const FIELD_W = 4;
const ROW_H = 42;
const WIDTH = 460;

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

  const canbeAddItem = useMemoizedFn(() => {
    const items = [];
    for (const key in info) {
      if (
        Object.prototype.hasOwnProperty.call(info, key) &&
        !layout.some((item) => item.i === key) &&
        key !== 'name' &&
        key !== 'avatar'
      ) {
        items.push(
          <div
            role='presentation'
            onClick={() => addItem(key)}
            key={key}
            className='relative flex h-[30px] cursor-pointer items-center rounded-[5px] bg-gray-300 px-[10px] text-[12px] font-bold text-white transition-all duration-300 hover:bg-gray-400'
          >
            <AddOne
              className='mr-[5px]'
              theme='outline'
              size='15'
              fill='#fff'
            />
            {info[key as keyof typeof info]}
          </div>
        );
      }
    }
    return items;
  });

  return (
    <div className={styles.infoLayout}>
      <div className='w-full rounded-lg'>
        <GridLayoutWithWidth
          className='layout'
          layout={layout}
          cols={GRID_COLS}
          rowHeight={ROW_H}
          width={WIDTH}
          margin={[6, 6]}
          isResizable={false}
          compactType={null}
          onDragStop={onDragStop}
        >
          {layout.map((item) => {
            const label = info[item.i as keyof typeof info];
            return (
              <div
                key={item.i}
                className='box-border flex h-full w-full items-stretch px-px'
              >
                <FieldChip
                  label={label}
                  onRemove={() => removeItem(item.i)}
                />
              </div>
            );
          })}
        </GridLayoutWithWidth>
      </div>
      <div className='mt-2 flex w-full flex-wrap gap-2'>{canbeAddItem()}</div>
    </div>
  );
}

export default memo(observer(InfoLayout));
