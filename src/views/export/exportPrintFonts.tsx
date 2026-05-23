'use client';
import { resumePdfFontLinkTags } from '@/lib/resumePdfFontLinkTags';

export default function ExportPrintFonts({
  font,
  assetOrigin,
}: {
  font: unknown;
  assetOrigin: string;
}) {
  const html = resumePdfFontLinkTags(font, { assetOrigin });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
