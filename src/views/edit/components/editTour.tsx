'use client';
import { Tour } from 'antd';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useState } from 'react';
import { isEditTourDone, markEditTourDone } from '@/lib/editTourStorage';

const TOUR_TARGET_KEYS = [
  'module-nav',
  'menu-resume-template',
  'menu-ai-score',
  'menu-ai-modify',
  'header-export',
] as const;

function queryTourTarget(key: string): HTMLElement | null {
  return document.querySelector(`[data-edit-tour="${key}"]`);
}

function hasAllTourTargets(): boolean {
  return TOUR_TARGET_KEYS.every((key) => queryTourTarget(key));
}

function tourTarget(key: (typeof TOUR_TARGET_KEYS)[number]): () => HTMLElement {
  return () => queryTourTarget(key)!;
}

type EditTourProps = {
  ready: boolean;
};

function EditTour({ ready }: EditTourProps) {
  const t = useTranslations('Edit.editTour');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || isEditTourDone()) return;
    let cancelled = false;
    let attempts = 0;
    let timer = 0;
    const tryOpen = () => {
      if (cancelled) return;
      if (hasAllTourTargets()) {
        setOpen(true);
        return;
      }
      attempts += 1;
      if (attempts < 30) timer = window.setTimeout(tryOpen, 120);
    };
    timer = window.setTimeout(tryOpen, 520);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready]);

  const steps = useMemo(
    () => [
      {
        title: t('moduleNavTitle'),
        description: t('moduleNavDesc'),
        target: tourTarget('module-nav'),
        placement: 'bottom' as const,
      },
      {
        title: t('templateTitle'),
        description: t('templateDesc'),
        target: tourTarget('menu-resume-template'),
        placement: 'right' as const,
      },
      {
        title: t('aiScoreTitle'),
        description: t('aiScoreDesc'),
        target: tourTarget('menu-ai-score'),
        placement: 'right' as const,
      },
      {
        title: t('aiModifyTitle'),
        description: t('aiModifyDesc'),
        target: tourTarget('menu-ai-modify'),
        placement: 'right' as const,
      },
      {
        title: t('exportTitle'),
        description: t('exportDesc'),
        target: tourTarget('header-export'),
        placement: 'bottom' as const,
      },
    ],
    [t],
  );

  const close = () => {
    setOpen(false);
    markEditTourDone();
  };

  return (
    <Tour
      open={open}
      onClose={close}
      onFinish={close}
      steps={steps}
      gap={{ radius: 10 }}
    />
  );
}

export default memo(EditTour);
