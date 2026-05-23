type ExportSession = {
  config: unknown;
  locale: string;
  createdAt: number;
};

const TTL_MS = 10 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  __easyResumeExportSessions?: Map<string, ExportSession>;
};

function store(): Map<string, ExportSession> {
  if (!g.__easyResumeExportSessions) {
    g.__easyResumeExportSessions = new Map();
  }
  return g.__easyResumeExportSessions;
}

function prune() {
  const now = Date.now();
  const m = store();
  m.forEach((v, k) => {
    if (now - v.createdAt > TTL_MS) m.delete(k);
  });
}

export function createExportSession(config: unknown, locale: string): string {
  prune();
  const token = crypto.randomUUID();
  store().set(token, { config, locale, createdAt: Date.now() });
  return token;
}

export function getExportSession(token: string): ExportSession | null {
  prune();
  const s = store().get(token);
  if (!s) return null;
  if (Date.now() - s.createdAt > TTL_MS) {
    store().delete(token);
    return null;
  }
  return s;
}
