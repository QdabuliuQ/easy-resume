'use client';
import type { ReactNode } from 'react';
import { Modal, type ModalFuncProps } from 'antd';
import type { HookAPI } from 'antd/es/modal/useModal';
import { Dialog } from 'antd-mobile';
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
    return new Promise<boolean>((resolve) => {
      Dialog.show({
        title: opts.title,
        content: opts.content,
        closeOnAction: true,
        onClose: () => {
          opts.onCancel?.();
          resolve(false);
        },
        actions: [
          [
            {
              key: 'cancel',
              text: opts.cancelText ?? '取消',
              onClick: async () => {
                await opts.onCancel?.();
                resolve(false);
              },
            },
            {
              key: 'confirm',
              text: opts.okText ?? '确定',
              bold: true,
              danger: !!opts.danger,
              onClick: async () => {
                await opts.onOk?.();
                resolve(true);
              },
            },
          ],
        ],
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
      responsiveConfirm(mobile, opts, mobile ? undefined : modal),
    contextHolder: mobile ? null : contextHolder,
  };
}
