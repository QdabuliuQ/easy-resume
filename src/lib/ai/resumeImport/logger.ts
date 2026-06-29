export type ResumeImportLogger = {
  step: (name: string, detail?: Record<string, unknown>) => void;
};

export function createResumeImportLogger(reqId: string): ResumeImportLogger {
  const start = Date.now();
  return {
    step(name, detail) {
      console.info('[resume-import]', name, {
        reqId,
        elapsedMs: Date.now() - start,
        ...detail,
      });
    },
  };
}
