import { ArrowCircleUp, ArrowCircleDown, Delete, Copy } from '@icon-park/react';
import { Popconfirm, Tooltip } from 'antd';
import { memo } from 'react';

const circleBtn =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 p-0 outline-none transition-[filter] duration-200 hover:brightness-110 active:brightness-95 [&_svg]:block';

const circleGradient = `${circleBtn} bg-gradient-to-br from-[#FCEA88] to-[#E46642]`;

function ButtonGroup(props: {
  showUp: boolean;
  showDown: boolean;
  handleUp: () => void;
  handleDown: () => void;
  handleDelete: () => void;
  handleCopy: () => void;
}) {
  return (
    <div className='flex w-full items-center justify-between'>
      <div className='flex items-center gap-[10px]'>
        {props.showUp && (
          <Tooltip placement='top' title='上移'>
            <button
              type='button'
              className={circleGradient}
              onClick={props.handleUp}
              aria-label='上移'
            >
              <ArrowCircleUp
                theme='outline'
                size='15'
                fill='#fff'
                className='relative right-[1px]'
              />
            </button>
          </Tooltip>
        )}
        {props.showDown && (
          <Tooltip placement='top' title='下移'>
            <button
              type='button'
              className={circleGradient}
              onClick={props.handleDown}
              aria-label='下移'
            >
              <ArrowCircleDown
                theme='outline'
                size='15'
                fill='#fff'
                className='relative right-[1px]'
              />
            </button>
          </Tooltip>
        )}
        <Tooltip placement='top' title='复制'>
          <button
            type='button'
            className={`${circleBtn} bg-[#52c41a] text-white`}
            onClick={props.handleCopy}
            aria-label='复制'
          >
            <Copy
              theme='outline'
              size='15'
              fill='#fff'
              className='relative right-[1px]'
            />
          </button>
        </Tooltip>
      </div>
      <Popconfirm
        placement='top'
        title='删除'
        description='确定删除吗？'
        okText='确定'
        cancelText='取消'
        onConfirm={props.handleDelete}
        overlayStyle={{ width: '200px' }}
      >
        <button
          type='button'
          className={`${circleBtn} bg-[#ff4d4f] text-white`}
          aria-label='删除'
        >
          <Delete
            theme='outline'
            size='15'
            fill='#fff'
            className='relative right-[1px]'
          />
        </button>
      </Popconfirm>
    </div>
  );
}

export default memo(ButtonGroup);
