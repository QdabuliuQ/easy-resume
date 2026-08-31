'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useMessages } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { homeExpandThumbUrl, panelListThumbUrl } from '@/lib/cdnThumbUrl';
import { captureAndUploadTemplatePreview } from '@/lib/templatePreviewClient';
import { useAdmin } from '@/views/admin/AdminShell';

type TemplateRow = {
  id: string;
  title: string;
  category?: string;
  status?: string;
  sortOrder?: number;
  updatedAt?: number;
  previewImage?: string;
  config?: {
    name: string;
    globalStyle: Record<string, unknown>;
    pages: Array<{ modules: unknown[] }>;
  };
};


export default function AdminTemplatesPage() {
  const { authed } = useAdmin();
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const messages = useMessages();
  const routeLocale = String(params?.locale || locale || 'zh');
  const [list, setList] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchLabel, setBatchLabel] = useState('');
  const [batchFails, setBatchFails] = useState<string[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const batchAbortRef = useRef(false);
  const [form] = Form.useForm<{ id?: string; title: string; json?: string }>();

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/templates', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '模板加载失败');
      setList(data.list || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      let body: Record<string, unknown> = {
        title: values.title.trim(),
        id: values.id?.trim() || undefined,
      };
      const raw = values.json?.trim();
      if (raw) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          message.error('JSON 格式无效');
          return;
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          message.error('JSON 根须为对象');
          return;
        }
        body = { ...(parsed as Record<string, unknown>), ...body };
        if (!body.title) body.title = values.title.trim();
      }
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '创建失败');
      message.success('模板已创建');
      setCreateOpen(false);
      router.push(`/${routeLocale}/admin/templates/${encodeURIComponent(data.id)}/edit`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '删除失败');
      message.success('已删除');
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeletingId('');
    }
  };

  const runBatchPreview = async () => {
    if (batchRunning || !list.length) return;
    batchAbortRef.current = false;
    setBatchOpen(true);
    setBatchRunning(true);
    setBatchFails([]);
    setBatchTotal(list.length);
    setBatchIndex(0);
    const fails: string[] = [];
    let done = 0;
    for (let i = 0; i < list.length; i++) {
      if (batchAbortRef.current) break;
      const row = list[i]!;
      setBatchIndex(i + 1);
      setBatchLabel(row.title || row.id);
      try {
        setBatchLabel(`${row.title || row.id} · 加载简历`);
        const res = await fetch(`/api/admin/templates/${encodeURIComponent(row.id)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || !data?.config) throw new Error(data?.error || '加载失败');
        setBatchLabel(`${row.title || row.id} · 截图上传`);
        await captureAndUploadTemplatePreview({
          templateId: row.id,
          config: data.config,
          locale,
          messages: messages as Record<string, unknown>,
          firstPageOnly: true,
        });
        done += 1;
      } catch (e) {
        fails.push(`${row.title || row.id}：${e instanceof Error ? e.message : '失败'}`);
        setBatchFails([...fails]);
      }
    }
    setBatchRunning(false);
    await load();
    if (batchAbortRef.current) {
      message.warning(`已中止，成功 ${done} 项`);
      return;
    }
    if (fails.length) {
      message.warning(`完成：成功 ${done}，失败 ${fails.length}`);
    } else {
      message.success(`已更新全部 ${list.length} 个模板预览图`);
    }
  };

  const stopBatch = () => {
    batchAbortRef.current = true;
  };

  const cleanupOldPreviews = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/templates/cleanup-old-previews', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '清理失败');
      const failN = Array.isArray(data.failed) ? data.failed.length : 0;
      if (failN) {
        message.warning(
          `扫描 ${data.scanned}，匹配 ${data.matched}，删除 ${data.deleted}，失败 ${failN}`,
        );
      } else {
        message.success(
          `已清理旧目录文件：扫描 ${data.scanned}，删除 ${data.deleted}（新路径 previews/ 已保留）`,
        );
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '清理失败');
    } finally {
      setCleanupLoading(false);
    }
  };

  if (!authed) return null;
  const batchPercent = batchTotal ? Math.round((batchIndex / batchTotal) * 100) : 0;
  return (
    <Space direction='vertical' size={16} className='w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>模板</Typography.Title>
          <Typography.Text type='secondary'>本地 JSON 模板维护 · 支持新建与导入</Typography.Text>
        </div>
        <Space wrap>
          <Popconfirm
            title='清理旧预览目录？'
            description='通过七牛接口删除旧的 {模板id}/… 路径文件，不会动 easy-resume/previews/ 下的新图。'
            okText='清理'
            cancelText='取消'
            disabled={cleanupLoading || batchRunning}
            onConfirm={() => void cleanupOldPreviews()}
          >
            <Button
              icon={<DeleteOutlined />}
              loading={cleanupLoading}
              disabled={batchRunning}
            >
              清理旧预览目录
            </Button>
          </Popconfirm>
          <Popconfirm
            title='批量更新预览图？'
            description='将对列表中每个模板截取首页并上传，可能需要几分钟。'
            okText='开始'
            cancelText='取消'
            disabled={batchRunning || !list.length}
            onConfirm={() => void runBatchPreview()}
          >
            <Button
              icon={<PictureOutlined />}
              loading={batchRunning}
              disabled={!list.length}
            >
              批量更新预览图
            </Button>
          </Popconfirm>
          <Button icon={<PlusOutlined />} type='primary' onClick={openCreate}>新建模板</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>刷新</Button>
        </Space>
      </div>
      {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
      <Table
        rowKey='id'
        loading={loading}
        dataSource={list}
        locale={{ emptyText: <Empty description='暂无模板' /> }}
        columns={[
          { title: '名称', dataIndex: 'title' },
          { title: 'ID', dataIndex: 'id' },
          {
            title: '预览图',
            dataIndex: 'previewImage',
            width: 152,
            render: (url: string | undefined, row: TemplateRow) =>
              url ? (
                <Image
                  src={panelListThumbUrl(url)}
                  alt={row.title}
                  width={120}
                  height={170}
                  className='rounded bg-white ring-1 ring-black/10'
                  style={{ objectFit: 'contain', objectPosition: 'top center' }}
                  preview={{ src: homeExpandThumbUrl(url), mask: '点击查看大图' }}
                />
              ) : (
                <Typography.Text type='secondary'>—</Typography.Text>
              ),
          },
          { title: '分类', dataIndex: 'category', render: (v: string) => v || '—' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: string) => (
              <Tag color={v === 'published' ? 'green' : 'default'}>
                {v === 'published' ? '已发布' : v || '草稿'}
              </Tag>
            ),
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, row: TemplateRow) => (
              <Space>
                <Link href={`/${routeLocale}/admin/templates/${encodeURIComponent(row.id)}/edit`}>
                  <Button type='link' icon={<EditOutlined />}>编辑</Button>
                </Link>
                <Popconfirm
                  title='删除此模板？'
                  description='内置模板将下线；自定义模板会从 overrides 移除。'
                  okText='删除'
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void onDelete(row.id)}
                >
                  <Button
                    type='link'
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
      <Modal
        title='新建模板'
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        confirmLoading={creating}
        okText='创建'
        destroyOnClose
        width={640}
      >
        <Form form={form} layout='vertical' requiredMark={false}>
          <Form.Item
            name='title'
            label='标题'
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder='如：产品经理简历模板' maxLength={80} />
          </Form.Item>
          <Form.Item name='id' label='ID（可选）' extra='留空则按标题生成；仅字母数字、_、-'>
            <Input placeholder='product-manager' maxLength={64} />
          </Form.Item>
          <Form.Item
            name='json'
            label='JSON 导入（可选）'
            extra='支持简历导出 JSON，或 { id, title, config } 模板条目；留空则创建空白模板'
          >
            <Input.TextArea rows={10} placeholder='粘贴 JSON…' className='font-mono text-[12px]' />
          </Form.Item>
          <Upload
            accept='.json,application/json'
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result || '');
                form.setFieldsValue({ json: text });
                try {
                  const parsed = JSON.parse(text) as Record<string, unknown>;
                  if (typeof parsed.title === 'string' && !form.getFieldValue('title')) {
                    form.setFieldsValue({ title: parsed.title });
                  }
                  if (typeof parsed.id === 'string' && !form.getFieldValue('id')) {
                    form.setFieldsValue({ id: parsed.id });
                  }
                  if (
                    !form.getFieldValue('title') &&
                    parsed.config &&
                    typeof parsed.config === 'object' &&
                    typeof (parsed.config as { name?: string }).name === 'string'
                  ) {
                    form.setFieldsValue({ title: (parsed.config as { name: string }).name });
                  }
                } catch {
                  /* 粘贴区仍保留原文，提交时再报错 */
                }
              };
              reader.readAsText(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>从文件导入 JSON</Button>
          </Upload>
        </Form>
      </Modal>
      <Modal
        title='批量更新预览图'
        open={batchOpen}
        closable={!batchRunning}
        maskClosable={false}
        onCancel={() => {
          if (!batchRunning) setBatchOpen(false);
        }}
        footer={
          batchRunning ? (
            <Button onClick={stopBatch}>中止</Button>
          ) : (
            <Button type='primary' onClick={() => setBatchOpen(false)}>关闭</Button>
          )
        }
      >
        <div className='space-y-3 py-2'>
          <Progress
            percent={batchPercent}
            status={batchRunning ? 'active' : batchFails.length ? 'exception' : 'success'}
          />
          <Typography.Text>
            {batchRunning
              ? `正在处理 ${batchIndex}/${batchTotal}：${batchLabel}`
              : `已完成 ${batchIndex}/${batchTotal}`}
          </Typography.Text>
          {batchFails.length ? (
            <div className='max-h-40 overflow-auto rounded border border-fg/10 bg-fg/[0.03] p-2 text-[12px] text-red-500'>
              {batchFails.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
      </Modal>
    </Space>
  );
}
