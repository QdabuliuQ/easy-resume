'use client';
import { BulbOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { memo, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { RichHtmlOrText } from '@/components/resumeQuillHtml';
import type { ResumeDiff, ResumeDiffKind } from '@/lib/resumeDiff';
import { looksLikeRichHtml } from '@/utils/sanitizeHtml';

type ModifyDiffBubbleProps = {
  content: string;
  diffs: ResumeDiff[];
  visibleCount?: number;
  resolved?: 'applied' | 'cancelled';
  appliedIds?: string[];
  cancelledIds?: string[];
  onApplyOne: (id: string) => void;
  onCancelOne: (id: string) => void;
  onApplyBatch: () => void;
};

const KIND_ORDER: ResumeDiffKind[] = ['add', 'remove', 'update'];
const DOT_SIZE_PX = 18;

const KIND_BADGE: Record<ResumeDiffKind, string> = {
  add: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  remove: 'border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-300',
  update: 'border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[color:var(--color-primary)]',
};

function kindLabel(ta: ReturnType<typeof useTranslations<'Edit.aiModify'>>, kind: ResumeDiffKind) {
  if (kind === 'add') return ta('diffKindAdd');
  if (kind === 'remove') return ta('diffKindRemove');
  return ta('diffKindUpdate');
}

function DiffKindBadge({ kind, ta }: { kind: ResumeDiffKind; ta: ReturnType<typeof useTranslations<'Edit.aiModify'>> }) {
  return (
    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${KIND_BADGE[kind]}`}>
      {kindLabel(ta, kind)}
    </span>
  );
}

function DiffValueBox({
  value,
  display,
  variant,
}: {
  value: unknown;
  display: string;
  variant: 'old' | 'new' | 'add' | 'remove';
}) {
  const html = typeof value === 'string' && looksLikeRichHtml(value) ? value : '';
  const boxCls =
    variant === 'old' || variant === 'remove'
      ? 'border-rose-200/80 bg-rose-50/90 dark:border-rose-500/25 dark:bg-rose-500/[0.08]'
      : 'border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--editor-shell-panel-strong))]';
  const strike = variant === 'old' || variant === 'remove';
  if (html) {
    return (
      <div className={`break-words rounded-lg border px-2.5 py-2 text-[12px] leading-relaxed text-fg/90 ${boxCls}${strike ? ' opacity-90' : ''}`}>
        <RichHtmlOrText value={html} plainClassName='text-[12px] leading-relaxed text-fg/90' />
      </div>
    );
  }
  return (
    <div className={`break-words rounded-lg border px-2.5 py-2 text-[12px] leading-relaxed ${boxCls} ${strike ? 'text-fg/65 line-through decoration-fg/35' : 'text-fg/90'}`}>
      {display}
    </div>
  );
}

function TimelineDot({ kind }: { kind: 'minus' | 'plus' }) {
  const cls =
    kind === 'minus'
      ? 'border-rose-200 bg-rose-400 text-white dark:border-rose-500/40 dark:bg-rose-500'
      : 'border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] bg-[var(--color-primary)] text-white';
  return (
    <span
      className={`relative z-[1] flex shrink-0 items-center justify-center rounded-full border shadow-sm ${cls}`}
      style={{ width: DOT_SIZE_PX, height: DOT_SIZE_PX }}
    >
      {kind === 'minus' ? <MinusOutlined className='text-[9px]' /> : <PlusOutlined className='text-[9px]' />}
    </span>
  );
}

const ROW_GAP_PX = 12;
const RAIL_INDENT_PX = DOT_SIZE_PX + 10;
const itemActionRowClass = 'mt-3 flex min-h-7 flex-wrap items-center gap-2';
const itemActionBtnPrimaryClass =
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-primary px-3 text-[12px] font-medium leading-none text-white outline-none transition-[filter] hover:brightness-110 active:brightness-95';
const itemActionBtnSecondaryClass =
  'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-fg/[0.12] bg-surface/[0.05] px-3 text-[12px] font-medium leading-none text-fg/78 outline-none transition-colors hover:border-fg/[0.2] hover:bg-surface/[0.1]';
const itemStatusRowClass = 'mt-3 flex h-7 items-center';
const itemStatusAppliedClass = 'text-[12px] font-medium leading-none text-[color:var(--color-primary)]';
const itemStatusCancelledClass = 'text-[12px] leading-none text-fg/48';
const batchActionBtnClass =
  'flex h-8 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-primary text-[12px] font-semibold leading-none text-white outline-none shadow-[var(--panel-shadow-primary-glow)] transition-[filter] hover:brightness-110 active:brightness-95';
const batchStatusRowClass = 'flex h-8 items-center';
const batchStatusClass = 'text-[12px] leading-none text-fg/52';

function DiffTimeline({
  rows,
}: {
  rows: Array<{ kind: 'minus' | 'plus'; label: string; labelCls: string; body: ReactNode }>;
}) {
  const multi = rows.length > 1;
  return (
    <div className='relative flex flex-col' style={{ gap: multi ? ROW_GAP_PX : 0 }}>
      {multi ? (
        <div
          className='pointer-events-none absolute w-px bg-fg/[0.14]'
          style={{
            left: DOT_SIZE_PX / 2,
            top: DOT_SIZE_PX / 2,
            height: `calc(100% - ${DOT_SIZE_PX}px)`,
          }}
        />
      ) : null}
      {rows.map((row) => (
        <div key={row.kind + row.label}>
          <div className='flex items-center gap-2.5'>
            <TimelineDot kind={row.kind} />
            <div className={`text-[11px] leading-none ${row.labelCls}`}>{row.label}</div>
          </div>
          <div className='mt-1.5' style={{ paddingLeft: RAIL_INDENT_PX }}>
            {row.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModifyDiffBubble({
  content,
  diffs,
  visibleCount,
  resolved,
  appliedIds,
  cancelledIds,
  onApplyOne,
  onCancelOne,
  onApplyBatch,
}: ModifyDiffBubbleProps) {
  const ta = useTranslations('Edit.aiModify');
  const appliedSet = useMemo(() => new Set(appliedIds ?? []), [appliedIds]);
  const cancelledSet = useMemo(() => new Set(cancelledIds ?? []), [cancelledIds]);
  const visibleDiffs = useMemo(
    () => (visibleCount === undefined ? diffs : diffs.slice(0, visibleCount)),
    [diffs, visibleCount],
  );
  const revealing = visibleCount !== undefined && visibleCount < diffs.length;
  const sortedDiffs = useMemo(
    () => [...visibleDiffs].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)),
    [visibleDiffs],
  );
  const pendingIds = useMemo(
    () => diffs.filter((d) => !appliedSet.has(d.id) && !cancelledSet.has(d.id)).map((d) => d.id),
    [diffs, appliedSet, cancelledSet],
  );
  const showBatch = !resolved && !revealing && pendingIds.length > 0;

  return (
    <div className='flex flex-col gap-2.5'>
      {content.trim() ? (
        <RichHtmlOrText value={content} plainClassName='whitespace-pre-wrap text-[13px] leading-[1.55] text-fg/84' />
      ) : null}
      {diffs.length > 0 ? (
        <>
          <ul className='space-y-3'>
            {sortedDiffs.map((d) => {
              const isApplied = appliedSet.has(d.id);
              const isCancelled = cancelledSet.has(d.id);
              const itemPending = !resolved && !isApplied && !isCancelled;
              return (
                <li key={d.id} className='rounded-xl border border-fg/[0.08] bg-surface/[0.04] px-3 py-2.5'>
                    <div className='mb-2.5 flex min-w-0 flex-wrap items-center gap-1.5'>
                      <DiffKindBadge kind={d.kind} ta={ta} />
                      <span className='min-w-0 text-[11px] font-medium text-fg/72'>{d.label}</span>
                    </div>
                    {d.kind === 'add' ? (
                      <DiffTimeline
                        rows={[{
                          kind: 'plus',
                          label: ta('diffNew'),
                          labelCls: 'text-[color:var(--color-primary)]/80',
                          body: <DiffValueBox value={d.newValue} display={d.newDisplay} variant='new' />,
                        }]}
                      />
                    ) : d.kind === 'remove' ? (
                      <DiffTimeline
                        rows={[{
                          kind: 'minus',
                          label: ta('diffOld'),
                          labelCls: 'text-rose-600/75 dark:text-rose-300/75',
                          body: <DiffValueBox value={d.oldValue} display={d.oldDisplay} variant='remove' />,
                        }]}
                      />
                    ) : (
                      <DiffTimeline
                        rows={[
                          {
                            kind: 'minus',
                            label: ta('diffOld'),
                            labelCls: 'text-fg/45',
                            body: <DiffValueBox value={d.oldValue} display={d.oldDisplay} variant='old' />,
                          },
                          {
                            kind: 'plus',
                            label: ta('diffNew'),
                            labelCls: 'text-[color:var(--color-primary)]/80',
                            body: <DiffValueBox value={d.newValue} display={d.newDisplay} variant='new' />,
                          },
                        ]}
                      />
                    )}
                    {itemPending ? (
                      <div className={itemActionRowClass}>
                        <button type='button' onClick={() => onApplyOne(d.id)} className={itemActionBtnPrimaryClass}>
                          {ta('diffApplyOne')}
                        </button>
                        <button type='button' onClick={() => onCancelOne(d.id)} className={itemActionBtnSecondaryClass}>
                          {ta('diffCancelOne')}
                        </button>
                      </div>
                    ) : isApplied ? (
                      <div className={itemStatusRowClass}>
                        <p className={itemStatusAppliedClass}>{ta('diffItemApplied')}</p>
                      </div>
                    ) : isCancelled ? (
                      <div className={itemStatusRowClass}>
                        <p className={itemStatusCancelledClass}>{ta('diffItemCancelled')}</p>
                      </div>
                    ) : null}
                  </li>
              );
            })}
          </ul>
          {revealing ? (
            <p className='flex items-center gap-1.5 text-[11px] text-fg/48'>
              <span className='size-1.5 animate-pulse rounded-full bg-[var(--color-primary)]/60' />
              {ta('diffRevealing')}
            </p>
          ) : null}
          {showBatch ? (
            <>
              <p className='flex items-start gap-1.5 text-[11px] leading-relaxed text-fg/52'>
                <BulbOutlined className='mt-0.5 shrink-0 text-[color:var(--color-primary)]' />
                {ta('diffHighlightHint')}
              </p>
              <button type='button' onClick={onApplyBatch} className={batchActionBtnClass}>
                {ta('diffApplyBatch', { n: pendingIds.length })}
              </button>
            </>
          ) : resolved ? (
            <div className={batchStatusRowClass}>
              <p className={batchStatusClass}>
                {resolved === 'applied' ? ta('diffAppliedHint') : ta('diffCancelledHint')}
              </p>
            </div>
          ) : null}
        </>
      ) : content.trim() ? null : (
        <p className='text-[12px] text-fg/58'>{ta('diffEmpty')}</p>
      )}
    </div>
  );
}

export default memo(ModifyDiffBubble);
