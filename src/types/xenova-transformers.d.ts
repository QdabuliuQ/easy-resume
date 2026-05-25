declare module '@xenova/transformers' {
  export function pipeline(
    task: string,
    model?: string,
  ): Promise<(
    text: string,
    opts: { pooling: 'mean'; normalize: boolean },
  ) => Promise<{ data: number[] }>>;
}
