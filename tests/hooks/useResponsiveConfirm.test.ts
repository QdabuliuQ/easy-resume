import { describe, expect, it, vi } from 'vitest';

const { modalConfirm, dialogShow } = vi.hoisted(() => ({
  modalConfirm: vi.fn(),
  dialogShow: vi.fn(),
}));

vi.mock('antd', () => ({
  Modal: {
    confirm: modalConfirm,
  },
}));

vi.mock('antd-mobile', () => ({
  Dialog: {
    show: dialogShow,
  },
}));

import { responsiveConfirm } from '@/hooks/useResponsiveConfirm';

describe('responsiveConfirm', () => {
  it('uses antd modal when desktop and hook modal is absent', () => {
    const onOk = vi.fn();
    responsiveConfirm(false, { title: 'T', content: 'C', danger: true, onOk });

    expect(modalConfirm).toHaveBeenCalledTimes(1);
    const arg = modalConfirm.mock.calls[0][0];
    expect(arg.title).toBe('T');
    expect(arg.content).toBe('C');
    expect(arg.okButtonProps).toEqual({ danger: true });
    expect(typeof arg.onOk).toBe('function');
  });

  it('uses provided hook modal on desktop', () => {
    const hookConfirm = vi.fn();
    const hookModal = { confirm: hookConfirm } as any;

    responsiveConfirm(false, { title: 'Hook' }, hookModal);

    expect(hookConfirm).toHaveBeenCalledTimes(1);
    expect(modalConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses mobile dialog and resolves true on confirm action', async () => {
    const onOk = vi.fn();
    const p = responsiveConfirm(true, { title: 'Mobile', onOk });

    expect(dialogShow).toHaveBeenCalledTimes(1);
    const cfg = dialogShow.mock.calls[0][0];
    await cfg.actions[0][1].onClick();

    await expect(p).resolves.toBe(true);
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('resolves false on mobile close and runs onCancel', async () => {
    const onCancel = vi.fn();
    const p = responsiveConfirm(true, { title: 'Mobile close', onCancel });

    const cfg = dialogShow.mock.calls[1][0];
    cfg.onClose();

    await expect(p).resolves.toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
