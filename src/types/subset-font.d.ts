declare module 'subset-font' {
  export default function subsetFont(
    buf: Buffer,
    text: string,
    opts?: { targetFormat?: 'sfnt' | 'woff' | 'woff2' },
  ): Promise<Buffer>;
}
