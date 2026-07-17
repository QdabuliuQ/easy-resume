/**
 * 青松简历 — Cloudflare Workers + D1 后端
 * 无第三方依赖，仅 Workers 原生 fetch / crypto / D1
 * 与主站隔离：无 /api/admin/login；浏览器勿直连本 Worker。
 * Next 经 CF_API_BASE_URL + X-CF-Key / X-Admin-Key 调用。
 *
 * 路由：
 *   POST /api/user/sync          （X-CF-Key）
 *   POST /api/oauth/github/token （X-CF-Key；国内机房换 token 代理）
 *   GET  /api/admin/stats        （X-Admin-Key）
 *   GET  /api/admin/resumes?uid=&q=
 *   GET  /api/admin/resume?id=
 *   DELETE /api/admin/resume?id=
 *   GET  /api/resume/list?uid=    （X-CF-Key）
 *   GET  /api/resume/get?id=&uid=
 *   POST /api/resume/save
 *   DELETE /api/resume/remove?id=&uid=
 *   OPTIONS * （CORS 预检）
 */

const MODULE_TYPES = ['base', 'education', 'work', 'project', 'skill'];
const MAX_RESUMES_PER_USER = 5;
const EDUCATION_TYPES = new Set(['education']);
const WORK_TYPES = new Set(['job', 'job1']);
const PROJECT_TYPES = new Set(['project']);
const SKILL_TYPES = new Set(['skill']);

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://resume.qdabuliuq.cn',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://resume.qdabuliuq.cn';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CF-Key, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

function nowTs() {
  return Math.floor(Date.now() / 1000);
}

function safeParseJson(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function resolveModuleBucket(type) {
  if (EDUCATION_TYPES.has(type)) return 'education';
  if (WORK_TYPES.has(type)) return 'work';
  if (PROJECT_TYPES.has(type)) return 'project';
  if (SKILL_TYPES.has(type)) return 'skill';
  return 'base';
}

function flattenBaseModules(base) {
  return (base?.pages || []).flatMap((p) => p.modules || []);
}

/** 完整简历 JSON → 按 module_type 分桶 */
function splitResumeContent(content) {
  const cfg = safeParseJson(content) || {};
  const pages = Array.isArray(cfg.pages) ? cfg.pages : [];
  const basePages = pages.map((page) => ({ ...page, modules: [] }));
  const buckets = {
    base: { name: cfg.name, globalStyle: cfg.globalStyle, pages: basePages, moduleSequence: [] },
    education: { modules: [] },
    work: { modules: [] },
    project: { modules: [] },
    skill: { modules: [] },
  };

  for (let pi = 0; pi < pages.length; pi += 1) {
    const modules = pages[pi]?.modules || [];
    for (const mod of modules) {
      const modType = mod?.type || '';
      buckets.base.moduleSequence.push({ id: mod.id, type: modType });
      const bucket = resolveModuleBucket(modType);
      if (bucket === 'base') {
        if (!basePages[pi]) basePages[pi] = { modules: [] };
        basePages[pi].modules.push(mod);
      } else {
        buckets[bucket].modules.push(mod);
      }
    }
  }

  return buckets;
}

/** resume_module 行 → 完整简历 JSON */
function mergeResumeModules(rows) {
  const byType = {};
  for (const row of rows || []) {
    byType[row.module_type] = safeParseJson(row.module_json) || {};
  }

  const base = byType.base || {};
  const byId = {};
  for (const m of flattenBaseModules(base)) {
    if (m?.id != null) byId[m.id] = m;
  }
  for (const mt of ['education', 'work', 'project', 'skill']) {
    for (const m of byType[mt]?.modules || []) {
      if (m?.id != null) byId[m.id] = m;
    }
  }

  const seq = Array.isArray(base.moduleSequence) ? base.moduleSequence : [];
  const ordered = seq.length
    ? seq.map((s) => byId[s.id]).filter(Boolean)
    : [
        ...flattenBaseModules(base),
        ...(byType.education?.modules || []),
        ...(byType.work?.modules || []),
        ...(byType.project?.modules || []),
        ...(byType.skill?.modules || []),
      ];

  const pages = base.pages?.length
    ? base.pages.map((p, i) => (i === 0 ? { ...p, modules: ordered } : { ...p, modules: p.modules || [] }))
    : [{ modules: ordered }];

  return {
    name: base.name,
    globalStyle: base.globalStyle,
    pages,
  };
}

async function assertUserExists(env, uid) {
  return env.DB.prepare('SELECT id FROM users WHERE id = ? LIMIT 1').bind(uid).first();
}

async function assertResumeOwner(env, resumeId, uid) {
  return env.DB.prepare('SELECT id FROM resume_header WHERE id = ? AND user_id = ? LIMIT 1')
    .bind(resumeId, uid)
    .first();
}

async function fetchResumeModules(env, resumeId) {
  const { results } = await env.DB.prepare(
    'SELECT id, resume_id, module_type, module_json FROM resume_module WHERE resume_id = ? ORDER BY module_type ASC',
  )
    .bind(resumeId)
    .all();
  return results || [];
}

async function loadResumeContent(env, resumeId) {
  const rows = await fetchResumeModules(env, resumeId);
  return mergeResumeModules(rows);
}

/** 按 github_id upsert users，返回 { id, github_id, username, avatar, email } */
async function upsertUser(env, { githubId, username, avatar, email }) {
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ? LIMIT 1')
    .bind(githubId)
    .first();

  if (existing?.id) {
    await env.DB.prepare('UPDATE users SET username = ?, avatar = ?, email = ? WHERE id = ?')
      .bind(username, avatar, email, existing.id)
      .run();
    return { id: existing.id, github_id: githubId, username, avatar, email, created: false };
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO users (id, github_id, username, avatar, email, create_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, githubId, username, avatar, email, nowTs())
    .run();
  return { id, github_id: githubId, username, avatar, email, created: true };
}

/**
 * POST /api/user/sync
 * body: { github_id, username?, avatar?, email? }
 * NextAuth 登录成功后调用，写入 / 更新 users 表
 */
async function handleUserSync(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: '请求体必须是 JSON' }, 400);
  }

  const githubId = body?.github_id != null ? String(body.github_id).trim() : '';
  if (!githubId) return json(request, { error: '缺少 github_id' }, 400);

  const username = body?.username != null ? String(body.username) : '';
  const avatar = body?.avatar != null ? String(body.avatar) : '';
  const email = body?.email != null ? String(body.email) : '';

  const user = await upsertUser(env, { githubId, username, avatar, email });
  return json(request, user, user.created ? 201 : 200);
}

