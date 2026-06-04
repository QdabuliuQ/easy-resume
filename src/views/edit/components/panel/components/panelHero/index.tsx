export type PanelHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  chip: string;
};

const PANEL_HERO_CLASS =
  'mb-4 rounded-[20px] border border-fg/[0.14] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.11),rgb(var(--panel-surface-rgb)/0.05))] px-4 py-3 text-fg shadow-[0_18px_42px_rgba(0,0,0,0.14)]';

export default function PanelHero({ eyebrow, title, description, chip }: PanelHeroProps) {
  return (
    <div className={PANEL_HERO_CLASS}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-[11px] font-medium tracking-[0.18em] text-fg/62'>{eyebrow}</p>
          <h2 className='mt-1 text-[17px] font-semibold text-fg/95'>{title}</h2>
          <p className='mt-1 text-[12px] leading-relaxed text-fg/62'>{description}</p>
        </div>
        <div className='shrink-0 rounded-full border border-fg/[0.14] bg-surface/[0.08] px-3 py-1 text-[11px] font-semibold text-fg/68'>
          {chip}
        </div>
      </div>
    </div>
  );
}
