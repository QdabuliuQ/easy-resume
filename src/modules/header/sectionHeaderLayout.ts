/** 模块标题行统一高度（画布 / 设置预览 / PDF·PNG 导出，PDF 见 sectionHeaderHtml.ts） */
export const SECTION_HEADER_ROW_HEIGHT_PX = 27;

export const sectionHeaderRowHeightStyle = {
  minHeight: SECTION_HEADER_ROW_HEIGHT_PX,
  height: SECTION_HEADER_ROW_HEIGHT_PX,
  boxSizing: 'border-box' as const,
};

export function sectionHeaderRowHeightCss(): string {
  return `min-height:${SECTION_HEADER_ROW_HEIGHT_PX}px;height:${SECTION_HEADER_ROW_HEIGHT_PX}px;box-sizing:border-box;`;
}