/** GET /api/resume/list?uid= */
async function handleResumeList(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const uid = new URL(request.url).searchParams.get('uid');
  if (!uid) return json(request, { error: '缺少 uid' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT id, user_id, update_at FROM resume_header WHERE user_id = ? ORDER BY update_at DESC',
  )
    .bind(uid)
    .all();

  const list = [];
  for (const row of results || []) {
    const baseRow = await env.DB.prepare(
      "SELECT module_json FROM resume_module WHERE resume_id = ? AND module_type = 'base' LIMIT 1",
    )
      .bind(row.id)
      .first();
    const base = safeParseJson(baseRow?.module_json) || {};
    list.push({
      id: row.id,
      user_id: row.user_id,
      update_at: row.update_at,
      name: base.name || '',
    });
  }

  return json(request, { list, max: MAX_RESUMES_PER_USER, count: list.length });
}

/** GET /api/resume/get?id=&uid= */
async function handleResumeGet(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const url = new URL(request.url);
  const resumeId = url.searchParams.get('id');
  const uid = url.searchParams.get('uid');
  if (!resumeId) return json(request, { error: '缺少 id' }, 400);
  if (!uid) return json(request, { error: '缺少 uid' }, 400);

  const header = await assertResumeOwner(env, resumeId, uid);
  if (!header) return json(request, { error: '简历不存在或无权操作' }, 404);

  const modules = await fetchResumeModules(env, resumeId);
  const headerRow = await env.DB.prepare(
    'SELECT id, user_id, update_at FROM resume_header WHERE id = ? LIMIT 1',
  )
    .bind(resumeId)
    .first();

  return json(request, {
    id: headerRow.id,
    user_id: headerRow.user_id,
    update_at: headerRow.update_at,
    content: mergeResumeModules(modules),
    modules: modules.map((m) => ({
      id: m.id,
      module_type: m.module_type,
      module_json: safeParseJson(m.module_json),
    })),
  });
}

/**
 * POST /api/resume/save
 * 新增：{ uid, content }
 * 单模块更新：{ uid, id, module_type, module_json }
 */
async function handleResumeSave(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: '请求体必须是 JSON' }, 400);
  }

  const uid = body?.uid != null ? String(body.uid) : '';
  if (!uid) return json(request, { error: '缺少 uid' }, 400);

  const user = await assertUserExists(env, uid);
  if (!user) return json(request, { error: '用户不存在' }, 404);

  const resumeId = body.id ? String(body.id) : '';
  const moduleType = body.module_type ? String(body.module_type) : '';

  if (resumeId && moduleType) {
    if (!MODULE_TYPES.includes(moduleType)) {
      return json(request, { error: '无效的 module_type' }, 400);
    }
    if (body.module_json === undefined || body.module_json === null) {
      return json(request, { error: '缺少 module_json' }, 400);
    }

    const owned = await assertResumeOwner(env, resumeId, uid);
    if (!owned) return json(request, { error: '简历不存在或无权操作' }, 404);

    const moduleJsonStr =
      typeof body.module_json === 'string' ? body.module_json : JSON.stringify(body.module_json);
    const ts = nowTs();

    const existing = await env.DB.prepare(
      'SELECT id FROM resume_module WHERE resume_id = ? AND module_type = ? LIMIT 1',
    )
      .bind(resumeId, moduleType)
      .first();

    if (existing?.id) {
      await env.DB.batch([
        env.DB.prepare('UPDATE resume_module SET module_json = ? WHERE resume_id = ? AND module_type = ?')
          .bind(moduleJsonStr, resumeId, moduleType),
        env.DB.prepare('UPDATE resume_header SET update_at = ? WHERE id = ? AND user_id = ?')
          .bind(ts, resumeId, uid),
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO resume_module (id, resume_id, module_type, module_json) VALUES (?, ?, ?, ?)',
        )
          .bind(crypto.randomUUID(), resumeId, moduleType, moduleJsonStr),
        env.DB.prepare('UPDATE resume_header SET update_at = ? WHERE id = ? AND user_id = ?')
          .bind(ts, resumeId, uid),
      ]);
    }

    return json(request, {
      id: resumeId,
      user_id: uid,
      module_type: moduleType,
      update_at: ts,
      updated: true,
      content: await loadResumeContent(env, resumeId),
    });
  }

  if (body.content === undefined || body.content === null) {
    return json(request, { error: '缺少 content 或 module_type+module_json' }, 400);
  }

  const buckets = splitResumeContent(body.content);
  const ts = nowTs();

  /** 整份更新：有 id + content → 覆盖全部 module */
  if (resumeId) {
    const owned = await assertResumeOwner(env, resumeId, uid);
    if (!owned) return json(request, { error: '简历不存在或无权操作' }, 404);

    const stmts = [
      env.DB.prepare('UPDATE resume_header SET update_at = ? WHERE id = ? AND user_id = ?').bind(
        ts,
        resumeId,
        uid,
      ),
    ];
    for (const mt of MODULE_TYPES) {
      const existing = await env.DB.prepare(
        'SELECT id FROM resume_module WHERE resume_id = ? AND module_type = ? LIMIT 1',
      )
        .bind(resumeId, mt)
        .first();
      const jsonStr = JSON.stringify(buckets[mt]);
      if (existing?.id) {
        stmts.push(
          env.DB.prepare(
            'UPDATE resume_module SET module_json = ? WHERE resume_id = ? AND module_type = ?',
          ).bind(jsonStr, resumeId, mt),
        );
      } else {
        stmts.push(
          env.DB.prepare(
            'INSERT INTO resume_module (id, resume_id, module_type, module_json) VALUES (?, ?, ?, ?)',
          ).bind(crypto.randomUUID(), resumeId, mt, jsonStr),
        );
      }
    }
    await env.DB.batch(stmts);
    return json(request, {
      id: resumeId,
      user_id: uid,
      update_at: ts,
      updated: true,
      content: await loadResumeContent(env, resumeId),
    });
  }

  const newId = crypto.randomUUID();
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM resume_header WHERE user_id = ?',
  )
    .bind(uid)
    .first();
  if (Number(countRow?.c || 0) >= MAX_RESUMES_PER_USER) {
    return json(
      request,
      { error: `每人最多保存 ${MAX_RESUMES_PER_USER} 份简历`, max: MAX_RESUMES_PER_USER },
      400,
    );
  }

  const stmts = [
    env.DB.prepare('INSERT INTO resume_header (id, user_id, update_at) VALUES (?, ?, ?)').bind(
      newId,
      uid,
      ts,
    ),
  ];

  for (const mt of MODULE_TYPES) {
    stmts.push(
      env.DB.prepare(
        'INSERT INTO resume_module (id, resume_id, module_type, module_json) VALUES (?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), newId, mt, JSON.stringify(buckets[mt])),
    );
  }

  await env.DB.batch(stmts);

  return json(
    request,
    {
      id: newId,
      user_id: uid,
      update_at: ts,
      updated: false,
      content: mergeResumeModules(
        MODULE_TYPES.map((mt) => ({ module_type: mt, module_json: JSON.stringify(buckets[mt]) })),
      ),
    },
    201,
  );
}

