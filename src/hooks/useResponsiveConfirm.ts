'use client';
import type { ReactNode } from 'react';
import { Modal, type ModalFuncProps } from 'antd';
import type { HookAPI } from 'antd/es/modal/useModal';
import { useMobileEdit } from '@/views/edit/mobile/context';

export type ResponsiveConfirmOptions = {
  title?: ReactNode;
  content?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  danger?: boolean;
  centered?: boolean;
  zIndex?: number;
  icon?: ReactNode | null;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
};

function toAntd(opts: ResponsiveConfirmOptions): ModalFuncProps {
  return {
    title: opts.title,
    content: opts.content,
    okText: opts.okText,
    cancelText: opts.cancelText,
    icon: opts.icon,
    okButtonProps: opts.danger ? { danger: true } : undefined,
    centered: opts.centered ?? true,
    zIndex: opts.zIndex,
    onOk: opts.onOk,
    onCancel: opts.onCancel,
  };
}

export function responsiveConfirm(
  mobile: boolean,
  opts: ResponsiveConfirmOptions,
  modal?: HookAPI
) {
  if (mobile) {
    const api = modal ?? Modal;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      api.confirm({
        ...toAntd(opts),
        icon: opts.icon ?? null,
        centered: opts.centered ?? true,
        onOk: async () => {
          await opts.onOk?.();
          finish(true);
        },
        onCancel: async () => {
          await opts.onCancel?.();
          finish(false);
        },
      });
    });
  }
  if (modal) return modal.confirm(toAntd(opts));
  return Modal.confirm(toAntd(opts));
}

export function useResponsiveConfirm() {
  const mobile = useMobileEdit();
  const [modal, contextHolder] = Modal.useModal();
  return {
    mobile,
    modal,
    confirm: (opts: ResponsiveConfirmOptions) =>
      responsiveConfirm(mobile, opts, modal),
    contextHolder,
  };
}
