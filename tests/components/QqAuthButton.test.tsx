import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authZh from '@/messages/zh/auth';

const useSession = vi.fn();
const signIn = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSession(),
  signIn: (...args: unknown[]) => signIn(...args),
}));

import QqAuthButton from '@/components/auth/QqAuthButton';

function renderBtn(variant?: 'home' | 'compact') {
  return render(
    <NextIntlClientProvider locale='zh' messages={{ Auth: authZh }}>
      <QqAuthButton variant={variant} />
    </NextIntlClientProvider>,
  );
}

describe('QqAuthButton', () => {
  beforeEach(() => {
    useSession.mockReset();
    signIn.mockReset();
    signIn.mockResolvedValue(undefined);
  });

  it('hides when loading or authenticated', () => {
    useSession.mockReturnValue({ data: null, status: 'loading' });
    const { container, rerender } = renderBtn();
    expect(container).toBeEmptyDOMElement();

    useSession.mockReturnValue({
      data: { user: { name: 'u' } },
      status: 'authenticated',
    });
    rerender(
      <NextIntlClientProvider locale='zh' messages={{ Auth: authZh }}>
        <QqAuthButton />
      </NextIntlClientProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls signIn qq on click', async () => {
    useSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const user = userEvent.setup();
    renderBtn();
    await user.click(screen.getByLabelText('使用 QQ 登录'));
    expect(signIn).toHaveBeenCalledWith('qq', {
      redirectTo: window.location.href,
      redirect: true,
    });
  });

  it('compact variant still triggers signIn', async () => {
    useSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const user = userEvent.setup();
    renderBtn('compact');
    await user.click(screen.getByLabelText('使用 QQ 登录'));
    expect(signIn).toHaveBeenCalledTimes(1);
  });
});
