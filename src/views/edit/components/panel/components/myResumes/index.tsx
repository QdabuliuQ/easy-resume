'use client';
import Image from 'next/image';
import {
  CheckCircleFilled,
  CloudDownloadOutlined,
  CloudOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DeleteOne } from '@icon-park/react';
import { Button, Spin } from 'antd';
import { observer } from 'mobx-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useState } from 'react';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { cloudResumeStore } from '@/mobx';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import {
  TEMPLATE_CARD_PREVIEW_SCALE,
  TemplateFirstPagePreview,
} from '@/views/edit/components/panel/components/resumeTemplate';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';

type ResumeItem = {
  id: string;
  name: string;
  update_at: number;
  config?: ResumeTemplateItem['config'];
};

function MyResumes() {
  const t = useTranslations('Edit.myResumes');
  const message = useAppMessage();
  const { confirm, contextHolder } = useResponsiveConfirm();
  const { data: session, status } = useSession();
  const user = session?.user;
  const name = user?.name || user?.login || t('guest');
  const avatar = user?.image;
  const [list, setList] = useState<ResumeItem[]>([]);
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
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
      const rows = (data.list || []) as ResumeItem[];
      setMax(Number(data.max || 5));
      const withConfig = await Promise.all(
        rows.map(async (row) => {
          try {
            const detail = await fetch(`/api/resume/cloud/${encodeURIComponent(row.id)}`, {
              cache: 'no-store',
            });
            const body = await detail.json();
            if (!detail.ok || !body?.content) return row;
            return { ...row, name: body.content.name || row.name, config: body.content };
          } catch {
            return row;
          }
        }),
      );
      setList(withConfig);
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
    if (openingId) return;
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

  return (
    <div className='space-y-3'>
      {contextHolder}
      <div className={`${panelShellClass} flex items-center gap-3`}>
        {avatar ? (
          <Image
            src={avatar}
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
          <div className='flex justify-center py-10'>
            <Spin />
          </div>
        ) : !list.length ? (
          <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-fg/12 bg-fg/[0.02] px-4 py-8 text-center'>
            <CloudOutlined className='text-[28px] text-fg/28' />
            <p className='text-[13px] text-fg/62'>{t('emptyTitle')}</p>
            <p className='max-w-[240px] text-[12px] leading-relaxed text-fg/42'>{t('emptyDesc')}</p>
          </div>
        ) : (
          <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {list.map((item, index) => {
              const active = activeId === item.id;
              return (
                <li key={item.id} className='min-w-0'>
                  <div
                    className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-card-tight)] transition-[transform,border-color,background-color,box-shadow] duration-200 ${
                      active
                        ? 'border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,transparent)_0%,rgb(var(--panel-surface-rgb)/0.03)_100%),var(--panel-layer-deep)]'
                        : 'border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.055)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),var(--panel-layer-deep)] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))]'
                    }`}
                  >
                    <button
                      type='button'
                      disabled={!!openingId}
                      onClick={() => onLoad(item.id)}
                      className='flex w-full cursor-pointer flex-col text-left disabled:cursor-wait'
                    >
                      <div className='flex items-center justify-between gap-2 border-b border-fg/[0.06] bg-surface/[0.03] px-3 py-2'>
                        <span className='inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[10px] font-medium text-fg/62'>
                          {active ? (
                            <CheckCircleFilled className='text-[10px] text-[var(--color-primary)]' />
                          ) : null}
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className='truncate text-[12px] font-semibold text-fg/88'>
                          {item.name || t('unnamed')}
                        </span>
                      </div>
                      <div className='flex justify-center overflow-hidden bg-[rgb(var(--surface-fg-rgb)/0.04)]'>
                        <div className='pointer-events-none max-h-[220px] overflow-hidden'>
                          {item.config ? (
                            <TemplateFirstPagePreview
                              config={item.config}
                              scale={TEMPLATE_CARD_PREVIEW_SCALE}
                            />
                          ) : (
                            <div className='flex h-[160px] w-full items-center justify-center text-[12px] text-fg/40'>
                              {t('previewLoading')}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className='flex items-center gap-2 border-t border-fg/[0.06] px-3 py-2'>
                      <Button
                        type='default'
                        size='small'
                        disabled={!!openingId}
                        icon={<CloudDownloadOutlined />}
                        className='!h-7 min-w-0 flex-1 !rounded-md !border-[color:color-mix(in_srgb,var(--color-primary)_24%,transparent)] !bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] !px-2 !text-[11px] !font-medium !text-[color:var(--color-primary)]'
                        onClick={() => onLoad(item.id)}
                      >
                        {t('load')}
                      </Button>
                      <button
                        type='button'
                        className='module-op-delete-btn'
                        aria-label={t('delete')}
                        onClick={() => askDelete(item.id)}
                      >
                        <DeleteOne theme='outline' size='17' fill='currentColor' />
                      </button>
                    </div>
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
