const CACHE_NAME = 'html-cleaner-v6';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/cleaner.js',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/og-image.png',
    'https://unpkg.com/turndown@7.2.2/dist/turndown.js',
    'https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return Promise.all(
                    ASSETS.map((url) =>
                        fetch(new Request(url, { cache: 'no-cache' }))
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error(`Failed to cache ${url}: ${response.status}`);
                                }
                                return cache.put(url, response);
                            })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    // Network-first for navigation requests: always fetch fresh HTML from the
    // network so users see the latest version immediately after a deployment.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request)
                        .then((cached) => cached || caches.match('/index.html'))
                )
        );
        return;
    }

    // Stale-while-revalidate for all other assets: serve from cache immediately
    // for speed, but update the cache entry in the background so the next load
    // gets the latest version.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) =>
            cache.match(event.request, { ignoreVary: true }).then((cached) => {
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        if (response && response.status === 200 &&
                            (response.type === 'basic' ||
                             (response.type === 'cors' && new URL(event.request.url).hostname === 'unpkg.com'))) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch((err) => {
                        console.warn('SW fetch failed for', event.request.url, err);
                        return new Response('Service Unavailable', { status: 503 });
                    });

                return cached || networkFetch;
            })
        )
    );
});
