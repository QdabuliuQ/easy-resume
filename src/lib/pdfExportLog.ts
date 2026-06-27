export type PdfExportTrace = {
  id: string;
  log: (step: string, extra?: Record<string, unknown>) => void;
};

export function createPdfExportTrace(): PdfExportTrace {
  const id = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  return {
    id,
    log(step, extra) {
      const ms = Date.now() - startedAt;
      if (extra && Object.keys(extra).length > 0) {
        console.info(`[pdf-export:${id}] +${ms}ms ${step}`, extra);
      } else {
        console.info(`[pdf-export:${id}] +${ms}ms ${step}`);
      }
    },
  };
}
