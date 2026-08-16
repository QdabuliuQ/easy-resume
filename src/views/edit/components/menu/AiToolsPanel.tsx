'use client';
import { EditTwo, Magic, Peoples } from '@icon-park/react';
import type { ReactNode } from 'react';

export const AI_TOOL_KEYS = ['ai-score', 'ai-modify', 'ai-interview'] as const;
export type AiToolKey = (typeof AI_TOOL_KEYS)[number];

export function isAiToolKey(key: string): key is AiToolKey {
  return (AI_TOOL_KEYS as readonly string[]).includes(key);
}

type AiToolRowProps = {
  toolKey: AiToolKey;
  title: string;
  description: string;
  selected: boolean;
  locked?: boolean;
  tourAttr?: string;
  onSelect: () => void;
};

const rowBase =
  'group flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100';

function ToolIcon({ toolKey, selected }: { toolKey: AiToolKey; selected: boolean }) {
  const fill = selected ? 'var(--color-primary)' : 'var(--menu-icon-muted)';
  const cls = 'mt-0.5 shrink-0 transition-[fill] duration-200';
  if (toolKey === 'ai-score') return <Magic theme='outline' size={18} fill={fill} className={cls} />;
  if (toolKey === 'ai-modify') return <EditTwo theme='outline' size={18} fill={fill} className={cls} />;
  return <Peoples theme='outline' size={18} fill={fill} className={cls} />;
}

export function AiToolRow({
  toolKey,
  title,
  description,
  selected,
  locked,
  tourAttr,
  onSelect,
}: AiToolRowProps) {
  return (
    <button
      type='button'
      data-edit-tour={tourAttr}
      disabled={locked}
      aria-current={selected ? 'page' : undefined}
      onClick={onSelect}
      className={`${rowBase} ${
        selected
          ? 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
          : 'hover:bg-fg/[0.05]'
      }${locked ? ' cursor-not-allowed opacity-45' : ''}`}
    >
      <ToolIcon toolKey={toolKey} selected={selected} />
      <span className='min-w-0 flex-1'>
        <span
          className={`block text-[13px] font-semibold tracking-[-0.01em] ${
            selected ? 'text-[var(--color-primary)]' : 'text-fg/88'
          }`}
        >
          {title}
        </span>
        <span className='mt-0.5 block text-[11px] leading-snug text-fg/48'>{description}</span>
      </span>
    </button>
  );
}

type AiToolsPanelProps = {
  activeKey: string;
  titles: Record<AiToolKey, string>;
  descriptions: Record<AiToolKey, string>;
  interviewLocked?: boolean;
  onSelect: (key: AiToolKey) => void;
  footer?: ReactNode;
  className?: string;
};

export function AiToolsPanel({
  activeKey,
  titles,
  descriptions,
  interviewLocked,
  onSelect,
  footer,
  className,
}: AiToolsPanelProps) {
  return (
    <div
      className={`ai-tools-glass overflow-hidden rounded-2xl ${className ?? ''}`}
      role='menu'
      aria-label='AI tools'
    >
      <div className='border-b border-fg/[0.06] px-3.5 py-2.5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-fg/42'>AI Tools</p>
      </div>
      <div className='flex flex-col gap-0.5 p-1.5'>
        {AI_TOOL_KEYS.map((key) => (
          <AiToolRow
            key={key}
            toolKey={key}
            title={titles[key]}
            description={descriptions[key]}
            selected={activeKey === key}
            locked={key === 'ai-interview' && interviewLocked}
            tourAttr={key === 'ai-score' ? 'menu-ai-score' : key === 'ai-modify' ? 'menu-ai-modify' : undefined}
            onSelect={() => onSelect(key)}
          />
        ))}
      </div>
      {footer}
    </div>
  );
}
