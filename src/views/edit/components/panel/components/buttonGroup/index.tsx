'use client';
import { ArrowCircleUp, ArrowCircleDown, Delete, Copy } from '@icon-park/react';
import { Modal, Tooltip } from 'antd';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

const circleBtn =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/10 p-0 outline-none shadow-[var(--panel-shadow-icon-btn)] transition-[filter,transform,border-color] duration-200 hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 active:brightness-95 [&_svg]:block';

const circleGradient = `${circleBtn} bg-gradient-primary-br`;

const flushWrapClass =
  'mt-3 flex w-full items-center justify-between border-t border-fg/[0.08] pt-3';

const flushClusterClass = 'flex items-center gap-2';

const flushBtnClass =
  'inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06),rgb(var(--panel-surface-rgb)/0.025))] px-2 text-fg/78 outline-none shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04)] transition-[transform,border-color,background-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--color-primary)_36%,rgb(var(--panel-surface-rgb)/0.12))] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,rgb(var(--panel-surface-rgb)/0.03))] hover:text-[var(--color-primary)] hover:shadow-[var(--panel-shadow-hover-btn)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:block';

const flushDeleteBtnClass =
  'inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-[color:color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_12%,transparent),color-mix(in_srgb,var(--color-primary)_6%,transparent))] px-2 text-[color:color-mix(in_srgb,var(--color-primary)_30%,white)] outline-none shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04)] transition-[transform,border-color,background-color,color,box-shadow] duration-200 hover:-translate-y-px hover:border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-primary)_10%,transparent))] hover:text-[#f87171] hover:shadow-[var(--panel-shadow-primary-glow)] active:translate-y-0 [&_svg]:block';

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
  const tb = useTranslations('Edit.buttonGroup');
  if (props.flush) {
    return (
      <div className={flushWrapClass}>
        <div className={flushClusterClass}>
          {props.showUp && (
            <Tooltip placement='top' title={tb('moveUp')}>
              <button
                type='button'
                className={flushBtnClass}
                onClick={props.handleUp}
                aria-label={tb('moveUp')}
              >
                <ArrowCircleUp theme='outline' size='15' fill='currentColor' />
              </button>
            </Tooltip>
          )}
          {props.showDown && (
            <Tooltip placement='top' title={tb('moveDown')}>
              <button
                type='button'
                className={flushBtnClass}
                onClick={props.handleDown}
                aria-label={tb('moveDown')}
              >
                <ArrowCircleDown theme='outline' size='15' fill='currentColor' />
              </button>
            </Tooltip>
          )}
          <Tooltip
            placement='top'
            title={props.copyDisabled ? tb('copyDisabled') : tb('copy')}
          >
            <button
              type='button'
              disabled={props.copyDisabled}
              className={flushBtnClass}
              onClick={props.handleCopy}
              aria-label={tb('copy')}
            >
              <Copy theme='outline' size='15' fill='currentColor' />
            </button>
          </Tooltip>
        </div>
        <Tooltip placement='top' title={tb('delete')}>
          <button
            type='button'
            className={flushDeleteBtnClass}
            aria-label={tb('delete')}
            onClick={() => {
              Modal.confirm({
                title: tb('confirmDeleteTitle'),
                content: tb('confirmDeleteContent'),
                okText: tb('ok'),
                cancelText: tb('cancel'),
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
    <div className='mt-3 flex w-full items-center justify-between rounded-xl border border-fg/[0.06] bg-[var(--panel-inset-bg)] px-3 py-2'>
      <div className='flex items-center gap-[10px]'>
        {props.showUp && (
          <Tooltip placement='top' title={tb('moveUp')}>
            <button
              type='button'
              className={`${circleGradient} text-[var(--panel-icon-on-accent)] hover:text-[var(--color-primary)]`}
              onClick={props.handleUp}
              aria-label={tb('moveUp')}
            >
              <ArrowCircleUp
                theme='outline'
                size='15'
                fill='currentColor'
              />
            </button>
          </Tooltip>
        )}
        {props.showDown && (
          <Tooltip placement='top' title={tb('moveDown')}>
            <button
              type='button'
              className={`${circleGradient} text-[var(--panel-icon-on-accent)] hover:text-[var(--color-primary)]`}
              onClick={props.handleDown}
              aria-label={tb('moveDown')}
            >
              <ArrowCircleDown
                theme='outline'
                size='15'
                fill='currentColor'
              />
            </button>
          </Tooltip>
        )}
        <Tooltip
          placement='top'
          title={
            props.copyDisabled ? tb('copyDisabled') : tb('copy')
          }
        >
          <button
            type='button'
            disabled={props.copyDisabled}
            className={`${circleBtn} bg-[var(--panel-btn-success-bg)] text-[var(--panel-icon-on-accent)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-45`}
            onClick={props.handleCopy}
            aria-label={tb('copy')}
          >
            <Copy
              theme='outline'
              size='15'
              fill='currentColor'
            />
          </button>
        </Tooltip>
      </div>
      <Tooltip placement='top' title={tb('delete')}>
        <button
          type='button'
          className={`${circleBtn} bg-[var(--panel-btn-danger-bg)] text-[var(--panel-icon-on-accent)] hover:text-[#f87171]`}
          aria-label={tb('delete')}
          onClick={() => {
            Modal.confirm({
              title: tb('confirmDeleteTitle'),
              content: tb('confirmDeleteContent'),
              okText: tb('ok'),
              cancelText: tb('cancel'),
              okButtonProps: { danger: true },
              centered: true,
              onOk: props.handleDelete,
            });
          }}
        >
          <Delete
            theme='outline'
            size='15'
            fill='currentColor'
          />
        </button>
      </Tooltip>
    </div>
  );
}

export default memo(ButtonGroup);
