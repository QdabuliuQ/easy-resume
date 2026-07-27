'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Radio,
  Space,
  Spin,
  Switch,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useAppMessage } from '@/hooks/useAppMessage';
import { buildShareUrl } from '@/lib/shareResumeUrl';

type ShareStatus = {
  enabled: boolean;
  token: string | null;
  expires_at: number | null;
};

type Props = {
  open: boolean;
  resumeId: string;
  onClose: () => void;
};

export default function ShareResumeModal({ open, resumeId, onClose }: Props) {
  const t = useTranslations('Edit.shareModal');
  const locale = useLocale();
  const message = useAppMessage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [expireMode, setExpireMode] = useState<'never' | 'custom'>('never');
  const [expireAt, setExpireAt] = useState<Dayjs | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (!token || typeof window === 'undefined') return '';
    return buildShareUrl(window.location.origin, locale, token);
  }, [token, locale]);

  useEffect(() => {
    if (!open || !resumeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resume/share?id=${encodeURIComponent(resumeId)}`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as ShareStatus & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          message.error(data.error || t('loadFail'));
          return;
        }
        setEnabled(Boolean(data.enabled));
        setToken(data.token || null);
        if (data.expires_at) {
          setExpireMode('custom');
          setExpireAt(dayjs.unix(data.expires_at));
        } else {
          setExpireMode('never');
          setExpireAt(null);
        }
      } catch {
        if (!cancelled) message.error(t('loadFail'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, resumeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async (opts?: { rotate?: boolean; nextEnabled?: boolean }) => {
    const nextEnabled = opts?.nextEnabled ?? enabled;
    let expires_at: number | null | undefined = null;
    if (nextEnabled) {
      if (expireMode === 'custom') {
        if (!expireAt || !expireAt.isAfter(dayjs())) {
          message.error(t('expireInvalid'));
          return;
        }
        expires_at = expireAt.unix();
      } else {
        expires_at = null;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/resume/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resumeId,
          enabled: nextEnabled,
          expires_at: nextEnabled ? expires_at : null,
          ...(opts?.rotate ? { rotate: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data?.error || t('saveFail'));
        return;
      }
      setEnabled(Boolean(data.enabled));
      setToken(data.token || null);
      if (data.expires_at) {
        setExpireMode('custom');
        setExpireAt(dayjs.unix(data.expires_at));
      } else if (data.enabled) {
        setExpireMode('never');
        setExpireAt(null);
      }
      if (!data.enabled) message.success(t('closed'));
      else if (opts?.rotate) message.success(t('generated'));
      else message.success(t('saved'));
    } catch {
      message.error(t('saveFail'));
    } finally {
      setSaving(false);
    }
  };

  const onToggle = (checked: boolean) => {
    setEnabled(checked);
    void persist({ nextEnabled: checked });
  };

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success(t('copied'));
    } catch {
      message.error(t('saveFail'));
    }
  };

  return (
    <Modal
      open={open}
      title={t('title')}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <div className='flex justify-center py-10'>
          <Spin />
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <div className='text-sm font-medium'>{t('enable')}</div>
              <div className='mt-1 text-xs text-fg/50'>{t('enableDesc')}</div>
            </div>
            <Switch checked={enabled} loading={saving} onChange={onToggle} />
          </div>
          {enabled ? (
            <>
              <div>
                <div className='mb-2 text-sm font-medium'>{t('expireLabel')}</div>
                <Radio.Group
                  value={expireMode}
                  onChange={(e) => setExpireMode(e.target.value)}
                  className='flex flex-col gap-2'
                >
                  <Radio value='never'>{t('expireNever')}</Radio>
                  <Radio value='custom'>{t('expireCustom')}</Radio>
                </Radio.Group>
                {expireMode === 'custom' ? (
                  <DatePicker
                    showTime
                    className='mt-[6px] w-full'
                    value={expireAt}
                    onChange={setExpireAt}
                    disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))}
                    placeholder={t('expirePicker')}
                  />
                ) : null}
              </div>
              {shareUrl ? (
                <div>
                  <div className='mb-2 text-sm font-medium'>{t('linkLabel')}</div>
                  <Space.Compact className='w-full'>
                    <Input value={shareUrl} readOnly />
                    <Button onClick={() => void onCopy()}>{t('copy')}</Button>
                  </Space.Compact>
                </div>
              ) : null}
              <Button
                type='primary'
                block
                size='large'
                className='!mt-1 !h-11 !rounded-xl !border-none !bg-[var(--color-primary)] !font-medium !shadow-none hover:!opacity-90'
                loading={saving}
                onClick={() => void persist({ rotate: true, nextEnabled: true })}
              >
                {t('generate')}
              </Button>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
