import type { ComponentType } from 'react';

export type AiPolishStreamContext = {
  onStreamingHtml?: (htmlSoFar: string) => void;
  signal?: AbortSignal;
};

export type RichTextEditorProps = {
  instanceKey: string;
  html: string;
  onHtmlChange: (next: string) => void;
  placeholder?: string;
  onAiPolishClick?: (richTextHtml: string, ctx?: AiPolishStreamContext) => Promise<string>;
  maxPlainLength?: number;
  dataPanelItemId?: string;
};

type RichTextEditorModule = {
  default: ComponentType<RichTextEditorProps>;
};

let editorPromise: Promise<RichTextEditorModule> | null = null;

export function loadRichTextEditor(): Promise<RichTextEditorModule> {
  if (!editorPromise) {
    // 与编辑器 chunk 并行拉 Quill，避免串行两轮网络
    void import('quill');
    editorPromise = import('./index');
  }
  return editorPromise;
}

export function prefetchRichTextEditor(): void {
  void loadRichTextEditor();
}
