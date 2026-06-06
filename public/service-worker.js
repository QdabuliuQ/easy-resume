const CACHE_VERSION = 'easy-resume-v2';
const OFFLINE_URL = '/offline.html';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;
const PRE_CACHE_PAGES = ['/', '/edit', '/zh/edit', '/en/edit', '/zh', '/en'];
const EMPTY_CSS_RESPONSE = new Response('/* offline css fallback */', {
  status: 200,
  headers: {
    'Content-Type': 'text/css; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const ASSET_URL_RE = /(?:href|src)=["']([^"']+)["']/g;

async function preCachePagesAndAssets() {
  const pageCache = await caches.open(PAGE_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);

  const allAssetUrls = new Set([OFFLINE_URL]);

  for (const path of PRE_CACHE_PAGES) {
    try {
      const request = new Request(path, { cache: 'reload' });
      const response = await fetch(request);
      if (!response || !response.ok) {
        continue;
      }

      await pageCache.put(request, response.clone());

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        continue;
      }

      const html = await response.text();
      const matches = html.matchAll(ASSET_URL_RE);
      for (const match of matches) {
        const rawUrl = match[1];
        if (!rawUrl) {
          continue;
        }

        const normalized = rawUrl.startsWith('http')
          ? new URL(rawUrl)
          : new URL(rawUrl, self.location.origin);

        if (normalized.origin !== self.location.origin) {
          continue;
        }

        if (
          normalized.pathname.startsWith('/_next/static/') ||
          normalized.pathname.startsWith('/fonts/') ||
          /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/i.test(normalized.pathname)
        ) {
          allAssetUrls.add(normalized.pathname + normalized.search);
        }
      }
    } catch {
      // Skip a failed page pre-cache and continue with remaining pages.
    }
  }

  await Promise.all(
    Array.from(allAssetUrls).map((assetUrl) =>
      staticCache.add(new Request(assetUrl, { cache: 'reload' })).catch(() => undefined)
    )
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(preCachePagesAndAssets());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache version probe endpoint; it must always hit network freshness.
  if (url.pathname === '/api/version') {
    return;
  }

  // HTML navigation: network first, then cached page, then offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const pageCache = await caches.open(PAGE_CACHE);
          const cachedPage = await pageCache.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          const pathname = new URL(request.url).pathname;
          if (pathname === '/' || pathname === '/zh' || pathname === '/en') {
            const cachedHome =
              (await pageCache.match('/')) ||
              (await pageCache.match('/zh')) ||
              (await pageCache.match('/en'));
            if (cachedHome) {
              return cachedHome;
            }
          }

          if (pathname.endsWith('/edit') || pathname === '/edit') {
            const cachedEdit =
              (await pageCache.match('/edit')) ||
              (await pageCache.match('/zh/edit')) ||
              (await pageCache.match('/en/edit'));
            if (cachedEdit) {
              return cachedEdit;
            }
          }

          const staticCache = await caches.open(STATIC_CACHE);
          return staticCache.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Never cache dev HMR / turbopack assets.
  if (
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('turbopack') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Static assets: cache first, then network and cache update.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(async (cached) => {
        if (cached) {
          return cached;
        }

        try {
          const response = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          if (url.pathname.startsWith('/_next/static/css/') || url.pathname.endsWith('.css')) {
            return EMPTY_CSS_RESPONSE.clone();
          }
          throw new Error(`Offline and no cache for static asset: ${url.pathname}`);
        }
      })
    );
  }
});
