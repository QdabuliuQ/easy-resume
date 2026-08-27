'use client';

import { useSyncExternalStore } from 'react';

function subscribeReduceMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerReduceMotion() {
  return false;
}

export function useReduceMotion() {
  return useSyncExternalStore(subscribeReduceMotion, getReduceMotion, getServerReduceMotion);
}
