/** 基础信息（info1）模块固定排在最前 */
export function pinInfo1ModulesFirst<T extends { type?: string }>(
  modules: T[],
): T[] {
  const info1: T[] = [];
  const rest: T[] = [];
  for (const m of modules) {
    if (m?.type === 'info1') info1.push(m);
    else rest.push(m);
  }
  return [...info1, ...rest];
}
