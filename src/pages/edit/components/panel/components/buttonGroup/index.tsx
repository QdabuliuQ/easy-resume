import { ArrowCircleUp, ArrowCircleDown, Delete, Copy } from '@icon-park/react';
import { Button, Popconfirm, Tooltip } from 'antd';
import { memo } from 'react';

function ButtonGroup(props: {
  showUp: boolean;
  showDown: boolean;
  handleUp: () => void;
  handleDown: () => void;
  handleDelete: () => void;
  handleCopy: () => void;
}) {
  return (
    <div className='w-full flex items-center justify-between'>
      <div className='flex items-center gap-[10px]'>
        {props.showUp && (
          <Tooltip placement='top' title='上移'>
            <Button
              color='primary'
              variant='solid'
              icon={<ArrowCircleUp theme='outline' size='15' fill='#fff' />}
              shape='circle'
              onClick={props.handleUp}
            ></Button>
          </Tooltip>
        )}
        {props.showDown && (
          <Tooltip placement='top' title='下移'>
            <Button
              color='primary'
              variant='solid'
              icon={<ArrowCircleDown theme='outline' size='15' fill='#fff' />}
              shape='circle'
              onClick={props.handleDown}
            ></Button>
          </Tooltip>
        )}
        <Tooltip placement='top' title='复制'>
          <Button
            color='cyan'
            variant='solid'
            icon={<Copy theme='outline' size='15' fill='#fff' />}
            shape='circle'
            onClick={props.handleCopy}
          ></Button>
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
        <Button
          color='danger'
          variant='solid'
          icon={<Delete theme='outline' size='15' fill='#fff' />}
          shape='circle'
        ></Button>
      </Popconfirm>
    </div>
  );
}

export default memo(ButtonGroup);
