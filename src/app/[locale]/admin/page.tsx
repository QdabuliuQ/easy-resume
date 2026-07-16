'use client';

import {
  ArrowRightOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Col, Empty, Row, Space, Statistic, Table, Typography } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { type AdminStats, fmtTs, useAdmin } from '@/views/admin/AdminShell';

export default function AdminDashboardPage() {
  const { authed } = useAdmin();
  const params = useParams();
  const locale = (params?.locale as string) || 'zh';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  if (!authed) return null;

  return (
    <Space direction='vertical' size={16} className='w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            看板
          </Typography.Title>
          <Typography.Text type='secondary'>
            {stats ? `更新于 ${fmtTs(stats.ts)}` : '用户与简历概览'}
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          刷新
        </Button>
      </div>

      {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size='small' loading={loading && !stats}>
            <Statistic title='用户总数' value={stats?.users.total ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size='small' loading={loading && !stats}>
            <Statistic title='今日新增' value={stats?.users.today ?? 0} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size='small' loading={loading && !stats}>
            <Statistic title='近 7 日新增' value={stats?.users.week ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size='small' loading={loading && !stats}>
            <Statistic
              title='简历总数'
              value={stats?.resumes.total ?? 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            size='small'
            title='最近注册'
            extra={
              <Link href={`/${locale}/admin/users`}>
                <Button type='link' size='small' icon={<ArrowRightOutlined />}>
                  全部用户
                </Button>
              </Link>
            }
          >
            <Table
              size='small'
              rowKey='id'
              loading={loading && !stats}
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无用户' /> }}
              dataSource={(stats?.recent || []).slice(0, 8)}
              columns={[
                {
                  title: '用户',
                  key: 'user',
                  render: (_, u) => (
                    <Space>
                      <Avatar src={u.avatar || undefined} size={28}>
                        {(u.username[0] || 'U').toUpperCase()}
                      </Avatar>
                      <span>{u.username || u.github_id}</span>
                    </Space>
                  ),
                },
                {
                  title: '简历',
                  dataIndex: 'resume_count',
                  width: 72,
                  align: 'right',
                },
                {
                  title: '注册时间',
                  dataIndex: 'create_at',
                  width: 168,
                  render: (v: number) => fmtTs(v),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size='small' title='快捷入口'>
            <Space direction='vertical' className='w-full'>
              <Link href={`/${locale}/admin/users`} className='block'>
                <Button block icon={<TeamOutlined />}>
                  用户列表
                </Button>
              </Link>
              <Link href={`/${locale}/admin/resumes`} className='block'>
                <Button block icon={<FileTextOutlined />}>
                  简历列表
                </Button>
              </Link>
            </Space>
            <Typography.Paragraph type='secondary' style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}>
              用户来自 GitHub 登录同步；简历来自云端保存。
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