/** DELETE /api/resume/remove?id=&uid= */
async function handleResumeRemove(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const uid = url.searchParams.get('uid');
  if (!id) return json(request, { error: '缺少 id' }, 400);
  if (!uid) return json(request, { error: '缺少 uid' }, 400);

  const owned = await assertResumeOwner(env, id, uid);
  if (!owned) return json(request, { error: '简历不存在或无权操作' }, 404);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM resume_module WHERE resume_id = ?').bind(id),
    env.DB.prepare('DELETE FROM resume_header WHERE id = ?').bind(id),
  ]);

  return json(request, { ok: true, id });
}

/**
 * 服务端密钥：保护 /api/resume/*、/api/user/sync
 * Header: X-CF-Key: <CF_API_SECRET || ADMIN_SECRET>
 */
function assertServiceKey(request, env) {
  const expected = env.CF_API_SECRET || env.ADMIN_SECRET || '';
  if (!expected) return { ok: false, status: 503, error: '未配置 CF_API_SECRET' };
  const key =
    request.headers.get('X-CF-Key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  if (key !== expected) return { ok: false, status: 401, error: '无权访问' };
  return { ok: true };
}

/** POST /api/oauth/github/token — 转发到 github.com（规避国内机房对 /login/oauth 的 500） */
async function handleGithubTokenProxy(request, env) {
  const gate = assertServiceKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);
  const body = await request.text();
  const headers = {
    Accept: request.headers.get('Accept') || 'application/json',
    'Content-Type':
      request.headers.get('Content-Type') || 'application/x-www-form-urlencoded',
  };
  // Auth.js 默认 client_secret_basic：凭证在 Authorization，必须原样转发
  const authz = request.headers.get('Authorization');
  if (authz) headers.Authorization = authz;
  const upstream = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers,
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(request),
    },
  });
}

