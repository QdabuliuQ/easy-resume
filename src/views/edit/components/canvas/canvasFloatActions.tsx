import type { ReactNode } from 'react';
import {
  CheckCircleOutlined,
  EyeOutlined,
  GithubOutlined,
  HomeOutlined,
  MoonOutlined,
  SunOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Selected } from '@icon-park/react';
import { Popover, Tooltip } from 'antd';

type CanvasFloatActionsProps = {
  backupReady: boolean;
  quickSelectEnabled: boolean;
  onToggleQuickSelect: () => void;
  highPerfTooltipTitle: ReactNode;
  layoutSubtreeSupported: boolean;
  highPerfMode: boolean;
  onToggleHighPerfMode: () => void;
  locale: string;
  langSwitchTitle: string;
  langSwitchAria: string;
  langBadge: string;
  onSwitchLocale: () => void;
  themePopoverOpen: boolean;
  onThemePopoverOpenChange: (open: boolean) => void;
  themePref: 'dark' | 'light' | 'system';
  appTheme: 'dark' | 'light';
  onThemeSelect: (theme: 'dark' | 'light' | 'system', x: number, y: number) => void;
  onOpenGeneralSettings?: () => void;
  onBackHome: () => void;
  onOpenGithub: () => void;
  onOpenPreview: () => void;
  tc: (key: string) => string;
};

export default function CanvasFloatActions(props: CanvasFloatActionsProps) {
  const {
    backupReady,
    quickSelectEnabled,
    onToggleQuickSelect,
    highPerfTooltipTitle,
    layoutSubtreeSupported,
    highPerfMode,
    onToggleHighPerfMode,
    locale,
    langSwitchTitle,
    langSwitchAria,
    langBadge,
    onSwitchLocale,
    themePopoverOpen,
    onThemePopoverOpenChange,
    themePref,
    appTheme,
    onThemeSelect,
    onOpenGeneralSettings,
    onBackHome,
    onOpenGithub,
    onOpenPreview,
    tc,
  } = props;

  return (
    <div className='pointer-events-none fixed right-[20px] bottom-[20px] z-20 flex flex-col items-end gap-2'>
      {backupReady ? (
        <Tooltip title={tc('backupOnTooltip')} placement='left'>
          <span className='pointer-events-auto inline-flex'>
            <button
              type='button'
              disabled
              className='inline-flex h-[42px] w-[42px] cursor-default items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/20 text-emerald-500 shadow-[0_16px_34px_rgb(0_0_0/0.12)] backdrop-blur-[8px]'
              aria-label={tc('backupOnAria')}
            >
              <CheckCircleOutlined className='text-[17px]' />
            </button>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title={tc('backupOffTooltip')} placement='left'>
          <span className='pointer-events-auto inline-flex'>
            <button
              type='button'
              onClick={() => onOpenGeneralSettings?.()}
              className='inline-flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border border-red-500/45 bg-red-500/20 text-red-500 shadow-[0_16px_34px_rgb(0_0_0/0.12)] backdrop-blur-[8px]'
              aria-label={tc('backupOpenSettingsAria')}
            >
              <WarningOutlined className='text-[17px]' />
            </button>
          </span>
        </Tooltip>
      )}
      <Tooltip
        title={quickSelectEnabled
          ? (locale === 'zh' ? '快捷选中：开启' : 'Quick select: on')
          : (locale === 'zh' ? '快捷选中：关闭' : 'Quick select: off')}
        placement='left'
      >
        <button
          type='button'
          onClick={onToggleQuickSelect}
          className={`canvas-float-btn ${quickSelectEnabled ? 'text-emerald-500' : ''}`}
          aria-label={quickSelectEnabled
            ? (locale === 'zh' ? '关闭快捷选中编辑' : 'Disable quick select edit')
            : (locale === 'zh' ? '开启快捷选中编辑' : 'Enable quick select edit')}
        >
          <Selected theme='outline' size='17' fill='currentColor' />
        </button>
      </Tooltip>
      <Tooltip title={highPerfTooltipTitle} placement='left'>
        <button
          type='button'
          disabled={!layoutSubtreeSupported}
          onClick={onToggleHighPerfMode}
          className={`canvas-float-btn ${highPerfMode ? 'text-emerald-500' : ''} ${!layoutSubtreeSupported ? 'cursor-not-allowed opacity-45' : ''}`}
          aria-label={highPerfMode ? tc('highPerfDisableAria') : tc('highPerfEnableAria')}
        >
          <ThunderboltOutlined className='text-[17px]' />
        </button>
      </Tooltip>
      <Tooltip title={langSwitchTitle} placement='left'>
        <button
          type='button'
          onClick={onSwitchLocale}
          className='canvas-float-btn font-semibold'
          aria-label={langSwitchAria}
        >
          <span className='text-[12px] leading-none tracking-tight'>
            {langBadge}
          </span>
        </button>
      </Tooltip>
      <Popover
        placement='left'
        trigger='hover'
        mouseEnterDelay={0.12}
        open={themePopoverOpen}
        onOpenChange={onThemePopoverOpenChange}
        styles={{ body: { padding: 6 } }}
        content={
          <div className='flex min-w-[116px] flex-col gap-0.5'>
            <button
              type='button'
              onClick={(e) => onThemeSelect('light', e.clientX, e.clientY)}
              className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                themePref === 'light' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
              }`}
            >
              {tc('themeMenuLight')}
            </button>
            <button
              type='button'
              onClick={(e) => onThemeSelect('dark', e.clientX, e.clientY)}
              className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                themePref === 'dark' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
              }`}
            >
              {tc('themeMenuDark')}
            </button>
            <button
              type='button'
              onClick={(e) => onThemeSelect('system', e.clientX, e.clientY)}
              className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                themePref === 'system' ? 'bg-fg/12 text-fg' : 'text-fg/85 hover:bg-fg/[0.08]'
              }`}
            >
              {tc('themeMenuSystem')}
            </button>
          </div>
        }
      >
        <button
          type='button'
          className='canvas-float-btn'
          aria-label={tc('toggleThemeAria')}
          aria-haspopup='menu'
        >
          {appTheme === 'dark' ? (
            <SunOutlined className='text-[17px]' />
          ) : (
            <MoonOutlined className='text-[17px]' />
          )}
        </button>
      </Popover>

      <Tooltip title={tc('homeTooltip')} placement='left'>
        <button
          type='button'
          onClick={onBackHome}
          className='canvas-float-btn'
          aria-label={tc('backHomeAria')}
        >
          <HomeOutlined className='text-[17px]' />
        </button>
      </Tooltip>

      <Tooltip title={tc('githubTooltip')} placement='left'>
        <button
          type='button'
          onClick={onOpenGithub}
          className='canvas-float-btn'
          aria-label={tc('githubAria')}
        >
          <GithubOutlined className='text-[17px]' />
        </button>
      </Tooltip>

      <Tooltip title={tc('previewTooltip')} placement='left'>
        <button
          type='button'
          onClick={onOpenPreview}
          className='canvas-float-btn'
          aria-label={tc('previewAria')}
        >
          <EyeOutlined className='text-[17px]' />
        </button>
      </Tooltip>
    </div>
  );
}