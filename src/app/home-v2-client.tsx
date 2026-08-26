'use client';

import dynamic from 'next/dynamic';

const TemplatePhysicsDrop = dynamic(() => import('@/components/home/v2/TemplatePhysicsDrop'), {
  ssr: false,
  loading: () => <div className='absolute inset-0 bg-[var(--editor-shell-bg)]' aria-hidden />,
});

export default function HomeV2Client() {
  return (
    <main className='relative h-[100dvh] overflow-hidden bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <TemplatePhysicsDrop />
    </main>
  );
}
