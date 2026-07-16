'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { AUTH_BASE_PATH } from '@/lib/authPaths';

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider basePath={AUTH_BASE_PATH}>{children}</SessionProvider>;
}
