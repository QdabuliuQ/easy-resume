declare module '@xenova/transformers' {
  export namespace env {
    export let cacheDir: string;
    export let allowRemoteModels: boolean;
  }
  export function pipeline(
    task: string,
    model?: string,
  ): Promise<(
    text: string,
    opts: { pooling: 'mean'; normalize: boolean },
  ) => Promise<{ data: number[] }>>;
}
