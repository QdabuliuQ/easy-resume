const OFFLINE_URL = '/offline.html';
const PRE_CACHE_PAGES = ['/', '/edit', '/zh/edit', '/en/edit', '/zh', '/en'];
const ASSET_URL_RE = /(?:href|src)=["']([^"']+)["']/g;
const EMPTY_CSS_RESPONSE = new Response('/* offline css fallback */', {
  status: 200,
  headers: {
    'Content-Type': 'text/css; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

/** @type {{ buildId: string, static: string, pages: string } | null} */
let cacheScope = null;

async function resolveBuildId() {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.buildId === 'string' && data.buildId && data.buildId !== 'unknown') {
        return data.buildId;
      }
    }
  } catch {
    // fall through
  }
  return `fallback-${Date.now()}`;
}

async function ensureCacheScope() {
  if (cacheScope) return cacheScope;
  const buildId = await resolveBuildId();
  cacheScope = {
    buildId,
    static: `static-${buildId}`,
    pages: `pages-${buildId}`,
  };
  return cacheScope;
}

function getCacheScope() {
  return cacheScope;
}

async function deleteStaleCaches(keepStatic, keepPages) {
  const keep = new Set([keepStatic, keepPages]);
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => {
      const isVersioned = key.startsWith('static-') || key.startsWith('pages-');
      const isLegacy = key.includes('easy-resume');
      if ((isVersioned || isLegacy) && !keep.has(key)) {
        return caches.delete(key);
      }
      return undefined;
    }),
  );
}

async function preCachePagesAndAssets(staticCacheName, pageCacheName) {
  const pageCache = await caches.open(pageCacheName);
  const staticCache = await caches.open(staticCacheName);
  const allAssetUrls = new Set([OFFLINE_URL]);

  for (const path of PRE_CACHE_PAGES) {
    try {
      const request = new Request(path, { cache: 'reload' });
      const response = await fetch(request);
      if (!response || !response.ok) continue;

      await pageCache.put(request, response.clone());

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await response.text();
      const matches = html.matchAll(ASSET_URL_RE);
      for (const match of matches) {
        const rawUrl = match[1];
        if (!rawUrl) continue;

        const normalized = rawUrl.startsWith('http')
          ? new URL(rawUrl)
          : new URL(rawUrl, self.location.origin);

        if (normalized.origin !== self.location.origin) continue;

        if (
          normalized.pathname.startsWith('/_next/static/') ||
          normalized.pathname.startsWith('/fonts/') ||
          /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/i.test(normalized.pathname)
        ) {
          allAssetUrls.add(normalized.pathname + normalized.search);
        }
      }
    } catch {
      // skip failed page
    }
  }

  await Promise.all(
    Array.from(allAssetUrls).map((assetUrl) =>
      fetch(new Request(assetUrl, { cache: 'reload' }))
        .then((response) => {
          if (response.ok) return staticCache.put(assetUrl, response);
          return undefined;
        })
        .catch(() => undefined),
    ),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      cacheScope = null;
      const scope = await ensureCacheScope();
      await preCachePagesAndAssets(scope.static, scope.pages);
      self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      cacheScope = null;
      const scope = await ensureCacheScope();
      await deleteStaleCaches(scope.static, scope.pages);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/version' || url.pathname === '/service-worker.js') {
    return;
  }

  if (
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('turbopack') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  const scope = getCacheScope();
  const pageCacheName = scope?.pages;
  const staticCacheName = scope?.static;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && pageCacheName) {
            const cloned = response.clone();
            caches.open(pageCacheName).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(async () => {
          if (!pageCacheName) throw new Error('Offline navigation without cache scope');

          const pageCache = await caches.open(pageCacheName);
          const cachedPage = await pageCache.match(request);
          if (cachedPage) return cachedPage;

          const pathname = url.pathname;
          if (pathname === '/' || pathname === '/zh' || pathname === '/en') {
            const cachedHome =
              (await pageCache.match('/')) ||
              (await pageCache.match('/zh')) ||
              (await pageCache.match('/en'));
            if (cachedHome) return cachedHome;
          }

          if (pathname.endsWith('/edit') || pathname === '/edit') {
            const cachedEdit =
              (await pageCache.match('/edit')) ||
              (await pageCache.match('/zh/edit')) ||
              (await pageCache.match('/en/edit'));
            if (cachedEdit) return cachedEdit;
          }

          if (!staticCacheName) throw new Error('Offline navigation without static cache');
          const staticCache = await caches.open(staticCacheName);
          const offline = await staticCache.match(OFFLINE_URL);
          if (offline) return offline;
          throw new Error('Offline and no cached page');
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok && staticCacheName) {
            const clone = response.clone();
            event.waitUntil(caches.open(staticCacheName).then((cache) => cache.put(request, clone)));
          }
          return response;
        } catch {
          if (url.pathname.startsWith('/_next/static/css/') || url.pathname.endsWith('.css')) {
            return EMPTY_CSS_RESPONSE.clone();
          }
          throw new Error(`Offline and no cache for static asset: ${url.pathname}`);
        }
      })(),
    );
  }
});
