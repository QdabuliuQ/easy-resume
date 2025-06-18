import { observer } from 'mobx-react';
import { memo, useEffect, useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { WidthProvider } from 'react-grid-layout';
import styles from './index.module.less';
import { info } from '@/modules/utils/constant';
import { DeleteThree } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
const GridLayoutWithWidth = WidthProvider(GridLayout);

function InfoLayout(props: { layout: Array<Array<string>> }) {
  const [layout, setLayout] = useState<Array<any>>([]);

  useEffect(() => {
    const layout: Array<any> = [];
    for (let i = 0; i < props.layout.length; i++) {
      const row = props.layout[i];
      for (let j = 0; j < row.length; j++) {
        const item = row[j];
        layout.push({
          i: item,
          x: j,
          y: i,
          w: 1,
          h: 1,
        });
      }
    }
    setLayout(layout);
  }, [props.layout]);

  const onDragStop = (newLayout: Array<any>) => {
    let correctedLayout = [...newLayout];

    // 计算已使用的行
    const usedRows = new Set<number>();
    correctedLayout.forEach((item) => {
      usedRows.add(item.y);
    });

    // 创建行映射（处理空行）
    const rowMapping: { [key: number]: number } = {};
    let newRowIndex = 0;
    const maxRow = Math.max(...Array.from(usedRows)) + 1;
    for (let i = 0; i < maxRow; i++) {
      if (usedRows.has(i)) {
        rowMapping[i] = newRowIndex++;
      }
    }

    // 按行分组
    const rowItems: { [key: number]: Array<any> } = {};
    correctedLayout.forEach((item) => {
      const newY = rowMapping[item.y] ?? item.y;
      if (!rowItems[newY]) {
        rowItems[newY] = [];
      }
      rowItems[newY].push({
        ...item,
        y: newY,
      });
    });

    // 处理每一行，确保列连续
    const finalLayout: Array<any> = [];
    Object.keys(rowItems).forEach((rowIndex) => {
      const items = rowItems[Number(rowIndex)];

      // 按x坐标排序
      items.sort((a, b) => a.x - b.x);

      // 重新分配x坐标，确保连续
      items.forEach((item, index) => {
        finalLayout.push({
          ...item,
          x: index,
          y: Number(rowIndex),
        });
      });
    });

    setLayout(finalLayout);
  };

  const removeItem = (value: any) => {
    const newLayout = layout.filter((item) => item.i !== value);
    onDragStop(newLayout);
  };

  const addItem = (value: any) => {
    const newLayout = [
      ...layout,
      { i: value, x: 0, y: layout.length, w: 1, h: 1 },
    ];
    onDragStop(newLayout);
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
            onClick={() => addItem(key)}
            key={key}
            className='w-[65px] h-[30px] bg-blue-500 flex items-center justify-center rounded-lg text-white text-[12px] font-bold relative cursor-pointer'
          >
            {info[key as keyof typeof info]}
          </div>
        );
      }
    }
    return items;
  });

  return (
    <div className={styles.infoLayout}>
      <div className='w-full bg-gray-100 rounded-lg'>
        <GridLayoutWithWidth
          className='layout'
          layout={layout}
          cols={6}
          rowHeight={30}
          width={460}
          isResizable={false}
          compactType={null}
          onDragStop={onDragStop}
        >
          {layout.map((item) => (
            <div
              key={item.i}
              className='bg-gray-300 flex items-center justify-center rounded-lg text-white text-[12px] font-bold relative cursor-move'
            >
              {info[item.i as keyof typeof info]}
              <DeleteThree
                className='absolute top-[-5px] right-[-5px] cursor-pointer'
                theme='filled'
                size='16'
                fill='red'
                onClick={() => removeItem(item.i)}
              />
            </div>
          ))}
        </GridLayoutWithWidth>
      </div>
      <div className='flex gap-2 w-full mt-2 flex-wrap'>{canbeAddItem()}</div>
    </div>
  );
}

export default memo(observer(InfoLayout));
