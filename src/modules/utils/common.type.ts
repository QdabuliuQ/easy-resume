export interface GlobalStyle {
  /** 版心宽度，CSS 长度（如 `210mm`），与 PDF `@page` / `Page` 一致 */
  width: string;
  /** 版心高度，CSS 长度（如 `297mm`） */
  height: string;
  fontSize: number;
  lineHeight: number;
  horizontalMargin: number;
  verticalMargin: number;
  /** 每页容器 CSS padding（四边） */
  padding?: number;
  color: string;
  backgroundColor: string;
  /** 文档外框（对应 PDF/HTML 的 body 与画布页堆叠容器），0 为无边框 */
  bodyBorderWidth?: number;
  bodyBorderColor?: string;
}
