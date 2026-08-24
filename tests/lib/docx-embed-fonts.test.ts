// @vitest-environment node
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  docxFontKeyToBytes,
  embedFontsInDocx,
  obfuscateDocxFont,
} from '@/lib/docxExport/embedFonts';

describe('obfuscateDocxFont', () => {
  it('xors only the first 32 bytes with the fontKey', () => {
    const key = '{00112233-4455-6677-8899-AABBCCDDEEFF}';
    const font = new Uint8Array(40);
    for (let i = 0; i < 40; i += 1) font[i] = i;
    const out = obfuscateDocxFont(font, key);
    const kb = docxFontKeyToBytes(key);
    for (let i = 0; i < 32; i += 1) {
      expect(out[i]).toBe(font[i] ^ kb[i % 16]);
    }
    expect(out[32]).toBe(32);
    expect(out[39]).toBe(39);
  });
});

describe('embedFontsInDocx', () => {
  it('injects odttf and fontTable entries for the family', async () => {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: '嵌',
                  font: {
                    ascii: '月星楷',
                    hAnsi: '月星楷',
                    eastAsia: '月星楷',
                    cs: '月星楷',
                  },
                }),
              ],
            }),
          ],
        },
      ],
    });
    const base = Uint8Array.from(await Packer.toBuffer(doc));
    const regular = new Uint8Array(64);
    regular[0] = 0x00;
    regular[1] = 0x01;
    const embedded = await embedFontsInDocx(base, {
      family: '月星楷',
      regular,
    });
    const zip = await JSZip.loadAsync(embedded);
    expect(zip.file('word/fonts/fontRegular.odttf')).toBeTruthy();
    const table = await zip.file('word/fontTable.xml')!.async('string');
    expect(table).toContain('w:name="月星楷"');
    expect(table).toContain('w:embedRegular');
    const rels = await zip.file('word/_rels/fontTable.xml.rels')!.async('string');
    expect(rels).toContain('fonts/fontRegular.odttf');
  });
});
