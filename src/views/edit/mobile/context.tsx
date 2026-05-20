'use client';

import { createContext, useContext } from 'react';

const MobileEditContext = createContext(false);

export function MobileEditProvider({ children }: { children: React.ReactNode }) {
  return <MobileEditContext.Provider value>{children}</MobileEditContext.Provider>;
}

export function useMobileEdit() {
  return useContext(MobileEditContext);
}