/**
 * GET /api/admin/stats
 * Header: X-Admin-Key: <ADMIN_SECRET>
 */
function assertAdminKey(request, env) {
  const expected = env.ADMIN_SECRET || '';
  if (!expected) return { ok: false, status: 503, error: '未配置 ADMIN_SECRET' };
  const url = new URL(request.url);
  const key =
    request.headers.get('X-Admin-Key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
    url.searchParams.get('key') ||
    '';
  if (key !== expected) return { ok: false, status: 401, error: '无权访问' };
  return { ok: true };
}

async function handleAdminStats(request, env) {
  const gate = assertAdminKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const now = nowTs();
  const dayAgo = now - 86400;
  const weekAgo = now - 86400 * 7;

  const [usersTotal, usersToday, usersWeek, resumesTotal, recent] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS c FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM users WHERE create_at >= ?').bind(dayAgo).first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM users WHERE create_at >= ?').bind(weekAgo).first(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM resume_header').first(),
    env.DB.prepare(
      `SELECT u.id, u.github_id, u.username, u.avatar, u.email, u.create_at,
        (SELECT COUNT(*) FROM resume_header r WHERE r.user_id = u.id) AS resume_count
       FROM users u
       ORDER BY u.create_at DESC
       LIMIT 100`,
    ).all(),
  ]);

  return json(request, {
    users: {
      total: Number(usersTotal?.c || 0),
      today: Number(usersToday?.c || 0),
      week: Number(usersWeek?.c || 0),
    },
    resumes: {
      total: Number(resumesTotal?.c || 0),
    },
    recent: (recent?.results || []).map((row) => ({
      id: row.id,
      github_id: row.github_id,
      username: row.username || '',
      avatar: row.avatar || '',
      email: row.email || '',
      create_at: row.create_at,
      resume_count: Number(row.resume_count || 0),
    })),
    ts: now,
  });
}

