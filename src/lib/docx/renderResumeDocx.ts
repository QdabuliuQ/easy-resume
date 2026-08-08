import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { formatResumeDateRange } from '@/utils/resumeDateDisplay';
import { normalizeResumeCityDisplay } from '@/utils/resumeCityDisplay';
import { formatIntentCityDisplay } from '@/utils/resumeCityDisplay';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { resumeFontForExport, resumePrimaryFontFamily } from '@/lib/resumeFont';

type ResumeModule = { type?: string; id?: string; options?: Record<string, unknown> };
type ResumeConfig = {
  name?: string;
  globalStyle?: Record<string, unknown>;
  pages?: Array<{ modules?: ResumeModule[] }>;
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
}

function items(options: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(options.items)
    ? options.items.filter((v): v is Record<string, unknown> => Boolean(v && typeof v === 'object'))
    : [];
}

function richText(value: unknown): Array<{ text: string; bullet: boolean }> {
  const html = text(value);
  if (!html) return [];
  const listItems = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m) =>
    ({ text: m[1]!.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), bullet: true }),
  );
  if (listItems.length) return listItems;
  return [{
    text: html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(),
    bullet: false,
  }];
}

function bodyParagraph(value: unknown, font: string, size: number, line: number, color: string) {
  return richText(value).map(
    ({ text: lineText, bullet }) =>
      new Paragraph({
        text: lineText,
        bullet: bullet ? { level: 0 } : undefined,
        indent: bullet ? { left: 360, hanging: 180 } : undefined,
        spacing: { after: bullet ? 40 : 60, line },
        style: 'Normal',
        run: { font, size, color },
      }),
  );
}

function metaTable(left: string, right: string, font: string, size: number, color: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 7000, type: WidthType.DXA },
            children: [new Paragraph({ text: left, style: 'Normal', run: { font, size, color, bold: true } })],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 2360, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ text: right, alignment: AlignmentType.RIGHT, style: 'Normal', run: { font, size, color } })],
          }),
        ],
      }),
    ],
  });
}

function infoValue(key: string, options: Record<string, unknown>): string {
  const value = options[key];
  if (key === 'expectedSalary' && Array.isArray(value)) {
    return `${text(value[0])} - ${text(value[1])}`.trim();
  }
  if (key === 'city') {
    return normalizeResumeCityDisplay(Array.isArray(value) ? value.filter(Boolean).join('/') : text(value));
  }
  if (key === 'intentCity') return formatIntentCityDisplay(value);
  if (Array.isArray(value)) return value.filter(Boolean).map(text).join(' / ');
  return text(value);
}

function infoParagraph(
  keys: string[],
  options: Record<string, unknown>,
  font: string,
  size: number,
  line: number,
  color: string,
  align: (typeof AlignmentType)[keyof typeof AlignmentType],
) {
  const visible = keys.map((key) => infoValue(key, options)).filter(Boolean);
  if (!visible.length) return null;
  const children = visible.flatMap((value, index) => [
    ...(index ? [new TextRun({ text: ' | ', font, size, color })] : []),
    new TextRun({ text: value, font, size, color }),
  ]);
  return new Paragraph({ children, alignment: align, spacing: { after: 50, line }, style: 'Normal' });
}

function renderInfo1(
  options: Record<string, unknown>,
  font: string,
  size: number,
  line: number,
  color: string,
  image?: Buffer,
) {
  const position = options.position === 'center' ? 'center' : options.position === 'left' ? 'left' : 'right';
  const align = position === 'center' ? AlignmentType.CENTER : position === 'left' ? AlignmentType.LEFT : AlignmentType.RIGHT;
  const layout = Array.isArray(options.layout) ? options.layout : [];
  const textChildren: Paragraph[] = [
    new Paragraph({
      text: text(options.name),
      alignment: align,
      spacing: { after: 120 },
      run: { font, size: Math.round(size * 1.7), color, bold: true },
    }),
  ];
  for (const row of layout) {
    if (!Array.isArray(row)) continue;
    const paragraph = infoParagraph(row.filter((key): key is string => typeof key === 'string'), options, font, size, line, color, align);
    if (paragraph) textChildren.push(paragraph);
  }

  if (!image) return textChildren;
  const avatar = new ImageRun({
    data: image,
    type: imageType(text(options.avatar)),
    transformation: { width: 90, height: 126 },
  });
  const avatarCell = new TableCell({
    borders: noBorders,
    width: { size: 1200, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ children: [avatar], spacing: { after: 0 } })],
  });
  const textCell = new TableCell({
    borders: noBorders,
    width: { size: 8160, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    children: textChildren,
  });
  const cells = position === 'left' ? [avatarCell, textCell] : [textCell, avatarCell];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: cells })],
  });
}

function sectionTitle(title: string, font: string, size: number, color: string, headerType: number) {
  const centered = headerType === 2 || headerType === 9;
  const leftBar = headerType === 1;
  return new Paragraph({
    text: title,
    alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 180, after: 80, line: 240 },
    border: leftBar
      ? { left: { style: BorderStyle.SINGLE, size: 18, color } }
      : { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
    shading: leftBar ? { fill: color, color: color } : undefined,
    indent: leftBar ? { left: 180 } : undefined,
    run: { font, size: size + 2, color: leftBar ? 'FFFFFF' : color, bold: true },
  });
}

