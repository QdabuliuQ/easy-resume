'use client';
import { Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
export default memo(function Loading() {
  const t = useTranslations('Loading');
  return (
    <div className='absolute left-0 top-0 z-[999] flex h-screen w-screen items-center justify-center bg-white'>
      <div className='flex flex-col items-center'>
        <Spin size='large' />
        <span className='mt-2.5 text-[15px]'>{t('text')}</span>
      </div>
    </div>
  );
});
