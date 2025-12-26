"use client"

import { useState, useEffect } from 'react'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission)
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true)
                        setSubscription(sub)
                    }
                })
            })
        }
    }, [])

    const subscribe = async () => {
        if (!('serviceWorker' in navigator)) return

        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY!)
            })

            // Guardar en backend
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            })

            setIsSubscribed(true)
            setSubscription(sub)
            setPermission('granted')
            alert('¡Notificaciones Activadas! 🔔')

        } catch (error) {
            console.error('Error suscribiendo a push:', error)
            alert('Error activando notificaciones. Revisa permisos.')
        }
    }

    return { isSubscribed, subscribe, permission }
}
