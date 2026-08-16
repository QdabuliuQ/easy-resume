'use client';
import Image from 'next/image';
import { photo3, photo3Light } from '@/lib/brandAssets';
import { useSyncExternalStore } from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
} from '@/lib/themeStore';

export type PanelHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  chip: string;
  className?: string;
};

const PANEL_HERO_CLASS =
  'relative mb-4 overflow-hidden rounded-[16px] border border-fg/[0.08] px-4 py-4 text-fg shadow-[0_18px_42px_rgba(0,0,0,0.14)]';

export default function PanelHero({ eyebrow, title, description, chip, className }: PanelHeroProps) {
  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];

  return (
    <div className={`${PANEL_HERO_CLASS}${className ? ` ${className}` : ''}`}>
      <Image
        src={appTheme === 'dark' ? photo3 : photo3Light}
        alt=''
        fill
        sizes='(max-width: 768px) 100vw, 720px'
        className='pointer-events-none object-cover object-right'
        loading='lazy'
      />
      <div className='relative z-[1] flex items-start justify-between gap-3'>
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
