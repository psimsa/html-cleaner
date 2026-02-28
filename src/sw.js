const CACHE_NAME = 'html-cleaner-v4';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/cleaner.js',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/og-image.png'
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
            cache.match(event.request).then((cached) => {
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        if (response && response.status === 200 && response.type === 'basic') {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch((err) => {
                        console.warn('SW fetch failed for', event.request.url, err);
                        return null;
                    });

                return cached || networkFetch;
            })
        )
    );
});
