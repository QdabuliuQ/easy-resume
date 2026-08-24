export type PdfkitTextRun = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  letterSpacing: number;
  /** CSS font-family，Word 写 eastAsia 用；缺省则回退雅黑 */
  fontFamily?: string;
  /** CanvasRenderingContext2D.measureText() 的字体实际边界，单位 CSS px */
  textWidth?: number;
  textAscent?: number;
  textDescent?: number;
  /** 位于模块 header 内；DOCX 使用 DOM 原始坐标，不套正文基线修正 */
  isHeader?: boolean;
  /** info1 字段：DOCX 按同一行合并为一个可编辑文本框 */
  isInfo1?: boolean;
  /** info1 行容器的真实页面盒，DOCX 用它定位整行 Frame */
  info1LineId?: string;
  info1LineX?: number;
  info1LineY?: number;
  info1LineW?: number;
  info1LineH?: number;
  info1LineAlign?: 'left' | 'center' | 'right';
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  href?: string;
};

export type PdfkitImageRun = {
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string;
};

export type PdfkitFillRun = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  radius?: number;
};

export type PdfkitDisc = {
  cx: number;
  cy: number;
  r: number;
  color: string;
};

export type PdfkitPage = {
  width: number;
  height: number;
  background: string;
  runs: PdfkitTextRun[];
  images: PdfkitImageRun[];
  fills?: PdfkitFillRun[];
  discs?: PdfkitDisc[];
};

export type PdfkitExportPayload = {
  font: string;
  pages: PdfkitPage[];
  filename?: string;
};
