import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('localTemplateStore create/delete', () => {
  let dir: string;
  let overridesFile: string;
  let prevEnv: string | undefined;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'tpl-store-'));
    overridesFile = path.join(dir, 'template-overrides.json');
    await writeFile(overridesFile, '{}\n', 'utf8');
    prevEnv = process.env.TEMPLATE_OVERRIDES_PATH;
    process.env.TEMPLATE_OVERRIDES_PATH = overridesFile;
  });

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.TEMPLATE_OVERRIDES_PATH;
    else process.env.TEMPLATE_OVERRIDES_PATH = prevEnv;
  });

  async function store() {
    return import('@/lib/localTemplateStore');
  }

  const sampleConfig = {
    name: '测试模板',
    globalStyle: {
      pageSize: 'A4',
      fontSize: 13,
      lineHeight: 1.3,
      moduleMargin: 15,
      color: '#383838',
      backgroundColor: '#fff',
      padding: 20,
      headerType: 9,
      layout: 'default',
    },
    pages: [{ modules: [] }],
  };

  it('creates custom template and lists it', async () => {
    const { createLocalTemplate, listLocalTemplates, getLocalTemplate } = await store();
    const created = await createLocalTemplate({
      id: 'custom-demo',
      title: '自定义 Demo',
      config: sampleConfig as any,
    });
    expect(created.id).toBe('custom-demo');
    const got = await getLocalTemplate('custom-demo');
    expect(got?.title).toBe('自定义 Demo');
    const list = await listLocalTemplates();
    expect(list.some((t) => t.id === 'custom-demo')).toBe(true);
    const raw = JSON.parse(await readFile(overridesFile, 'utf8'));
    expect(raw['custom-demo'].title).toBe('自定义 Demo');
  });

  it('rejects duplicate id', async () => {
    const { createLocalTemplate } = await store();
    await createLocalTemplate({ id: 'dup-a', title: 'A', config: sampleConfig as any });
    await expect(
      createLocalTemplate({ id: 'dup-a', title: 'B', config: sampleConfig as any }),
    ).rejects.toThrow(/已存在/);
  });

  it('hard-deletes custom and soft-deletes bundled', async () => {
    const { createLocalTemplate, deleteLocalTemplate, getLocalTemplate, listLocalTemplates } =
      await store();
    await createLocalTemplate({ id: 'to-remove', title: '删', config: sampleConfig as any });
    expect(await deleteLocalTemplate('to-remove')).toBe(true);
    expect(await getLocalTemplate('to-remove')).toBeNull();

    const bundledId = 'fe';
    expect(await deleteLocalTemplate(bundledId)).toBe(true);
    expect(await getLocalTemplate(bundledId)).toBeNull();
    expect((await listLocalTemplates()).some((t) => t.id === bundledId)).toBe(false);
    const raw = JSON.parse(await readFile(overridesFile, 'utf8'));
    expect(raw[bundledId].status).toBe('offline');
  });

  it('keeps previewImage on list and get', async () => {
    const { saveLocalTemplate, getLocalTemplate, listLocalTemplates } = await store();
    await saveLocalTemplate('fe', {
      previewImage: 'https://cdn.example.com/fe.jpg',
    });
    expect((await getLocalTemplate('fe'))?.previewImage).toBe('https://cdn.example.com/fe.jpg');
    expect(
      (await listLocalTemplates()).find((t) => t.id === 'fe')?.previewImage,
    ).toBe('https://cdn.example.com/fe.jpg');
  });
});
