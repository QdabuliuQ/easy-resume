'use client';
import dynamic from 'next/dynamic';
import { observer } from 'mobx-react';
import { memo } from 'react';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';

const ResumeConfigCanvasPreviewHost = dynamic(
  () => import('./resumeConfigCanvasPreviewHost'),
  { ssr: false },
);

/** Only mount heavy preview host while overlay is open/closing. */
const ResumePreviewGate = observer(function ResumePreviewGate() {
  if (!resumePreviewStore.open && !resumePreviewStore.closing) return null;
  return <ResumeConfigCanvasPreviewHost />;
});

export default memo(ResumePreviewGate);
