
// Fetch handler (Requerido para que la PWA sea instalable)
self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    // 🚀 NO interceptar llamadas de autenticación ni de la propia API de NextAuth
    // Esto previene el error "Failed to fetch" cuando el SW intenta manejar el flujo de auth.
    if (url.pathname.startsWith('/api/auth')) {
        return;
    }

    // Por ahora, simplemente dejamos que las peticiones pasen para cumplir con el requisito de PWA.
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: '/icon-192-v6.png',
            badge: '/icon-192-v6.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
                url: data.url || '/'
            },
            actions: [
                { action: 'explore', title: 'Ver Ahora' },
                { action: 'close', title: 'Cerrar' },
            ]
        }
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        )
    }
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    )
})

// Saltar espera cuando hay nueva versión
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
