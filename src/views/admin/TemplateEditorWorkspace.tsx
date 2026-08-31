'use client';

import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Spin, Tag, message } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useMessages } from 'next-intl';
import { configStore, editHistoryStore } from '@/mobx';
import { resetEditSessionState } from '@/mobx/resetEditSessionState';
import { captureAndUploadTemplatePreview } from '@/lib/templatePreviewClient';
import Container from '@/views/edit/components/container';
import Canvas from '@/views/edit/components/canvas';

const TABS = [
  { key: 'resume', label: '基础编辑' },
  { key: 'page-settings', label: '页面配置' },
] as const;

export default function TemplateEditorWorkspace() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const messages = useMessages();
  const id = String(params?.id || '');
  const [activeKey, setActiveKey] = useState<string>('resume');
  const [title, setTitle] = useState('模板编辑');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/admin/templates/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.config) throw new Error(data?.error || '模板加载失败');
        if (cancelled) return;
        editHistoryStore.clear();
        configStore.setConfig(data.config, { source: 'reset' });
        setTitle(data.title || data.config.name || '模板编辑');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '模板加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      resetEditSessionState();
    };
  }, [id]);

  const save = useCallback(async () => {
    if (saving || !configStore.getConfig) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configStore.getConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '模板保存失败');

      try {
        await captureAndUploadTemplatePreview({
          templateId: id,
          config: configStore.getConfig,
          locale,
          messages: messages as Record<string, unknown>,
          exportPages: configStore.getExportPages,
          firstPageOnly: true,
        });
        message.success('模板和预览图已保存');
      } catch (e) {
        message.warning(`模板已保存，预览图未更新：${e instanceof Error ? e.message : '上传失败'}`);
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '模板保存失败');
    } finally {
      setSaving(false);
    }
  }, [id, locale, messages, saving]);

  const changeTab = (key: string) => {
    setActiveKey(key);
  };

  if (loading) {
    return <div className='flex h-full items-center justify-center'><Spin tip='加载模板…' /></div>;
  }
  if (error) {
    return <div className='flex h-full items-center justify-center text-sm text-red-500'>{error}</div>;
  }

  return (
    <div className='flex h-full min-h-0 flex-col bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <div className='flex h-14 shrink-0 items-center justify-between border-b border-fg/[0.1] bg-[var(--editor-shell-panel)] px-5'>
        <div className='flex min-w-0 items-center gap-3'>
          <Button
            type='text'
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/${locale}/admin/templates`)}
            aria-label='返回模板列表'
          />
          <div className='min-w-0'>
            <div className='truncate text-[14px] font-semibold'>{title}</div>
            <div className='text-[11px] text-fg/45'>模板工作台</div>
          </div>
          <Tag color='processing'>编辑中</Tag>
        </div>
        <Button type='primary' icon={<SaveOutlined />} loading={saving} onClick={() => void save()}>
          保存模板
        </Button>
      </div>

      <div className='flex shrink-0 items-center gap-1 overflow-x-auto border-b border-fg/[0.08] bg-[var(--editor-shell-panel)] px-5 py-2'>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => changeTab(tab.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              activeKey === tab.key
                ? 'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]'
                : 'text-fg/58 hover:bg-fg/[0.06] hover:text-fg/85'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='flex min-h-0 flex-1'>
        <div className='w-[460px] min-w-[460px] overflow-hidden border-r border-fg/[0.1] bg-[var(--resume-panel-bg)] xl:w-[500px] xl:min-w-[500px]'>
          <Container menuActiveKey={activeKey} fullWidth />
        </div>
        <div className='min-w-0 flex-1 overflow-hidden'>
          <Canvas
            menuActiveKey={activeKey}
            templateMode
            onOpenGeneralSettings={() => setActiveKey('general-settings')}
            onOpenResumePanel={() => setActiveKey('resume')}
          />
        </div>
      </div>
    </div>
  );
}
