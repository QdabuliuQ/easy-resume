'use client';
import Image from 'next/image';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import CloudOutlined from '@ant-design/icons/CloudOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import { DeleteOne } from '@icon-park/react';
import { Button, Tooltip } from 'antd';
import { observer } from 'mobx-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useState } from 'react';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { cloudResumeStore } from '@/mobx';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { MyResumesSkeleton } from '@/views/edit/components/panel/components/settingsSkeletons';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';

type ResumeItem = {
  id: string;
  name: string;
  update_at: number;
};

function MyResumes() {
  const t = useTranslations('Edit.myResumes');
  const message = useAppMessage();
  const { confirm } = useResponsiveConfirm();
  const { data: session, status } = useSession();
  const user = session?.user;
  const name = user?.name || user?.login || t('guest');
  const avatar = user?.image;
  const [list, setList] = useState<ResumeItem[]>([]);
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const activeId = cloudResumeStore.resumeId;
  const listEpoch = cloudResumeStore.listEpoch;

  const load = useCallback(async () => {
    if (status !== 'authenticated' || !user?.uid) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/resume/cloud', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        message.error(data?.error || t('loadFail'));
        setList([]);
        return;
      }
      setList((data.list || []) as ResumeItem[]);
      setMax(Number(data.max || 5));
    } catch {
      message.error(t('loadFail'));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [status, user?.uid, message, t]);

  useEffect(() => {
    void load();
  }, [load, listEpoch]);

  const onLoad = (id: string) => {
    if (openingId || previewingId) return;
    if (activeId === id) {
      message.info(t('alreadyOpen'));
      return;
    }
    confirm({
      title: t('confirmOpenTitle'),
      content: t('confirmOpenContent'),
      okText: t('confirmOpenOk'),
      cancelText: t('cancel'),
      onOk: async () => {
        setOpeningId(id);
        const result = await cloudResumeStore.openResume(id);
        setOpeningId(null);
        if (result.ok) message.success(t('opened'));
        else message.error(result.error || t('openFail'));
      },
    });
  };

  const askDelete = (id: string) => {
    confirm({
      title: t('confirmDelete'),
      okText: t('delete'),
      cancelText: t('cancel'),
      danger: true,
      onOk: () => void onDelete(id),
    });
  };

  const onDelete = async (id: string) => {
    const result = await cloudResumeStore.deleteResume(id);
    if (result.ok) message.success(t('deleted'));
    else message.error(result.error || t('deleteFail'));
  };

  const onPreview = async (item: ResumeItem) => {
    if (previewingId || openingId) return;
    setPreviewingId(item.id);
    try {
      const res = await fetch(`/api/resume/cloud/${encodeURIComponent(item.id)}`, {
        cache: 'no-store',
      });
      const body = await res.json();
      if (!res.ok || !body?.content) {
        message.error(body?.error || t('previewFail'));
        return;
      }
      const displayName = body.content.name || item.name || t('unnamed');
      resumePreviewStore.openWithConfig(
        body.content,
        `${t('previewTitle')} · ${displayName}`,
      );
    } catch {
      message.error(t('previewFail'));
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <div className='space-y-3'>
      <div className={`${panelShellClass} flex items-center gap-3`}>
        {avatar ? (
          <Image
            src={avatar.startsWith('http://') ? `https://${avatar.slice(7)}` : avatar}
            alt={name}
            width={44}
            height={44}
            className='h-11 w-11 shrink-0 rounded-full object-cover'
          />
        ) : (
          <span className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fg/10 text-sm font-semibold text-fg/70'>
            {(name[0] || 'U').toUpperCase()}
          </span>
        )}
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[15px] font-medium text-fg/92'>{name}</p>
          {user?.login ? (
            <p className='truncate text-[12px] text-fg/48'>@{user.login}</p>
          ) : null}
        </div>
      </div>
      <div className={`${panelShellClass} space-y-3`}>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-fg/52'>
            <FileTextOutlined />
            <span>{t('listTitle')}</span>
          </div>
          <div className='flex items-center gap-2'>
            {status === 'authenticated' ? (
              <span className='text-[11px] tabular-nums text-fg/45'>
                {t('quota', { n: list.length, max })}
              </span>
            ) : null}
            <Button
              type='text'
              size='small'
              icon={loading ? <LoadingOutlined /> : <ReloadOutlined />}
              onClick={() => void load()}
              disabled={status !== 'authenticated' || loading}
              className='!text-fg/50'
            />
          </div>
        </div>
        {list.length > 0 ? (
          <p className='text-[12px] leading-relaxed text-fg/45'>{t('previewHint')}</p>
        ) : null}

        {status !== 'authenticated' ? (
          <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-fg/12 bg-fg/[0.02] px-4 py-8 text-center'>
            <CloudOutlined className='text-[28px] text-fg/28' />
            <p className='text-[13px] text-fg/62'>{t('needLogin')}</p>
          </div>
        ) : !user?.uid ? (
          <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-fg/12 bg-fg/[0.02] px-4 py-8 text-center'>
            <CloudOutlined className='text-[28px] text-fg/28' />
            <p className='text-[13px] text-fg/62'>{t('needResync')}</p>
          </div>
        ) : loading && !list.length ? (
          <MyResumesSkeleton withProfile={false} />
        ) : !list.length ? (
          <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-fg/12 bg-fg/[0.02] px-4 py-8 text-center'>
            <CloudOutlined className='text-[28px] text-fg/28' />
            <p className='text-[13px] text-fg/62'>{t('emptyTitle')}</p>
            <p className='max-w-[240px] text-[12px] leading-relaxed text-fg/42'>{t('emptyDesc')}</p>
          </div>
        ) : (
          <ul className='space-y-2'>
            {list.map((item) => {
              const active = activeId === item.id;
              const displayName = item.name || t('unnamed');
              const busy = !!openingId || !!previewingId;
              return (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-[border-color,background-color] duration-150 ${
                      active
                        ? 'border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))] bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)]'
                        : 'border-fg/[0.08] bg-[rgb(var(--panel-surface-rgb)/0.03)] hover:border-fg/[0.14]'
                    }`}
                  >
                    <Tooltip title={t('load')} mouseEnterDelay={0.35} placement='top'>
                      <button
                        type='button'
                        disabled={busy}
                        className='flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50'
                        onClick={() => onLoad(item.id)}
                      >
                        {active ? (
                          <CheckCircleFilled className='shrink-0 text-[12px] text-[var(--color-primary)]' />
                        ) : (
                          <FileTextOutlined className='shrink-0 text-[12px] text-fg/40' />
                        )}
                        <span className='min-w-0 truncate text-[13px] font-medium text-fg/88'>
                          {displayName}
                        </span>
                      </button>
                    </Tooltip>
                    <Button
                      type='default'
                      size='small'
                      disabled={busy}
                      loading={previewingId === item.id}
                      icon={previewingId === item.id ? undefined : <EyeOutlined />}
                      className='!h-7 shrink-0 !rounded-md !border-fg/[0.12] !bg-surface/[0.04] !px-2 !text-[11px] !font-medium !text-fg/72'
                      onClick={() => void onPreview(item)}
                    >
                      {t('preview')}
                    </Button>
                    <button
                      type='button'
                      className='module-op-delete-btn !h-7 !w-7 shrink-0 !rounded-md'
                      aria-label={t('delete')}
                      disabled={busy}
                      onClick={() => askDelete(item.id)}
                    >
                      <DeleteOne theme='outline' size='17' fill='currentColor' />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default memo(observer(MyResumes));
