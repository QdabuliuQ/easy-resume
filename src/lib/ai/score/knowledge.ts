import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Embeddings } from '@langchain/core/embeddings';
import { pipeline } from '@xenova/transformers';

const SCORE_RULES_DIR = path.join(process.cwd(), 'src', 'rag-resume-knowledge', 'score-rules');

type IndexedChunk = {
  content: string;
  vector: number[];
};

let extractorPromise: Promise<
  (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
> | null = null;

const scoreRulesIndexCache: { index?: Promise<IndexedChunk[]> } = {};

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

async function buildScoreRulesIndex(): Promise<IndexedChunk[]> {
  const entries = await readdir(SCORE_RULES_DIR, { withFileTypes: true });
  const txtFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.txt'));
  const docs = await Promise.all(
    txtFiles.map((entry) => readFile(path.join(SCORE_RULES_DIR, entry.name), 'utf-8')),
  );
  const chunks = docs.flatMap((doc) => chunkText(doc));
  if (chunks.length === 0) return [];
  const vectors = await getEmbeddings().embedDocuments(chunks);
  return chunks.map((content, idx) => ({ content, vector: vectors[idx] || [] }));
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

export async function retrieveScoreRulesContext(resumeJson: unknown, topK = 6): Promise<string> {
  if (!scoreRulesIndexCache.index) {
    scoreRulesIndexCache.index = buildScoreRulesIndex();
  }
  const index = await scoreRulesIndexCache.index;
  if (!index.length) return '';

  const query = JSON.stringify(resumeJson ?? {}).slice(0, 8000);
  const queryVector = await getEmbeddings().embedQuery(query);

  return index
    .map((item) => ({
      content: item.content,
      score: cosineSimilarity(queryVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, topK))
    .map((item) => item.content.trim())
    .filter(Boolean)
    .join('\n\n');
}
