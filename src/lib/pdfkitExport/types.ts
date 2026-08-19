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
