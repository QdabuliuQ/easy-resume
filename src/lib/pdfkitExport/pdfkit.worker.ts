import { buildPdfkitDocumentInBrowser } from './buildClient';
import type { PdfkitExportPayload } from './types';

type BuildMessage = { type: 'build'; id: number; payload: PdfkitExportPayload };
type WarmupMessage = { type: 'warmup' };
type WorkerMessage = BuildMessage | WarmupMessage;

const scope = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

scope.onmessage = async (event) => {
  const message = event.data;
  if (message.type === 'warmup') return;
  try {
    const pdf = await buildPdfkitDocumentInBrowser(message.payload);
    // Transfer the generated buffer so the main thread does not copy the PDF.
    const buffer = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;
    scope.postMessage({ type: 'result', id: message.id, buffer }, [buffer]);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      id: message.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
