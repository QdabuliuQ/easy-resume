'use client';

import { ProfileOutlined, SettingOutlined, SlidersOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiToolsIcon from '../components/menu/AiToolsIcon';
import { AiToolsPanel, isAiToolKey, type AiToolKey } from '../components/menu/AiToolsPanel';

const EXIT_MS = 180;

const TABS = [
  { key: 'resume', icon: ProfileOutlined },
  { key: 'page-settings', icon: SlidersOutlined },
  { key: 'ai-tools', icon: null },
  { key: 'general-settings', icon: SettingOutlined },
] as const;

type TabKey = (typeof TABS)[number]['key'];
type MenuKey = 'resume' | 'page-settings' | 'ai-score' | 'ai-modify' | 'ai-interview' | 'general-settings';

function MobileMainTabs({
  activeKey,
  onChange,
}: {
  activeKey: string;
  onChange: (key: MenuKey) => void;
}) {
  const t = useTranslations('Edit.mobile');
  const tm = useTranslations('Edit.menu');
  const exitTimer = useRef<number>(0);
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const labels: Record<TabKey, string> = {
    resume: t('tabResume'),
    'page-settings': t('tabPage'),
    'ai-tools': t('tabAi'),
    'general-settings': t('tabGeneral'),
  };
  const aiActive = isAiToolKey(activeKey);
  const aiTitles = useMemo(
    () =>
      ({
        'ai-score': tm('aiScore'),
        'ai-modify': tm('aiModify'),
        'ai-interview': tm('aiInterview'),
      }) satisfies Record<AiToolKey, string>,
    [tm],
  );
  const aiDescriptions = useMemo(
    () =>
      ({
        'ai-score': tm('aiScoreDesc'),
        'ai-modify': tm('aiModifyDesc'),
        'ai-interview': tm('aiInterviewDesc'),
      }) satisfies Record<AiToolKey, string>,
    [tm],
  );

  const openSheet = useCallback(() => {
    window.clearTimeout(exitTimer.current);
    setPresent(true);
    setVisible(true);
  }, []);

  const beginClose = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!present || visible) {
      window.clearTimeout(exitTimer.current);
      return;
    }
    exitTimer.current = window.setTimeout(() => setPresent(false), EXIT_MS);
    return () => window.clearTimeout(exitTimer.current);
  }, [present, visible]);

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [present, beginClose]);

  const visualKey = (key: TabKey): boolean => {
    if (key === 'ai-tools') return aiActive;
    return activeKey === key;
  };

  return (
    <>
      <nav className='shrink-0 border-b border-fg/10 px-1'>
        <div className='grid grid-cols-4 gap-0.5'>
          {TABS.map(({ key, icon: Icon }) => {
            const on = visualKey(key);
            return (
              <button
                key={key}
                type='button'
                onClick={() => {
                  if (key === 'ai-tools') {
                    openSheet();
                    return;
                  }
                  onChange(key);
                }}
                className={`relative flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${on ? 'text-[var(--color-primary)]' : 'text-fg/50'}`}
              >
                {on ? (
                  <span className='absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)]' />
                ) : null}
                {key === 'ai-tools' ? (
                  <AiToolsIcon
                    size={18}
                    className={on ? 'text-[var(--color-primary)]' : 'text-[var(--menu-icon-muted)]'}
                  />
                ) : Icon ? (
                  <Icon className='text-[18px]' />
                ) : null}
                <span className='max-w-full truncate px-0.5'>{labels[key]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {present ? (
        <div className='fixed inset-0 z-40 flex flex-col justify-end'>
          <button
            type='button'
            className={`absolute inset-0 bg-[rgb(var(--surface-fg-rgb)/0.18)] backdrop-blur-xl backdrop-saturate-150 ${
              visible ? 'ai-tools-scrim-enter' : 'ai-tools-scrim-exit'
            }`}
            aria-label='Close'
            onClick={beginClose}
          />
          <div className='relative z-[1] px-3 pb-[max(12px,env(safe-area-inset-bottom))]'>
            <AiToolsPanel
              className={visible ? 'ai-tools-sheet-enter' : 'ai-tools-sheet-exit'}
              activeKey={activeKey}
              titles={aiTitles}
              descriptions={aiDescriptions}
              onSelect={(key) => {
                onChange(key);
                beginClose();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default memo(MobileMainTabs);
