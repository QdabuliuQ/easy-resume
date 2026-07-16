'use client';

import { FileTextOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Form, Input, Space, Table, Typography } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type AdminStats, fmtTs, useAdmin } from '@/views/admin/AdminShell';

export default function AdminUsersPage() {
  const { authed } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale || 'zh');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setStats(null);
        setError(data?.error || '加载失败');
        return;
      }
      setStats(data as AdminStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = stats?.recent || [];
    const q = keyword.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.github_id.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [stats, keyword]);

  const openUserResumes = (uid: string) => {
    router.push(`/${locale}/admin/resumes?uid=${encodeURIComponent(uid)}`);
  };

  if (!authed) return null;

  return (
    <Space direction='vertical' size={16} className='w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            用户
          </Typography.Title>
          <Typography.Text type='secondary'>
            {stats
              ? `${stats.users.total} 人 · 今日 +${stats.users.today} · 近7日 +${stats.users.week}`
              : 'GitHub 登录后同步到 D1 的用户'}
            {keyword.trim() ? ` · 筛选 ${filtered.length} 条` : ''}
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          刷新
        </Button>
      </div>

      <Form
        form={form}
        layout='inline'
        className='gap-y-2'
        onFinish={(v) => setKeyword(String(v.q || ''))}
      >
        <Form.Item name='q' style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
          <Input
            allowClear
            placeholder='搜索用户名 / 邮箱 / GitHub ID'
            prefix={<SearchOutlined className='text-fg/35' />}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type='primary' htmlType='submit' icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setKeyword('');
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
      <Table
        rowKey='id'
        size='middle'
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: '用户',
            key: 'user',
            render: (_, u) => (
              <Space>
                <Avatar src={u.avatar || undefined}>{(u.username[0] || 'U').toUpperCase()}</Avatar>
                <div>
                  <div className='font-medium'>{u.username || u.github_id}</div>
                  <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                    #{u.github_id}
                  </Typography.Text>
                </div>
              </Space>
            ),
          },
          {
            title: '邮箱',
            dataIndex: 'email',
            ellipsis: true,
            render: (v: string) => v || '—',
          },
          {
            title: '简历数',
            dataIndex: 'resume_count',
            width: 88,
            align: 'right',
            render: (n: number, u) =>
              n > 0 ? (
                <Button type='link' className='!px-0' onClick={() => openUserResumes(u.id)}>
                  {n}
                </Button>
              ) : (
                0
              ),
          },
          {
            title: '注册时间',
            dataIndex: 'create_at',
            width: 180,
            render: (v: number) => fmtTs(v),
          },
          {
            title: '操作',
            key: 'actions',
            width: 120,
            render: (_, u) => (
              <Button
                type='link'
                size='small'
                icon={<FileTextOutlined />}
                disabled={!u.resume_count}
                onClick={() => openUserResumes(u.id)}
              >
                简历
              </Button>
            ),
          },
        ]}
      />
    </Space>
  );
}
