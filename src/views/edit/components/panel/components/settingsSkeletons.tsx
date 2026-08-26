const PAGE_SECTION_SHELL =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';
const pulse = 'animate-pulse bg-fg/[0.07] motion-reduce:animate-none';
function FieldSkeleton({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <div className={`mb-2 h-3 w-14 rounded-md ${pulse}`} />
      <div className={`h-8 rounded-lg ${pulse}`} />
    </div>
  );
}
function ColorFieldSkeleton() {
  return (
    <div>
      <div className={`mb-2 h-3 w-16 rounded-md ${pulse}`} />
      <div className={`h-8 w-24 rounded-lg ${pulse}`} />
    </div>
  );
}
export function PageSettingsSkeleton() {
  return (
    <div className='flex flex-col gap-5' aria-hidden>
      <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative`}>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FieldSkeleton fullWidth />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <ColorFieldSkeleton />
          <ColorFieldSkeleton />
        </div>
      </div>
      <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative`}>
        <div className={`mb-3 h-3.5 w-20 rounded-md ${pulse}`} />
        <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className='rounded-xl border border-fg/[0.08] bg-fg/[0.02] p-2.5'>
              <div className={`mb-2 h-3 w-12 rounded-md ${pulse}`} />
              <div className={`h-10 rounded-md ${pulse}`} style={{ animationDelay: `${i * 60}ms` }} />
            </div>
          ))}
        </div>
      </div>
      <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative`}>
        <div className={`mb-3 h-3.5 w-16 rounded-md ${pulse}`} />
        <div className={`h-20 rounded-xl ${pulse}`} />
      </div>
    </div>
  );
}
export function GeneralSettingsSkeleton() {
  return (
    <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative space-y-3`} aria-hidden>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <div className={`h-3 w-20 rounded-md ${pulse}`} />
          <div className={`h-5 w-16 rounded-full ${pulse}`} />
        </div>
        <div className='flex min-h-[46px] items-center gap-3 rounded-xl border border-fg/[0.08] bg-fg/[0.02] px-3 py-2.5'>
          <div className={`h-9 w-9 shrink-0 rounded-lg ${pulse}`} />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <div className={`h-4 w-[58%] rounded-md ${pulse}`} />
            <div className={`h-3 w-[72%] rounded-md ${pulse}`} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>
      <div className={`h-12 rounded-lg ${pulse}`} />
    </div>
  );
}
function ModuleNavSkeleton() {
  return (
    <section className='sticky top-[-1px] z-[1] overflow-hidden rounded-[20px] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.11),rgb(var(--panel-surface-rgb)/0.05))] px-4 pt-3 shadow-[var(--panel-shadow-lg)] backdrop-blur-md ui-hint-shimmer relative'>
      <div className='flex gap-2 overflow-hidden pb-3.5'>
        {[72, 88, 64, 96, 80].map((w, i) => (
          <div
            key={i}
            className={`h-8 shrink-0 rounded-full ${pulse}`}
            style={{ width: w, animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
function ModuleEmptySkeleton() {
  return (
    <div className='overflow-hidden rounded-[20px] border border-fg/[0.08] ui-hint-shimmer relative'>
      <div className={`aspect-[1915/821] w-full ${pulse}`} style={{ opacity: 0.35 }} />
    </div>
  );
}
export function ResumeEditPanelSkeleton() {
  return (
    <div className='flex flex-col gap-5' aria-hidden>
      <ModuleNavSkeleton />
      <ModuleEmptySkeleton />
    </div>
  );
}
export function ModulePanelSkeleton() {
  return (
    <div className='[&_.ant-form-item]:!mb-2.5' aria-hidden>
      <div className='panel-module-head ui-hint-shimmer relative'>
        <div className='panel-module-head-main'>
          <div className='panel-module-icon'>
            <div className={`size-4 rounded-full ${pulse}`} />
          </div>
          <div className='ml-[10px] flex min-w-0 flex-1 items-center gap-1.5'>
            <div className={`h-[15px] w-24 rounded ${pulse}`} />
            <div className={`size-3.5 rounded ${pulse}`} style={{ opacity: 0.55 }} />
          </div>
        </div>
        <div className='panel-toolbar-btn pointer-events-none border-0 p-0'>
          <div className={`size-[15px] rounded ${pulse}`} />
        </div>
      </div>
      <div className='panel-add-btn pointer-events-none border border-fg/[0.08] bg-fg/[0.06] shadow-none'>
        <div className={`size-[17px] rounded ${pulse}`} />
        <div className={`h-3.5 w-28 rounded ${pulse}`} />
      </div>
      <div className='panel-item-shell ui-hint-shimmer relative'>
        <div className='grid grid-cols-2 gap-x-[15px]'>
          <ModuleFormFieldSkeleton />
          <ModuleFormFieldSkeleton />
          <ModuleFormFieldSkeleton />
          <ModuleFormFieldSkeleton />
          <ModuleFormFieldSkeleton fullWidth />
          <ModuleRichTextSkeleton />
        </div>
      </div>
    </div>
  );
}
function ModuleFormFieldSkeleton({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-2' : undefined}>
      <div className='mb-[5px] flex h-[30px] items-center'>
        <div className={`mr-[7px] size-[15px] shrink-0 rounded-sm ${pulse}`} />
        <div className={`h-3 w-10 rounded ${pulse}`} />
      </div>
      <div className={`mb-2.5 h-8 w-full rounded-md ${pulse}`} />
    </div>
  );
}
function ModuleRichTextSkeleton() {
  return (
    <div className='col-span-2'>
      <div className='mb-[5px] flex h-[30px] items-center'>
        <div className={`mr-[7px] size-[15px] shrink-0 rounded-sm ${pulse}`} />
        <div className={`h-3 w-14 rounded ${pulse}`} />
      </div>
      <div className='mb-2.5 overflow-hidden rounded-md border border-fg/[0.08] bg-fg/[0.02]'>
        <div className={`h-9 border-b border-fg/[0.06] ${pulse}`} style={{ opacity: 0.85 }} />
        <div className={`h-32 ${pulse}`} style={{ opacity: 0.55 }} />
      </div>
    </div>
  );
}
const AI_PANEL_SHELL =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.07)_0%,rgb(var(--panel-surface-rgb)/0.02)_100%)]';
const AI_MODIFY_SHELL =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';
const AI_INTERVIEW_SHELL =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.08)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%)]';
const AI_INTERVIEW_SETTINGS_SHELL =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)] md:p-5';
export function AiScoreSkeleton() {
  return (
    <div className='relative flex h-full min-h-0 flex-col' aria-hidden>
      <div className='min-h-0 flex-1 overflow-auto pb-3'>
        <section className={`${AI_PANEL_SHELL} ui-hint-shimmer relative px-4 pb-4 pt-4`}>
          <div className='flex items-start justify-between gap-3'>
            <div className={`h-4 w-28 rounded ${pulse}`} />
            <div className='flex gap-1.5'>
              <div className={`h-5 w-12 rounded-full ${pulse}`} />
              <div className={`h-5 w-12 rounded-full ${pulse}`} style={{ opacity: 0.75 }} />
            </div>
          </div>
          <div className={`mt-3 h-4 w-20 rounded ${pulse}`} />
          <div className={`mt-1 h-3 w-40 rounded ${pulse}`} style={{ opacity: 0.65 }} />
          <div className='mx-auto mt-4 aspect-square w-full max-w-[220px] rounded-full border border-fg/[0.06] p-3'>
            <div className={`h-full w-full rounded-full ${pulse}`} style={{ opacity: 0.4 }} />
          </div>
          <div className='mt-4 grid grid-cols-2 gap-2.5'>
            {[0, 1].map((i) => (
              <div key={i} className='rounded-2xl border border-fg/[0.08] px-3 py-3'>
                <div className={`h-9 w-9 rounded-full ${pulse}`} />
                <div className={`mt-2.5 h-3 w-16 rounded ${pulse}`} />
                <div className={`mt-1 h-6 w-10 rounded ${pulse}`} style={{ opacity: 0.8 }} />
              </div>
            ))}
          </div>
        </section>
        <div className={`${AI_PANEL_SHELL} ui-hint-shimmer relative mt-3 px-4 py-3`}>
          <div className={`h-4 w-32 rounded ${pulse}`} />
          <div className={`mt-3 h-20 rounded-xl ${pulse}`} style={{ opacity: 0.55 }} />
        </div>
      </div>
      <div className='shrink-0 border-t border-fg/[0.06] bg-[linear-gradient(180deg,transparent,rgb(var(--panel-surface-rgb)/0.04))] px-1 pt-3'>
        <div className={`h-11 w-full rounded-xl ${pulse}`} style={{ opacity: 0.45 }} />
      </div>
    </div>
  );
}
export function AiModifySkeleton() {
  return (
    <div className={`${AI_MODIFY_SHELL} ui-hint-shimmer relative`} aria-hidden>
      <div className='flex min-h-0 flex-1 flex-col items-center overflow-hidden px-8 pb-3 pt-2'>
        <div
          className={`aspect-square w-[min(220px,72%)] shrink-0 rounded-2xl ${pulse}`}
          style={{ opacity: 0.35 }}
        />
        <div className={`mt-4 h-4 w-44 rounded ${pulse}`} />
        <div className={`mt-2 h-3 w-56 max-w-full rounded ${pulse}`} style={{ opacity: 0.6 }} />
        <div className='my-4 flex w-full items-center gap-2.5'>
          <span className='h-px flex-1 bg-fg/[0.08]' aria-hidden />
          <div className={`h-3 w-14 shrink-0 rounded ${pulse}`} />
          <span className='h-px flex-1 bg-fg/[0.08]' aria-hidden />
        </div>
        <ul className='flex w-full flex-col gap-2'>
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className='flex items-center gap-2.5 rounded-xl border border-fg/[0.08] bg-surface/[0.02] px-3 py-2.5'
            >
              <div className={`size-8 shrink-0 rounded-lg ${pulse}`} />
              <div
                className={`h-3 flex-1 rounded ${pulse}`}
                style={{ maxWidth: `${72 - i * 6}%`, opacity: 0.85 - i * 0.08 }}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className='shrink-0 border-t border-fg/[0.06] bg-[var(--panel-inset-bg)] p-3'>
        <div className='flex items-end gap-2'>
          <div className={`h-[70px] flex-1 rounded-xl ${pulse}`} />
          <div className={`h-10 w-10 shrink-0 rounded-xl ${pulse}`} />
          <div className={`h-10 w-16 shrink-0 rounded-xl ${pulse}`} style={{ opacity: 0.85 }} />
        </div>
      </div>
    </div>
  );
}
export function AiInterviewSkeleton() {
  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden' aria-hidden>
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5'>
        <div className='mx-auto flex w-full max-w-[720px] flex-col gap-5'>
          <div className='relative overflow-hidden rounded-[16px] border border-fg/[0.08] px-4 py-4 ui-hint-shimmer'>
            <div className={`h-3 w-16 rounded ${pulse}`} />
            <div className={`mt-1 h-5 w-24 rounded ${pulse}`} />
            <div className={`mt-1 h-3 w-full max-w-[280px] rounded ${pulse}`} style={{ opacity: 0.6 }} />
            <div className={`absolute right-4 top-4 h-6 w-14 rounded-full ${pulse}`} />
          </div>
          <section className={`${AI_INTERVIEW_SHELL} ui-hint-shimmer relative p-4 md:p-5`}>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <div className={`h-4 w-16 rounded ${pulse}`} />
              <div className={`h-3 w-24 rounded ${pulse}`} style={{ opacity: 0.6 }} />
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-[62px] rounded-xl border border-fg/[0.08] ${pulse}`}
                  style={{ opacity: 0.5 }}
                />
              ))}
            </div>
          </section>
          <section className={`${AI_INTERVIEW_SETTINGS_SHELL} ui-hint-shimmer relative`}>
            <div className='mb-4 flex items-end justify-between gap-3'>
              <div>
                <div className={`h-3 w-14 rounded ${pulse}`} />
                <div className={`mt-1 h-4 w-20 rounded ${pulse}`} />
              </div>
              <div className={`h-3 w-16 rounded ${pulse}`} style={{ opacity: 0.6 }} />
            </div>
            <div className='space-y-5'>
              <div>
                <div className='mb-2.5 flex justify-between gap-2'>
                  <div className={`h-3 w-10 rounded ${pulse}`} />
                  <div className={`h-3 w-28 rounded ${pulse}`} style={{ opacity: 0.55 }} />
                </div>
                <div className='grid grid-cols-6 gap-1.5 rounded-xl bg-fg/[0.035] p-1.5'>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-10 rounded-lg ${pulse}`} style={{ opacity: 0.55 + i * 0.03 }} />
                  ))}
                </div>
              </div>
              <div>
                <div className='mb-2.5 flex justify-between gap-2'>
                  <div className={`h-3 w-10 rounded ${pulse}`} />
                  <div className={`h-3 w-32 rounded ${pulse}`} style={{ opacity: 0.55 }} />
                </div>
                <div className={`h-12 rounded-xl ${pulse}`} style={{ opacity: 0.45 }} />
              </div>
            </div>
          </section>
          <div className='flex justify-end'>
            <div className={`h-11 w-[140px] rounded-xl ${pulse}`} style={{ opacity: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
const TEMPLATE_CARD_SHELL =
  'flex w-full flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.055)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),var(--panel-layer-deep)] shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-card-tight)]';
function TemplateCardSkeleton() {
  return (
    <li className='min-w-0'>
      <div className={TEMPLATE_CARD_SHELL}>
        <div className='flex items-center justify-between gap-2 border-b border-fg/[0.06] bg-surface/[0.03] px-3 py-2'>
          <div className={`h-5 w-10 rounded-full ${pulse}`} />
          <div className={`h-4 w-24 rounded ${pulse}`} style={{ opacity: 0.85 }} />
        </div>
        <div className='flex justify-center overflow-hidden bg-[rgb(var(--surface-fg-rgb)/0.04)] py-4'>
          <div className={`h-[160px] w-[115px] rounded-md ${pulse}`} style={{ opacity: 0.45 }} />
        </div>
        <div className='flex items-center gap-2 border-t border-fg/[0.06] px-3 py-2'>
          <div className={`h-7 flex-1 rounded-md ${pulse}`} />
          <div className={`h-7 flex-1 rounded-md ${pulse}`} style={{ opacity: 0.85 }} />
        </div>
      </div>
    </li>
  );
}
function ResumeCardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      {Array.from({ length: count }, (_, i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </ul>
  );
}
export function ResumeTemplateSkeleton() {
  return (
    <div
      className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 ui-hint-shimmer'
      aria-hidden
    >
      <ResumeCardsGridSkeleton count={4} />
    </div>
  );
}
export function MyResumesSkeleton({ withProfile = true }: { withProfile?: boolean }) {
  return (
    <div className='space-y-3' aria-hidden>
      {withProfile ? (
        <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative flex items-center gap-3`}>
          <div className={`h-11 w-11 shrink-0 rounded-full ${pulse}`} />
          <div className='min-w-0 flex-1'>
            <div className={`h-4 w-28 rounded ${pulse}`} />
            <div className={`mt-1.5 h-3 w-20 rounded ${pulse}`} style={{ opacity: 0.6 }} />
          </div>
        </div>
      ) : null}
      <div className={`${PAGE_SECTION_SHELL} ui-hint-shimmer relative space-y-3`}>
        <div className='flex items-center justify-between gap-2'>
          <div className={`h-3 w-24 rounded ${pulse}`} />
          <div className={`h-3 w-12 rounded ${pulse}`} style={{ opacity: 0.6 }} />
        </div>
        <ResumeCardsGridSkeleton count={3} />
      </div>
    </div>
  );
}
