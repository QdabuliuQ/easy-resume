import {
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx';
import type { GlobalStyle } from '@/modules/utils/common.type';
import {
  formatIntentCityDisplay,
  normalizeResumeCityDisplay,
} from '@/utils/resumeCityDisplay';
import { plainTextFromRich } from './plainFromRich';

function fsHalf(gs: GlobalStyle): number {
  const n = Number(gs.fontSize);
  return Math.round((Number.isFinite(n) ? n : 13) * 2);
}

function appendRichParagraphs(
  out: Paragraph[],
  html: string,
  sizeHalf: number
): void {
  const plain = plainTextFromRich(html);
  if (!plain) return;
  for (const line of plain.split(/\n/)) {
    const t = line.trim();
    if (t)
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: t, size: sizeHalf })],
        })
      );
  }
}

function appendInfo1(
  out: Paragraph[],
  mod: { options: Record<string, unknown> },
  gs: GlobalStyle
): void {
  const opts = mod.options;
  const name = String(opts.name ?? '');
  const layout = (opts.layout as string[][]) ?? [];
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: name, bold: true, size: 56 })],
    })
  );
  for (let i = 0; i < layout.length; i++) {
    const row = layout[i];
    const runs: TextRun[] = [];
    for (let j = 0; j < row.length; j++) {
      const key = row[j];
      if (key === 'avatar' || key === 'name' || key === 'layout') continue;
      let segment = '';
      if (key === 'expectedSalary') {
        const arr = opts.expectedSalary as [unknown, unknown] | undefined;
        segment = `${arr?.[0] ?? ''} - ${arr?.[1] ?? ''}`;
      } else if (opts[key as keyof typeof opts] != null) {
        const val = opts[key as keyof typeof opts];
        segment =
          key === 'city'
            ? normalizeResumeCityDisplay(String(val))
            : key === 'intentCity'
              ? formatIntentCityDisplay(val as unknown)
              : String(val);
      }
      if (!segment) continue;
      if (runs.length)
        runs.push(
          new TextRun({ text: ' | ', size: sizeHalf, color: '999999' })
        );
      runs.push(new TextRun({ text: segment, size: sizeHalf }));
    }
    if (runs.length)
      out.push(
        new Paragraph({
          spacing: { after: i < layout.length - 1 ? 80 : 160 },
          children: runs,
        })
      );
  }
}

function appendCertificate(
  out: Paragraph[],
  mod: {
    options: { title: string; items: Array<{ name: string; date: string }> };
  },
  gs: GlobalStyle
): void {
  const { title, items } = mod.options;
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: title, bold: true })],
    })
  );
  for (const item of items) {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: item.name, size: sizeHalf }),
          new TextRun({ text: `    ${item.date}`, size: sizeHalf }),
        ],
      })
    );
  }
}

function appendSkillLike(
  out: Paragraph[],
  mod: { options: { title: string; description: string } },
  gs: GlobalStyle
): void {
  const { title, description } = mod.options;
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: title, bold: true })],
    })
  );
  appendRichParagraphs(out, description, sizeHalf);
}

function appendJob(
  out: Paragraph[],
  mod: { options: { title: string; items: Array<Record<string, string>> } },
  gs: GlobalStyle
): void {
  const { title, items } = mod.options;
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: title, bold: true })],
    })
  );
  items.forEach((item) => {
    const sub = [item.post, item.department].filter(Boolean).join(' ');
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${item.company ?? ''}    ${item.startDate ?? ''} - ${item.endDate ?? ''}`,
            bold: true,
            size: sizeHalf,
          }),
        ],
      })
    );
    if (sub || item.city) {
      const city = normalizeResumeCityDisplay(item.city ?? '');
      const line = [sub, city].filter(Boolean).join('    ');
      if (line)
        out.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: line, size: sizeHalf })],
          })
        );
    }
    const desc = item.description ?? '';
    if (plainTextFromRich(desc))
      appendRichParagraphs(
        out,
        desc,
        sizeHalf
      );
  });
}

function appendProject(
  out: Paragraph[],
  mod: { options: { title: string; items: Array<Record<string, string>> } },
  gs: GlobalStyle
): void {
  const { title, items } = mod.options;
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: title, bold: true })],
    })
  );
  items.forEach((item) => {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${item.name ?? ''}    ${item.startDate ?? ''} - ${item.endDate ?? ''}`,
            bold: true,
            size: sizeHalf,
          }),
        ],
      })
    );
    if (item.role)
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: item.role, size: sizeHalf })],
        })
      );
    const desc = item.description ?? '';
    if (plainTextFromRich(desc))
      appendRichParagraphs(
        out,
        desc,
        sizeHalf
      );
  });
}

function appendEducation(
  out: Paragraph[],
  mod: { options: { title: string; items: Array<Record<string, unknown>> } },
  gs: GlobalStyle
): void {
  const { title, items } = mod.options;
  const sizeHalf = fsHalf(gs);
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: title, bold: true })],
    })
  );
  items.forEach((item) => {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${String(item.school ?? '')}    ${String(item.startDate ?? '')} - ${String(item.endDate ?? '')}`,
            bold: true,
            size: sizeHalf,
          }),
        ],
      })
    );
    if (item.degree) {
      const line = `${String(item.major ?? '')} ${String(item.degree ?? '')} ${String(item.academy ?? '')}    ${normalizeResumeCityDisplay(String(item.city ?? ''))}`;
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: line.trim(), size: sizeHalf })],
        })
      );
    }
    const tags = (item.tags as string[]) ?? [];
    if (tags.length)
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: tags.join('、'), size: sizeHalf })],
        })
      );
    const desc = String(item.description ?? '');
    if (plainTextFromRich(desc))
      appendRichParagraphs(
        out,
        desc,
        sizeHalf
      );
  });
}

function appendModule(
  out: Paragraph[],
  mod: { type: string; options?: unknown },
  gs: GlobalStyle
): void {
  if (!mod?.options) return;
  switch (mod.type) {
    case 'info1':
      appendInfo1(out, mod as { options: Record<string, unknown> }, gs);
      break;
    case 'certificate':
      appendCertificate(
        out,
        mod as {
          options: {
            title: string;
            items: Array<{ name: string; date: string }>;
          };
        },
        gs
      );
      break;
    case 'skill':
    case 'other':
      appendSkillLike(
        out,
        mod as { options: { title: string; description: string } },
        gs
      );
      break;
    case 'job':
      appendJob(
        out,
        mod as { options: { title: string; items: Array<Record<string, string>> } },
        gs
      );
      break;
    case 'project':
      appendProject(
        out,
        mod as { options: { title: string; items: Array<Record<string, string>> } },
        gs
      );
      break;
    case 'education':
      appendEducation(
        out,
        mod as {
          options: { title: string; items: Array<Record<string, unknown>> };
        },
        gs
      );
      break;
    default:
      break;
  }
}

export async function resumeMergedToDocxBuffer(resume: {
  pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
  globalStyle: GlobalStyle;
}): Promise<Buffer> {
  const gs = resume.globalStyle;
  const pages = resume.pages ?? [];
  const children: Paragraph[] = [];
  for (let pi = 0; pi < pages.length; pi++) {
    if (pi > 0)
      children.push(new Paragraph({ children: [new PageBreak()] }));
    const mods = (pages[pi].modules ?? []) as Array<{
      type: string;
      options?: unknown;
    }>;
    for (const mod of mods) {
      appendModule(children, mod, gs);
    }
  }
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
