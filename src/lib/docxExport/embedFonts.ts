import JSZip from 'jszip';

export type DocxEmbedFontFace = {
  family: string;
  regular: Uint8Array;
  bold?: Uint8Array;
};

/** OOXML fontKey GUID → 16-byte XOR key（前三组小端） */
export function docxFontKeyToBytes(fontKey: string): Uint8Array {
  const hex = fontKey.replace(/[{}-]/g, '');
  if (hex.length !== 32) throw new Error('invalid fontKey');
  const raw = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    raw[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  const key = new Uint8Array(16);
  key[0] = raw[3];
  key[1] = raw[2];
  key[2] = raw[1];
  key[3] = raw[0];
  key[4] = raw[5];
  key[5] = raw[4];
  key[6] = raw[7];
  key[7] = raw[6];
  for (let i = 8; i < 16; i += 1) key[i] = raw[i];
  return key;
}

/** ECMA-376：用 fontKey XOR 字体文件前 32 字节得到 .odttf */
export function obfuscateDocxFont(font: Uint8Array, fontKey: string): Uint8Array {
  const key = docxFontKeyToBytes(fontKey);
  const out = new Uint8Array(font);
  const n = Math.min(32, out.length);
  for (let i = 0; i < n; i += 1) out[i] ^= key[i % 16];
  return out;
}

function newFontKey(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `{${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}}`.toUpperCase();
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 把子集 TTF 嵌入已打包的 docx（odttf + fontTable）。
 * Word 无本地「月星楷」等字体时，不嵌入则必然回退，看起来像字体没同步。
 */
export async function embedFontsInDocx(
  docxBytes: Uint8Array,
  face: DocxEmbedFontFace,
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(docxBytes);
  const regularKey = newFontKey();
  const boldKey = face.bold ? newFontKey() : null;
  zip.folder('word/fonts');
  zip.file(
    'word/fonts/fontRegular.odttf',
    obfuscateDocxFont(face.regular, regularKey),
  );
  if (face.bold && boldKey) {
    zip.file('word/fonts/fontBold.odttf', obfuscateDocxFont(face.bold, boldKey));
  }
  const name = escXml(face.family);
  const boldEmbed = boldKey
    ? `<w:embedBold r:id="rId2" w:fontKey="${boldKey}" w:subsetted="true"/>`
    : '';
  const fontTable = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable="">
  <w:font w:name="${name}">
    <w:charset w:val="86"/>
    <w:family w:val="auto"/>
    <w:pitch w:val="variable"/>
    <w:embedRegular r:id="rId1" w:fontKey="${regularKey}" w:subsetted="true"/>
    ${boldEmbed}
  </w:font>
</w:fonts>`;
  zip.file('word/fontTable.xml', fontTable);
  const boldRel = boldKey
    ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/fontBold.odttf"/>`
    : '';
  zip.file(
    'word/_rels/fontTable.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/fontRegular.odttf"/>${boldRel}</Relationships>`,
  );
  const out = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
  });
  return out;
}
