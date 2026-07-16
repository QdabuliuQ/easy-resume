'use client';

import {
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Layout, Menu, Spin, Typography, theme } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const { Header, Sider, Content } = Layout;

type AdminCtx = {
  authed: boolean;
  adminName: string;
  booting: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin outside provider');
  return v;
}

export function fmtTs(ts: number) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false });
}

export type AdminStats = {
  users: { total: number; today: number; week: number };
  resumes: { total: number };
  recent: Array<{
    id: string;
    github_id: string;
    username: string;
    avatar: string;
    email: string;
    create_at: number;
    resume_count: number;
  }>;
  ts: number;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/login', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAuthed(true);
          setAdminName(data.username || '');
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data?.error || '登录失败';
    setAuthed(true);
    setAdminName(data.username || username);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
    setAdminName('');
  }, []);

  const value = useMemo(
    () => ({ authed, adminName, booting, login, logout }),
    [authed, adminName, booting, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function LoginForm() {
  const { login } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  return (
    <div className='flex min-h-screen items-center justify-center bg-[var(--editor-shell-bg)] px-4'>
      <div className='w-full max-w-[360px] rounded-xl border border-fg/10 bg-fg/[0.03] p-6'>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          青松后台
        </Typography.Title>
        <Typography.Paragraph type='secondary' style={{ marginBottom: 24 }}>
          账号密码登录后查看看板与数据
        </Typography.Paragraph>
        <Form
          form={form}
          layout='vertical'
          requiredMark={false}
          onFinish={async (values) => {
            setLoading(true);
            const err = await login(values.username, values.password);
            setLoading(false);
            if (err) form.setFields([{ name: 'password', errors: [err] }]);
          }}
        >
          <Form.Item name='username' label='账号' rules={[{ required: true, message: '请输入账号' }]}>
            <Input size='large' autoComplete='username' />
          </Form.Item>
          <Form.Item name='password' label='密码' rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size='large' autoComplete='current-password' />
          </Form.Item>
          <Button type='primary' htmlType='submit' size='large' block loading={loading}>
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default function AdminShell({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const { authed, adminName, booting, logout } = useAdmin();
  const pathname = usePathname() || '';
  const router = useRouter();
  const { token } = theme.useToken();

  const selected = useMemo(() => {
    if (pathname.includes('/admin/users')) return ['users'];
    if (pathname.includes('/admin/resumes')) return ['resumes'];
    return ['dashboard'];
  }, [pathname]);

  if (booting) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[var(--editor-shell-bg)]'>
        <Spin tip='加载中…' />
      </div>
    );
  }

  if (!authed) return <LoginForm />;

  return (
    <Layout className='min-h-screen' style={{ background: 'var(--editor-shell-bg)' }}>
      <Sider
        breakpoint='lg'
        collapsedWidth={64}
        width={200}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div className='px-4 py-4'>
          <Typography.Text type='secondary' style={{ fontSize: 11, letterSpacing: '0.12em' }}>
            ADMIN
          </Typography.Text>
          <div className='text-[15px] font-semibold text-fg/90'>青松后台</div>
        </div>
        <Menu
          mode='inline'
          selectedKeys={selected}
          style={{ borderInlineEnd: 'none', background: 'transparent' }}
          items={[
            {
              key: 'dashboard',
              icon: <HomeOutlined />,
              label: '看板',
              onClick: () => router.push(`/${locale}/admin`),
            },
            {
              key: 'users',
              icon: <TeamOutlined />,
              label: '用户',
              onClick: () => router.push(`/${locale}/admin/users`),
            },
            {
              key: 'resumes',
              icon: <FileTextOutlined />,
              label: '简历',
              onClick: () => router.push(`/${locale}/admin/resumes`),
            },
          ]}
        />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header
          className='flex items-center justify-between px-6'
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 56,
            lineHeight: '56px',
            paddingInline: 24,
          }}
        >
          <Typography.Text type='secondary'>数据来自 Cloudflare D1</Typography.Text>
          <div className='flex items-center gap-3'>
            <Typography.Text>{adminName}</Typography.Text>
            <Link href={`/${locale}`}>
              <Button type='text' size='small'>
                返回站点
              </Button>
            </Link>
            <Button type='text' size='small' icon={<LogoutOutlined />} onClick={() => void logout()}>
              退出
            </Button>
          </div>
        </Header>
        <Content className='p-6'>{children}</Content>
      </Layout>
    </Layout>
  );
}
