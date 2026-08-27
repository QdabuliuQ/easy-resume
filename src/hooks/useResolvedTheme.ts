'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
  type ResolvedTheme,
} from '@/lib/themeStore';

export function useResolvedTheme(): ResolvedTheme {
  const snap = useSyncExternalStore(subscribeAppTheme, getThemeSnapshot, getServerThemeSnapshot);
  return snap.split('|')[1] as ResolvedTheme;
}