/** GET /api/admin/resumes — 最近简历列表；可选 uid / q */
async function handleAdminResumes(request, env) {
  const gate = assertAdminKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const sp = new URL(request.url).searchParams;
  const uid = (sp.get('uid') || '').trim();
  const q = (sp.get('q') || '').trim().toLowerCase();

  const { results } = uid
    ? await env.DB.prepare(
        `SELECT h.id, h.user_id, h.update_at,
          u.username, u.avatar, u.email, u.github_id,
          (SELECT module_json FROM resume_module m WHERE m.resume_id = h.id AND m.module_type = 'base' LIMIT 1) AS base_json
         FROM resume_header h
         LEFT JOIN users u ON u.id = h.user_id
         WHERE h.user_id = ?
         ORDER BY h.update_at DESC
         LIMIT 200`,
      )
        .bind(uid)
        .all()
    : await env.DB.prepare(
        `SELECT h.id, h.user_id, h.update_at,
          u.username, u.avatar, u.email, u.github_id,
          (SELECT module_json FROM resume_module m WHERE m.resume_id = h.id AND m.module_type = 'base' LIMIT 1) AS base_json
         FROM resume_header h
         LEFT JOIN users u ON u.id = h.user_id
         ORDER BY h.update_at DESC
         LIMIT 200`,
      ).all();

  let list = (results || []).map((row) => {
    const base = safeParseJson(row.base_json) || {};
    return {
      id: row.id,
      user_id: row.user_id,
      update_at: row.update_at,
      name: base.name || '',
      username: row.username || '',
      avatar: row.avatar || '',
      email: row.email || '',
      github_id: row.github_id || '',
    };
  });

  if (q) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.github_id.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.user_id.toLowerCase().includes(q),
    );
  }

  return json(request, { list, total: list.length, uid: uid || undefined, ts: nowTs() });
}

/** DELETE /api/admin/resume?id= — 管理员删除任意简历 */
async function handleAdminResumeDelete(request, env) {
  const gate = assertAdminKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const id = (new URL(request.url).searchParams.get('id') || '').trim();
  if (!id) return json(request, { error: '缺少 id' }, 400);

  const row = await env.DB.prepare('SELECT id FROM resume_header WHERE id = ? LIMIT 1').bind(id).first();
  if (!row) return json(request, { error: '简历不存在' }, 404);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM resume_module WHERE resume_id = ?').bind(id),
    env.DB.prepare('DELETE FROM resume_header WHERE id = ?').bind(id),
  ]);

  return json(request, { ok: true, id });
}

/** GET /api/admin/resume?id= — 单份完整简历（预览） */
async function handleAdminResumeGet(request, env) {
  const gate = assertAdminKey(request, env);
  if (!gate.ok) return json(request, { error: gate.error }, gate.status);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json(request, { error: '缺少 id' }, 400);

  const header = await env.DB.prepare(
    `SELECT h.id, h.user_id, h.update_at, u.username, u.avatar, u.email, u.github_id
     FROM resume_header h
     LEFT JOIN users u ON u.id = h.user_id
     WHERE h.id = ?
     LIMIT 1`,
  )
    .bind(id)
    .first();
  if (!header) return json(request, { error: '简历不存在' }, 404);

  const content = await loadResumeContent(env, id);
  return json(request, {
    id: header.id,
    user_id: header.user_id,
    update_at: header.update_at,
    username: header.username || '',
    avatar: header.avatar || '',
    email: header.email || '',
    github_id: header.github_id || '',
    content,
  });
}

function pathnameOf(request) {
  return new URL(request.url).pathname.replace(/\/$/, '') || '/';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const path = pathnameOf(request);
    const method = request.method.toUpperCase();

    try {
      if (method === 'GET' && (path === '/api/github/login' || path === '/api/github/callback')) {
        return json(
          request,
          { error: '已停用：请使用站点 NextAuth GitHub 登录（/api/github）' },
          410,
        );
      }
      if (method === 'POST' && path === '/api/oauth/github/token') {
        return handleGithubTokenProxy(request, env);
      }
      if (method === 'POST' && path === '/api/user/sync') return handleUserSync(request, env);
      if (method === 'GET' && path === '/api/admin/stats') return handleAdminStats(request, env);
      if (method === 'GET' && path === '/api/admin/resumes') return handleAdminResumes(request, env);
      if (method === 'GET' && path === '/api/admin/resume') return handleAdminResumeGet(request, env);
      if (method === 'DELETE' && path === '/api/admin/resume') return handleAdminResumeDelete(request, env);
      if (method === 'GET' && path === '/api/resume/list') return handleResumeList(request, env);
      if (method === 'GET' && path === '/api/resume/get') return handleResumeGet(request, env);
      if (method === 'POST' && path === '/api/resume/save') return handleResumeSave(request, env);
      if (method === 'DELETE' && path === '/api/resume/remove') return handleResumeRemove(request, env);
      if (method === 'GET' && path === '/api/health') return json(request, { ok: true, ts: nowTs() });

      return json(request, { error: 'Not Found', path }, 404);
    } catch (e) {
      console.error('[easy-resume-api]', e);
      return json(request, { error: e instanceof Error ? e.message : 'Internal Error' }, 500);
    }
  },
};
