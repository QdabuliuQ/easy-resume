/** Shallow-safe deep clone for plain JSON-like values (resume modules/options). */
export function clonePlain<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      /* DataCloneError for exotic values */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
