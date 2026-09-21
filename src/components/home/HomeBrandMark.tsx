import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { logo } from '@/lib/brandAssets';
import { homeFocusRing } from '@/lib/home/homeA11y';

export default async function HomeBrandMark({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  return (
    <Link
      href='/'
      prefetch={false}
      aria-label={t('navHome')}
      className={`flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg ${homeFocusRing}`}
    >
      <span className='relative inline-flex h-9 w-9 shrink-0 sm:h-10 sm:w-10'>
        <Image src={logo} alt={t('logoAlt')} fill sizes='40px' className='object-contain p-0.5' priority />
      </span>
      <span className='min-w-0 truncate leading-tight'>
        <span className='block truncate text-[13px] font-semibold tracking-[0.12em] text-fg/90 sm:text-sm'>
          {t('brandName')}
        </span>
        <span className='block truncate text-[10px] font-medium tracking-[0.08em] text-fg/58 sm:text-[11px]'>
          {locale === 'zh' ? 'EasyResume' : '青松简历'}
        </span>
      </span>
    </Link>
  );
}
