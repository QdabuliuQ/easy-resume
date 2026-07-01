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
    editorPromise = import('./index');
  }
  return editorPromise;
}

export function prefetchRichTextEditor(): void {
  void loadRichTextEditor();
}
