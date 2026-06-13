import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import Info1, { type InfoProps } from '@/modules/info/info1';
import { makeGlobalStyle } from './fixtures';

const messages = {
  Edit: {
    info1: {
      fields: {
        avatar: '头像',
        phone: '手机号',
        email: '邮箱',
        city: '城市',
        intentCity: '意向城市',
        expectedSalary: '期望薪资',
        status: '状态'
      }
    },
    header: {
      avatarAlt: '{name}的头像'
    }
  }
};

const baseConfig: InfoProps = {
  id: 'info-1',
  type: 'info1' as const,
  options: {
    name: '张三',
    phone: '13800000000',
    email: 'zhangsan@example.com',
    city: '浙江/杭州',
    status: '在职-考虑机会',
    intentCity: [['浙江', '杭州']],
    intentPosts: '前端工程师',
    wechat: '',
    birthday: '',
    gender: '',
    stature: '',
    weight: '',
    ethnic: '',
    origin: '',
    maritalStatus: '',
    politicalStatus: '',
    site: '',
    avatar: 'https://example.com/avatar.png',
    expectedSalary: ['20k', '30k'],
    layout: [
      ['phone', 'email'],
      ['city', 'intentCity'],
      ['expectedSalary', 'status']
    ],
    position: 'right',
    showTitle: true
  }
};

function renderInfo(config = baseConfig, forceSideCol?: boolean) {
  return render(
    <NextIntlClientProvider locale='zh' messages={messages}>
      <Info1 config={config} globalStyle={makeGlobalStyle()} forceSideCol={forceSideCol} />
    </NextIntlClientProvider>
  );
}

describe('Info1 module', () => {
  it('renders name, avatar alt text and configured fields', async () => {
    const { container } = renderInfo();

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByAltText('张三的头像')).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(container.querySelector('#info-1')).toHaveAttribute('data-resume-module-id', 'info-1');

    await waitFor(() => {
      expect(screen.getByText(/手机号：13800000000/)).toBeInTheDocument();
      expect(screen.getByText(/邮箱：zhangsan@example.com/)).toBeInTheDocument();
    });
    expect(document.querySelector('[data-item-id="info-1_expectedSalary_0"]')?.textContent).toBe(
      '20k'
    );
    expect(document.querySelector('[data-item-id="info-1_expectedSalary_1"]')?.textContent).toBe(
      '30k'
    );
  });

  it('omits avatar placeholder and inline labels when disabled', async () => {
    renderInfo({
      ...baseConfig,
      options: {
        ...baseConfig.options,
        avatar: 'avatar',
        showTitle: false,
        position: 'center' as const
      }
    });

    expect(screen.queryByAltText('张三的头像')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('13800000000')).toBeInTheDocument();
    });
    expect(screen.queryByText(/手机号：/)).not.toBeInTheDocument();
  });

  it('renders in side-column mode', async () => {
    renderInfo(
      {
        ...baseConfig,
        options: {
          ...baseConfig.options,
          position: 'left'
        }
      },
      true
    );

    expect(screen.getByText('张三')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/状态：在职-考虑机会/)).toBeInTheDocument();
    });
  });

  it('renders center layout with visible avatar before text', async () => {
    const { container } = renderInfo({
      ...baseConfig,
      options: {
        ...baseConfig.options,
        position: 'center'
      }
    });

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(screen.getByText('张三')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/意向城市：杭州/)).toBeInTheDocument();
    });
  });

  it('returns null when config is missing', () => {
    const { container } = render(
      <NextIntlClientProvider locale='zh' messages={messages}>
        <Info1 config={undefined as never} globalStyle={makeGlobalStyle()} />
      </NextIntlClientProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
