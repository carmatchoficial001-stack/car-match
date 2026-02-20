const CACHE_NAME = 'carmatch-v1.1.0';
const OFFLINE_URL = '/offline.html';

const PRE_CACHE_RESOURCES = [
    OFFLINE_URL,
    '/',
    '/market',
    '/swipe',
    '/map',
    '/favicon-v19.png',
    '/icon-192-v20.png',
    '/logo-v19.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRE_CACHE_RESOURCES);
        })
    );
    self.skipWaiting();
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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip Auth and non-GET requests
    if (url.pathname.startsWith('/api/auth') || event.request.method !== 'GET') {
        return;
    }

    // Cache First for Images and Static Assets
    if (event.request.destination === 'image' ||
        event.request.destination === 'style' ||
        event.request.destination === 'script' ||
        event.request.destination === 'font') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // Network First for Navigation
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request).then((match) => {
                    return match || caches.match(OFFLINE_URL);
                });
            })
        );
        return;
    }

    // Default: try network, then cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});


self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json()
            const isSafetyCheck = data.tag && data.tag.startsWith('safety-check-')

            const options = {
                body: data.body,
                icon: data.icon || '/maskable-192-v19.png?v=21',
                badge: '/favicon-v19.png?v=21',
                vibrate: data.vibrate || (isSafetyCheck ? [500, 100, 500, 100, 500] : [100, 50, 100]),

                data: {
                    dateOfArrival: Date.now(),
                    url: data.url || '/',
                    appointmentId: isSafetyCheck ? data.tag.replace('safety-check-', '') : null
                },
                actions: isSafetyCheck ? [
                    { action: 'sos', title: '🚨 SOS' },
                    { action: 'still', title: '🤝 Aún sigo' },
                    { action: 'finish', title: '✅ Ya terminó' }
                ] : [
                    { action: 'explore', title: 'Ver Ahora' }
                ],
                tag: data.tag || (isSafetyCheck ? 'safety-check' : 'carmatch-notification'),
                renotify: data.renotify !== undefined ? data.renotify : true,
                requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : isSafetyCheck
            }
            event.waitUntil(
                self.registration.showNotification(data.title || 'CarMatch', options)
            )
        } catch (e) {
            console.error('Error parseando push data:', e)
            // 🛡️ FALLBACK: Siempre mostrar ALGO para evitar la "Notificación Fantasma" de Chrome
            // Chrome castiga si llega un push y no se muestra nada.
            const title = 'CarMatch'
            const options = {
                body: 'Tienes una nueva actualización.',
                icon: '/icon-192-v20.png?v=22',
                badge: '/favicon-v19.png?v=21',
                tag: 'fallback-notification',
                renotify: true
            }
            event.waitUntil(
                self.registration.showNotification(title, options)
            )
        }
    }
})

self.addEventListener('notificationclick', function (event) {
    const notification = event.notification
    const action = event.action
    const appointmentId = notification.data.appointmentId
    const urlToOpen = notification.data.url || '/'

    notification.close()

    if (appointmentId && action && action !== 'explore') {
        const endpoint = `/api/appointments/${appointmentId}/safety-check`
        const payload = { action: action.toUpperCase() }

        event.waitUntil(
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                if (action === 'sos') {
                    return clients.matchAll({ type: 'window', includeUncontrolled: true })
                        .then(function (windowClients) {
                            for (let i = 0; i < windowClients.length; i++) {
                                const client = windowClients[i]
                                if (client.url.includes(urlToOpen) && 'focus' in client) {
                                    return client.focus()
                                }
                            }
                            if (clients.openWindow) {
                                return clients.openWindow(urlToOpen + '?trigger_sos=true')
                            }
                        })
                }
            })
        )
        return
    }

    // Comportamiento por defecto
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (windowClients) {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i]
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus()
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen)
                }
            })
    )
})

// Saltar espera cuando hay nueva versión
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
