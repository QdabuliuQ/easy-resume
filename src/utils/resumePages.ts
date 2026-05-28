/** 按文档顺序扁平化所有模块（与画布分页遍历顺序一致） */
export function flattenModules(resume: any): any[] {
  const list: any[] = [];
  if (!resume?.pages?.length) return list;
  for (const p of resume.pages) {
    for (const m of p.modules ?? []) {
      list.push(m);
    }
  }
  return list;
}
