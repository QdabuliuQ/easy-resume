import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Embeddings } from '@langchain/core/embeddings';
import { pipeline } from '@xenova/transformers';
import { matchRole, normalizeRoleKey, toRoleLabel } from '@/lib/ai/ragResume/roles';
import type { OptimizeScene, RagKnowledgeDoc } from '@/lib/ai/ragResume/types';

const RAG_ROOT = path.join(process.cwd(), 'src', 'rag-resume-knowledge');
const GLOBAL_RULE_FILE = 'global-rules.txt';

const SCENE_CONFIG: Record<
  OptimizeScene,
  { dir: string; sceneGlobalFile: string; roleSuffix: string }
> = {
  skill: {
    dir: 'skill-rules',
    sceneGlobalFile: 'global-skill-format.txt',
    roleSuffix: '-skill.txt',
  },
  work: {
    dir: 'work-experience-rules',
    sceneGlobalFile: 'global-work-format.txt',
    roleSuffix: '-work.txt',
  },
  project: {
    dir: 'project-experience-rules',
    sceneGlobalFile: 'global-project-format.txt',
    roleSuffix: '-project.txt',
  },
};

type IndexedChunk = {
  content: string;
  vector: number[];
};

const vectorStoreCache = new Map<string, Promise<IndexedChunk[]>>();

let extractorPromise: Promise<
  (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as Promise<
      (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
    >;
  }
  return extractorPromise;
}

class TransformersJSEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  private async embedOne(text: string): Promise<number[]> {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data ?? []);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedOne(text)));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedOne(text);
  }
}

let embeddingsSingleton: TransformersJSEmbeddings | null = null;

function getEmbeddings(): TransformersJSEmbeddings {
  if (!embeddingsSingleton) embeddingsSingleton = new TransformersJSEmbeddings();
  return embeddingsSingleton;
}

function chunkText(text: string, chunkSize = 700, overlap = 120): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

async function loadDocs(scene: OptimizeScene, roleKey: string | null): Promise<RagKnowledgeDoc[]> {
  const cfg = SCENE_CONFIG[scene];
  const sceneDir = path.join(RAG_ROOT, cfg.dir);

  const globalRulePath = path.join(RAG_ROOT, GLOBAL_RULE_FILE);
  const sceneGlobalPath = path.join(sceneDir, cfg.sceneGlobalFile);

  const [globalRuleText, sceneGlobalText, sceneFiles] = await Promise.all([
    readFile(globalRulePath, 'utf-8'),
    readFile(sceneGlobalPath, 'utf-8'),
    readdir(sceneDir),
  ]);

  const roleFiles = sceneFiles.filter(
    (name) => name.endsWith(cfg.roleSuffix) && name !== cfg.sceneGlobalFile,
  );

  const roleDocs = roleFiles.map((name) => {
    const stem = name.slice(0, -cfg.roleSuffix.length);
    const normalizedKey = normalizeRoleKey(stem);
    return {
      name,
      roleKey: normalizedKey,
      roleLabel: toRoleLabel(normalizedKey),
    };
  });

  const docs: RagKnowledgeDoc[] = [
    {
      id: `${scene}:global:resume`,
      text: globalRuleText,
      source: GLOBAL_RULE_FILE,
      roleKey: null,
      roleLabel: 'Global',
      scope: 'global',
    },
    {
      id: `${scene}:global:scene`,
      text: sceneGlobalText,
      source: path.posix.join(cfg.dir, cfg.sceneGlobalFile),
      roleKey: null,
      roleLabel: 'Global',
      scope: 'scene-global',
    },
  ];

  if (!roleKey) return docs;

  const target = roleDocs.find((x) => x.roleKey === roleKey);
  if (!target) return docs;

  const roleText = await readFile(path.join(sceneDir, target.name), 'utf-8');
  docs.push({
    id: `${scene}:role:${target.roleKey}`,
    text: roleText,
    source: path.posix.join(cfg.dir, target.name),
    roleKey: target.roleKey,
    roleLabel: target.roleLabel,
    scope: 'role',
  });

  return docs;
}

async function listRoleKeys(scene: OptimizeScene): Promise<string[]> {
  const cfg = SCENE_CONFIG[scene];
  const sceneDir = path.join(RAG_ROOT, cfg.dir);
  const sceneFiles = await readdir(sceneDir);
  return sceneFiles
    .filter((name) => name.endsWith(cfg.roleSuffix) && name !== cfg.sceneGlobalFile)
    .map((name) => normalizeRoleKey(name.slice(0, -cfg.roleSuffix.length)));
}

export async function buildSceneRetriever(scene: OptimizeScene, postType: string) {
  const roleKeys = await listRoleKeys(scene);
  const matched = matchRole(postType, roleKeys);
  const cacheKey = `${scene}:${matched?.roleKey ?? 'global'}`;

  if (!vectorStoreCache.has(cacheKey)) {
    vectorStoreCache.set(
      cacheKey,
      (async () => {
        const docs = await loadDocs(scene, matched?.roleKey ?? null);
        const chunks = docs.flatMap((doc) => chunkText(doc.text));
        const vectors = await getEmbeddings().embedDocuments(chunks);
        return chunks.map((content, idx) => ({ content, vector: vectors[idx] || [] }));
      })(),
    );
  }

  const vectorStore = await vectorStoreCache.get(cacheKey)!;
  return {
    matchedRole: matched,
    async retrieve(rawText: string) {
      const query = `${postType}\n${rawText}`.trim();
      const queryVector = await getEmbeddings().embedQuery(query);

      const scored = vectorStore
        .map((item) => ({
          content: item.content,
          score: cosineSimilarity(queryVector, item.vector),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return scored
        .map((d) => d.content.trim())
        .filter(Boolean)
        .join('\n\n');
    },
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const size = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < size; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
