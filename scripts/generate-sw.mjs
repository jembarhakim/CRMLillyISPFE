// Generates .output/public/sw.js and .output/public/manifest.webmanifest.
//
// Why a custom script: workbox-build (used by @vite-pwa/nuxt) throws
// "Cannot read properties of undefined (reading 'Symbol(ProxyTarget)')"
// inside the Nuxt/Nitro build context. This script implements the same
// behaviour with plain Web API code: precache the app shell, network-only for
// /api, cache-first for images, and an /offline navigation fallback.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const PUBLIC_DIR = '.output/public';
const PRECACHE_PATTERN = /\.(js|css|html|png|svg|ico|webp|woff2)$/;
const CACHE_NAME = 'lilly-portal-v1';
const OFFLINE_URL = '/offline';
const MANIFEST = {
  name: 'Lilly Networks - Portal Pelanggan',
  short_name: 'Lilly ISP',
  description: 'Cek tagihan, bayar online, dan laporkan gangguan internet Lilly Networks.',
  lang: 'id',
  id: '/',
  start_url: '/customer',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui', 'browser'],
  orientation: 'portrait',
  background_color: '#f3f4f6',
  theme_color: '#16a34a',
  categories: ['business', 'utilities'],
  icons: [
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    {
      name: 'Tagihan',
      short_name: 'Tagihan',
      url: '/customer/bills',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
    {
      name: 'Lapor Gangguan',
      short_name: 'Keluhan',
      url: '/customer/tickets',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
  ],
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (PRECACHE_PATTERN.test(entry)) files.push(full);
  }
  return files;
}

if (!existsSync(PUBLIC_DIR)) {
  console.error('[generate-sw] .output/public not found. Run `nuxt build` first.');
  process.exit(1);
}

// 1. Web App Manifest ------------------------------------------------------
writeFileSync(join(PUBLIC_DIR, 'manifest.webmanifest'), JSON.stringify(MANIFEST, null, 2));

// 2. Precache list ---------------------------------------------------------
const precache = walk(PUBLIC_DIR)
  .filter((file) => !file.endsWith('sw.js') && !file.endsWith('manifest.webmanifest'))
  .map((file) => ({
    url: '/' + relative(PUBLIC_DIR, file).replace(/\\/g, '/'),
    revision: createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 12),
  }));

// 3. Service worker --------------------------------------------------------
const sw = `/* Lilly Networks customer portal service worker (generated) */
const CACHE = '${CACHE_NAME}';
const OFFLINE_URL = '${OFFLINE_URL}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(
        PRECACHE.map((entry) => cache.add(new Request(entry.url, { cache: 'reload' })).catch(() => undefined))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. API: always network (billing data must never be stale).
  if (url.pathname.startsWith('/api')) return;

  // 2. Navigations: network first, cached page, then the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:2rem;text-align:center"><h2>Tidak ada koneksi</h2><p>Periksa koneksi internet Anda lalu coba lagi.</p></body>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 3. Images / uploads / assets: cache first, then network.
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached)
    )
  );
});
`;

writeFileSync(join(PUBLIC_DIR, 'sw.js'), sw);

// 4. Client registration ---------------------------------------------------
writeFileSync(
  join(PUBLIC_DIR, 'register-sw.js'),
  `if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('[pwa] service worker registration failed:', error);
    });
  });
}
`
);

console.log(`[generate-sw] manifest.webmanifest, sw.js and register-sw.js written (${precache.length} precache entries)`);
