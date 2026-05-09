import { ArrowCircleUp, ArrowCircleDown, Delete, Copy } from '@icon-park/react';
import { Modal, Tooltip } from 'antd';
import { memo } from 'react';

const circleBtn =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 p-0 outline-none shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-[filter,transform,border-color] duration-200 hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 active:brightness-95 [&_svg]:block';

const circleGradient = `${circleBtn} bg-gradient-primary-br`;

const flushWrapClass =
  'mt-3 flex w-full items-center justify-between border-t border-white/[0.08] pt-3';

const flushClusterClass = 'flex items-center gap-2';

const flushBtnClass =
  'inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-2 text-white/78 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[transform,border-color,background-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--color-primary)_36%,white_10%)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,rgba(255,255,255,0.03))] hover:text-white hover:shadow-[0_10px_18px_rgba(0,0,0,0.14)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:block';

const flushDeleteBtnClass =
  'inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-[rgba(249,114,77,0.2)] bg-[linear-gradient(180deg,rgba(249,114,77,0.12),rgba(249,114,77,0.06))] px-2 text-[rgb(255,235,228)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[transform,border-color,background-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[rgba(249,114,77,0.4)] hover:bg-[linear-gradient(180deg,rgba(249,114,77,0.18),rgba(249,114,77,0.10))] hover:text-white hover:shadow-[0_10px_18px_rgba(249,114,77,0.14)] active:translate-y-0 [&_svg]:block';

function ButtonGroup(props: {
  showUp: boolean;
  showDown: boolean;
  handleUp: () => void;
  handleDown: () => void;
  handleDelete: () => void;
  handleCopy: () => void;
  copyDisabled?: boolean;
  flush?: boolean;
}) {
  if (props.flush) {
    return (
      <div className={flushWrapClass}>
        <div className={flushClusterClass}>
          {props.showUp && (
            <Tooltip placement='top' title='上移'>
              <button
                type='button'
                className={flushBtnClass}
                onClick={props.handleUp}
                aria-label='上移'
              >
                <ArrowCircleUp theme='outline' size='15' fill='currentColor' />
              </button>
            </Tooltip>
          )}
          {props.showDown && (
            <Tooltip placement='top' title='下移'>
              <button
                type='button'
                className={flushBtnClass}
                onClick={props.handleDown}
                aria-label='下移'
              >
                <ArrowCircleDown theme='outline' size='15' fill='currentColor' />
              </button>
            </Tooltip>
          )}
          <Tooltip
            placement='top'
            title={props.copyDisabled ? '已达条目上限，无法复制' : '复制'}
          >
            <button
              type='button'
              disabled={props.copyDisabled}
              className={flushBtnClass}
              onClick={props.handleCopy}
              aria-label='复制'
            >
              <Copy theme='outline' size='15' fill='currentColor' />
            </button>
          </Tooltip>
        </div>
        <Tooltip placement='top' title='删除'>
          <button
            type='button'
            className={flushDeleteBtnClass}
            aria-label='删除'
            onClick={() => {
              Modal.confirm({
                title: '删除',
                content: '确定删除吗？',
                okText: '确定',
                cancelText: '取消',
                okButtonProps: { danger: true },
                centered: true,
                onOk: props.handleDelete,
              });
            }}
          >
            <Delete theme='outline' size='15' fill='currentColor' />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className='mt-3 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2'>
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
              />
            </button>
          </Tooltip>
        )}
        <Tooltip
          placement='top'
          title={
            props.copyDisabled ? '已达条目上限，无法复制' : '复制'
          }
        >
          <button
            type='button'
            disabled={props.copyDisabled}
            className={`${circleBtn} bg-[#52c41a] text-white disabled:cursor-not-allowed disabled:opacity-45`}
            onClick={props.handleCopy}
            aria-label='复制'
          >
            <Copy
              theme='outline'
              size='15'
              fill='#fff'
              
            />
          </button>
        </Tooltip>
      </div>
      <Tooltip placement='top' title='删除'>
        <button
          type='button'
          className={`${circleBtn} bg-[#ff4d4f] text-white`}
          aria-label='删除'
          onClick={() => {
            Modal.confirm({
              title: '删除',
              content: '确定删除吗？',
              okText: '确定',
              cancelText: '取消',
              okButtonProps: { danger: true },
              centered: true,
              onOk: props.handleDelete,
            });
          }}
        >
          <Delete
            theme='outline'
            size='15'
            fill='#fff'
            
          />
        </button>
      </Tooltip>
    </div>
  );
}

export default memo(ButtonGroup);
