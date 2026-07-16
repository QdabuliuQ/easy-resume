'use client';

import { DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Drawer, Form, Input, message, Popconfirm, Space, Spin, Table, Typography } from 'antd';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { fmtTs, useAdmin } from '@/views/admin/AdminShell';

const ResumeImageExportPage = dynamic(
  () => import('@/views/export/resumeImageExportPage'),
  { ssr: false, loading: () => <Spin tip='加载预览…' /> },
);

type ResumeRow = {
  id: string;
  user_id: string;
  update_at: number;
  name: string;
  username: string;
  avatar: string;
  email: string;
  github_id: string;
};

export default function AdminResumesPage() {
  const { authed } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params?.locale || 'zh');
  const filterUid = searchParams.get('uid')?.trim() || '';
  const [list, setList] = useState<ResumeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [ts, setTs] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewConfig, setPreviewConfig] = useState<unknown>(null);

  const load = useCallback(
    async (q?: string) => {
      if (!authed) return;
      setLoading(true);
      setError('');
      try {
        const query = (q ?? keyword).trim();
        const qs = new URLSearchParams();
        if (query) qs.set('q', query);
        if (filterUid) qs.set('uid', filterUid);
        const res = await fetch(`/api/admin/resumes${qs.toString() ? `?${qs}` : ''}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
          setList([]);
          setError(data?.error || '加载失败');
          return;
        }
        setList((data.list || []) as ResumeRow[]);
        setTotal(Number(data.total || 0));
        setTs(Number(data.ts || 0));
      } catch (e) {
        setError(e instanceof Error ? e.message : '网络错误');
      } finally {
        setLoading(false);
      }
    },
    [authed, keyword, filterUid],
  );

  useEffect(() => {
    void load('');
  }, [authed, filterUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPreview = async (row: ResumeRow) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewConfig(null);
    setPreviewTitle(row.name || '未命名简历');
    try {
      const res = await fetch(`/api/admin/resumes/${encodeURIComponent(row.id)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data?.error || '加载失败');
        return;
      }
      setPreviewTitle(data.content?.name || row.name || '未命名简历');
      setPreviewConfig(data.content);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setPreviewLoading(false);
    }
  };

  const removeResume = async (row: ResumeRow) => {
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/resumes/${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data?.error || '删除失败');
        return;
      }
      message.success('已删除');
      if (previewOpen) {
        setPreviewOpen(false);
        setPreviewConfig(null);
      }
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '网络错误');
    } finally {
      setDeletingId('');
    }
  };

  if (!authed) return null;

  const ownerLabel =
    filterUid && list[0]
      ? list[0].username || list[0].github_id || filterUid
      : filterUid || '';

  return (
    <Space direction='vertical' size={16} className='w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            简历
          </Typography.Title>
          <Typography.Text type='secondary'>
            {filterUid
              ? `用户 ${ownerLabel} · ${total} 份`
              : total
                ? `${total} 份`
                : '同步到 D1 的云端简历'}
            {ts ? ` · 更新于 ${fmtTs(ts)}` : ''}
          </Typography.Text>
        </div>
        <Space>
          {filterUid ? (
            <Button onClick={() => router.push(`/${locale}/admin/resumes`)}>查看全部</Button>
          ) : null}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
            刷新
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout='inline'
        className='gap-y-2'
        onFinish={(v) => {
          const q = String(v.q || '');
          setKeyword(q);
          void load(q);
        }}
      >
        <Form.Item name='q' style={{ marginBottom: 0, flex: 1, minWidth: 240 }}>
          <Input
            allowClear
            placeholder='搜索简历名 / 用户名 / 邮箱 / ID'
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
                void load('');
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
        dataSource={list}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: '简历名',
            dataIndex: 'name',
            ellipsis: true,
            render: (v: string, row) => (
              <Button type='link' className='!px-0' onClick={() => void openPreview(row)}>
                {v || '未命名简历'}
              </Button>
            ),
          },
          {
            title: '所属用户',
            key: 'owner',
            render: (_, r) => (
              <Space>
                <Avatar size='small' src={r.avatar || undefined}>
                  {(r.username[0] || 'U').toUpperCase()}
                </Avatar>
                <Button
                  type='link'
                  className='!px-0'
                  onClick={() => router.push(`/${locale}/admin/resumes?uid=${encodeURIComponent(r.user_id)}`)}
                >
                  {r.username || r.github_id || r.user_id}
                </Button>
              </Space>
            ),
          },
          {
            title: '简历 ID',
            dataIndex: 'id',
            ellipsis: true,
            width: 280,
            render: (v: string) => (
              <Typography.Text code copyable={{ text: v }} style={{ fontSize: 12 }}>
                {v}
              </Typography.Text>
            ),
          },
          {
            title: '更新时间',
            dataIndex: 'update_at',
            width: 168,
            render: (v: number) => fmtTs(v),
          },
          {
            title: '操作',
            key: 'actions',
            width: 160,
            render: (_, row) => (
              <Space size={0}>
                <Button
                  type='link'
                  size='small'
                  icon={<EyeOutlined />}
                  onClick={() => void openPreview(row)}
                >
                  预览
                </Button>
                <Popconfirm
                  title='删除这份简历？'
                  description='删除后不可恢复'
                  okText='删除'
                  okButtonProps={{ danger: true }}
                  cancelText='取消'
                  onConfirm={() => void removeResume(row)}
                >
                  <Button
                    type='link'
                    size='small'
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingId === row.id}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={previewTitle || '简历预览'}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewConfig(null);
          setPreviewError('');
        }}
        width={920}
        destroyOnClose
        styles={{ body: { background: '#e8e8e8', padding: 16 } }}
      >
        {previewLoading ? (
          <div className='flex justify-center py-16'>
            <Spin tip='加载预览…' />
          </div>
        ) : previewError ? (
          <Typography.Text type='danger'>{previewError}</Typography.Text>
        ) : previewConfig ? (
          <div className='mx-auto w-fit'>
            <ResumeImageExportPage config={previewConfig} />
          </div>
        ) : null}
      </Drawer>
    </Space>
  );
}
