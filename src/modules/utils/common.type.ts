export interface GlobalStyle {
  /** 版心宽度，CSS 长度（如 `210mm`），与 PDF `@page` / `Page` 一致 */
  width: string;
  /** 版心高度，CSS 长度（如 `297mm`） */
  height: string;
  fontSize: number;
  lineHeight: number;
  /** 模块之间的垂直间距（px），全局统一 */
  moduleMargin: number;
  /** 每页容器 CSS padding（四边） */
  padding?: number;
  color: string;
  backgroundColor: string;
}
