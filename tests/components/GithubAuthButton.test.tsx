import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authZh from '@/messages/zh/auth';

const useSession = vi.fn();
const signIn = vi.fn();
const signOut = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSession(),
  signIn: (...args: unknown[]) => signIn(...args),
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Popover: ({
      content,
      children,
    }: {
      content: unknown;
      children: unknown;
    }) => (
      <div>
        {children as never}
        <div data-testid='auth-popover'>{content as never}</div>
      </div>
    ),
  };
});

import GithubAuthButton from '@/components/auth/GithubAuthButton';

function renderBtn(variant?: 'home' | 'compact') {
  return render(
    <NextIntlClientProvider locale='zh' messages={{ Auth: authZh }}>
      <GithubAuthButton variant={variant} />
    </NextIntlClientProvider>,
  );
}

describe('GithubAuthButton', () => {
  beforeEach(() => {
    useSession.mockReset();
    signIn.mockReset();
    signOut.mockReset();
    signIn.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
  });

  it('shows loading state', () => {
    useSession.mockReturnValue({ data: null, status: 'loading' });
    renderBtn();
    expect(screen.getByLabelText('加载登录状态')).toBeInTheDocument();
  });

  it('calls signIn on login click', async () => {
    useSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const user = userEvent.setup();
    renderBtn();
    await user.click(screen.getByLabelText('使用 GitHub 登录'));
    expect(signIn).toHaveBeenCalledWith('github', {
      callbackUrl: window.location.href,
    });
  });

  it('compact variant still triggers signIn', async () => {
    useSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const user = userEvent.setup();
    renderBtn('compact');
    await user.click(screen.getByLabelText('使用 GitHub 登录'));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('shows account menu and signs out', async () => {
    useSession.mockReturnValue({
      data: {
        user: {
          name: 'Ada',
          login: 'ada',
          image: 'https://example.com/a.png',
          id: '1',
        },
      },
      status: 'authenticated',
    });
    const user = userEvent.setup();
    renderBtn();
    await user.click(screen.getByRole('button', { name: /退出登录/ }));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: window.location.href });
    });
  });
});
