const CACHE_NAME = 'cinema-app-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                // Otherwise, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Optionally, cache the fetched response for future use
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(() => {
                        // Handle offline case or network failure
                        return caches.match('/offline.html'); // Fallback page
                    });
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});