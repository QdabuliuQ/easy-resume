import { observer } from 'mobx-react';
import { memo, useEffect, useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { WidthProvider } from 'react-grid-layout';
import styles from './index.module.less';
import { info } from '@/modules/utils/constant';
import { DeleteThree } from '@icon-park/react';
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
    const maxRow =
      usedRows.size > 0 ? Math.max(...Array.from(usedRows).map(Number)) + 1 : 0;
    for (let i = 0; i < maxRow; i++) {
      if (usedRows.has(i)) {
        rowMapping[i] = newRowIndex++;
      }
    }

    // 应用行映射，移动元素填补空行
    correctedLayout = correctedLayout.map((item) => {
      return {
        ...item,
        y: rowMapping[item.y] !== undefined ? rowMapping[item.y] : item.y,
      };
    });

    // 按行处理列，确保每一行内的列是连续的
    const rowItems: { [key: number]: Array<any> } = {};

    // 按行分组
    correctedLayout.forEach((item) => {
      if (!rowItems[item.y]) {
        rowItems[item.y] = [];
      }
      rowItems[item.y].push(item);
    });

    // 处理每一行的列
    const finalLayout: Array<any> = [];
    Object.keys(rowItems).forEach((rowIndex) => {
      const items = rowItems[Number(rowIndex)];

      // 按x坐标排序
      items.sort((a, b) => a.x - b.x);

      // 重新分配x坐标，确保连续
      for (let i = 0; i < items.length; i++) {
        finalLayout.push({
          ...items[i],
          x: i, // 重新分配x坐标为0, 1, 2...
        });
      }
    });

    setLayout(finalLayout);
  };

  return (
    <div className={`w-full bg-gray-100 rounded-lg ${styles.infoLayout}`}>
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
            />
          </div>
        ))}
      </GridLayoutWithWidth>
    </div>
  );
}

export default memo(observer(InfoLayout));
