/** 姓名为模块主标题，行内字段标题不包含 name */
export function info1ShowsInlineFieldLabel(key: string, showTitle: boolean): boolean {
  return showTitle && key !== 'name';
}
