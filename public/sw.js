// Caching and Fetch handler
const CACHE_NAME = 'carmatch-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([OFFLINE_URL]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/auth')) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.open(CACHE_NAME).then((cache) => {
                    return cache.match(OFFLINE_URL);
                });
            })
        );
        return;
    }

    event.respondWith(fetch(event.request));
});

// Reclamar control inmediatamente
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});


self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json()
            const isSafetyCheck = data.tag && data.tag.startsWith('safety-check-')

            const options = {
                body: data.body,
                icon: data.icon || '/maskable-192-v19.png',
                badge: '/favicon-v19.png',
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
