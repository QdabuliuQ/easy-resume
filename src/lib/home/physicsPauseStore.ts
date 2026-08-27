export type PhysicsPauseReason = 'offScreen' | 'hidden' | 'scrubbing' | 'expand';

const reasons = new Set<PhysicsPauseReason>();
const listeners = new Set<() => void>();

export function getPhysicsPaused() {
  return reasons.size > 0;
}

export function setPhysicsPause(reason: PhysicsPauseReason, paused: boolean) {
  if (paused) {
    if (reasons.has(reason)) return;
    reasons.add(reason);
  } else {
    if (!reasons.has(reason)) return;
    reasons.delete(reason);
  }
  listeners.forEach((l) => l());
}

export function subscribePhysicsPause(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function resetPhysicsPause() {
  if (reasons.size === 0) return;
  reasons.clear();
  listeners.forEach((l) => l());
}
