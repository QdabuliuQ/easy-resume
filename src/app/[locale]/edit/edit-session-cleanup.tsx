'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { resetEditSessionState } from '@/mobx/resetEditSessionState';

export default function EditSessionCleanup({ children }: { children: ReactNode }) {
  useLayoutEffect(() => () => resetEditSessionState(), []);
  return children;
}