function renderModule(module: ResumeModule, font: string, size: number, line: number, color: string, headerType: number) {
  const o = module.options ?? {};
  const title = text(o.title);
  const out: (Paragraph | Table)[] = [];
  if (module.type === 'info1') return out;
  if (title) out.push(sectionTitle(title, font, size, color, headerType));
  const moduleItems = items(o);
  if (module.type === 'skill' || module.type === 'other') {
    out.push(...bodyParagraph(o.description, font, size, line, color));
  } else if (module.type === 'certificate') {
    for (const item of moduleItems) out.push(metaTable(text(item.name), text(item.date), font, size, color));
  } else if (module.type === 'education') {
    for (const item of moduleItems) {
      const school = text(item.school);
      const details = [text(item.major), text(item.degree), text(item.academy)].filter(Boolean).join(' · ');
      const date = formatResumeDateRange(text(item.startDate), text(item.endDate));
      out.push(metaTable(school, date, font, size, color));
      if (details) out.push(new Paragraph({ text: details, spacing: { after: 50, line }, run: { font, size, color } }));
      out.push(...bodyParagraph(item.description, font, size, line, color));
    }
  } else if (module.type === 'job') {
    for (const item of moduleItems) {
      const company = text(item.company);
      const date = formatResumeDateRange(text(item.startDate), text(item.endDate));
      out.push(metaTable(company, date, font, size, color));
      const cityValue = Array.isArray(item.city) ? item.city.join(' - ') : typeof item.city === 'string' ? item.city : '';
      const city = normalizeResumeCityDisplay(cityValue);
      const role = [text(item.post), text(item.department), city].filter(Boolean).join(' · ');
      if (role) out.push(new Paragraph({ text: role, spacing: { after: 50, line }, run: { font, size, color } }));
      out.push(...bodyParagraph(item.description, font, size, line, color));
    }
  } else if (module.type === 'project') {
    for (const item of moduleItems) {
      out.push(metaTable(text(item.name), formatResumeDateRange(text(item.startDate), text(item.endDate)), font, size, color));
      if (text(item.role)) out.push(new Paragraph({ text: text(item.role), spacing: { after: 50, line }, run: { font, size, color } }));
      out.push(...bodyParagraph(item.description, font, size, line, color));
    }
  } else {
    const fallback = text(o.description) || Object.values(o).filter((v) => typeof v === 'string').join(' · ');
    out.push(...bodyParagraph(fallback, font, size, line, color));
  }
  return out;
}

async function fetchImage(src: string): Promise<Buffer | undefined> {
  if (!src) return undefined;
  try {
    if (src.startsWith('data:')) return Buffer.from(src.slice(src.indexOf(',') + 1), 'base64');
    const response = await fetch(src);
    if (!response.ok) return undefined;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return undefined;
  }
}

function imageType(src: string): 'jpg' | 'png' | 'gif' | 'bmp' {
  const mime = src.match(/^data:image\/(jpeg|jpg|png|gif|bmp);/i)?.[1]?.toLowerCase();
  const ext = src.split('?')[0]?.split('.').pop()?.toLowerCase();
  const value = mime ?? ext;
  if (value === 'jpeg' || value === 'jpg') return 'jpg';
  if (value === 'gif' || value === 'bmp') return value;
  return 'png';
}

export async function renderResumeDocx(config: ResumeConfig): Promise<Buffer> {
  const gs = config.globalStyle ?? {};
  const selectedFont = resumeFontForExport(gs.resumeFont);
  // Word 不一定安装网页端的 Noto 字体；系统字体优先选择常见中文字体，避免中文缺字。
  const font = selectedFont === 'noto-sans-sc' && gs.resumeFont === 'system'
    ? 'Microsoft YaHei'
    : resumePrimaryFontFamily(selectedFont);
  const size = Math.max(16, Math.round(Number(gs.fontSize) || 28));
  const line = Math.max(240, Math.round((Number(gs.lineHeight) || 1.5) * 240));
  const color = text(gs.color).replace('#', '') || '333333';
  const headerType = Math.max(1, Math.round(Number(gs.headerType) || 1));
  const dimensions = globalStylePageDimensions(gs);
  const info = config.pages?.flatMap((p) => p.modules ?? []).find((m) => m.type === 'info1');
  const infoOptions = info?.options ?? {};
  const children: (Paragraph | Table)[] = [];

  const avatar = await fetchImage(text(infoOptions.avatar));
  const infoBlock = renderInfo1(infoOptions, font, size, line, color, avatar);
  children.push(...(Array.isArray(infoBlock) ? infoBlock : [infoBlock]));
  children.push(new Paragraph({ spacing: { after: 100 } }));

  const pages = config.pages ?? [];
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex]!;
    if (pageIndex > 0) children.push(new Paragraph({ pageBreakBefore: true }));
    for (const module of page.modules ?? []) children.push(...renderModule(module, font, size, line, color, headerType));
  }

  const pageSize = dimensions.width === '210mm'
    ? { width: 11906, height: 16838 }
    : dimensions.width === '148mm'
      ? { width: 8391, height: 11906 }
      : dimensions.width === '297mm'
        ? { width: 16838, height: 23811 }
        : { width: 12240, height: 15840 };
  // 预览 padding 使用 px，Word 页面边距使用 twips（1px ≈ 15 twips @ 96dpi）。
  const pagePadding = Math.max(0, Math.round(Number(gs.padding) || 0) * 15);
  const document = new Document({
    styles: { default: { document: { run: { font }, paragraph: { spacing: { line } } } } },
    sections: [{
      properties: {
        page: { size: { width: pageSize.width, height: pageSize.height }, margin: { top: pagePadding, right: pagePadding, bottom: pagePadding, left: pagePadding } },
      },
      children,
    }],
  });
  return Packer.toBuffer(document);
}
