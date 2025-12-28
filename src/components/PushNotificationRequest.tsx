'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

// Función auxiliar para convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function PushNotificationRequest() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [permission, setPermission] = useState('default')

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission)
            // Mostrar prompt si no ha decidido y han pasado unos segundos
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => setShowPrompt(true), 5000)
                return () => clearTimeout(timer)
            }
        }
    }, [])

    const [isLoading, setIsLoading] = useState(false)

    const subscribeUser = async () => {
        setIsLoading(true)
        try {
            // Race condition: wait for SW ready or timeout after 3s
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Service Worker registration timeout')), 3000)
                )
            ]) as ServiceWorkerRegistration

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!vapidKey) {
                console.error('Missing VAPID key')
                alert('Error de configuración: Contacta al administrador')
                return
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })

            // Enviar al backend
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            if (!response.ok) throw new Error('Failed to sync with server')

            setPermission('granted')
            setShowPrompt(false)
            console.log('Push subscription success!')
            // Opcional: Mostrar toast de éxito aquí

        } catch (error) {
            console.error('Failed to subscribe to push:', error)
            setPermission('denied')
            alert('No pudimos activar las notificaciones. Verifica los permisos de tu navegador.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!showPrompt || permission !== 'default') return null

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-surface border border-primary-500/20 rounded-xl shadow-2xl p-4 max-w-sm ml-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="text-primary-600" size={24} />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-text-primary mb-1">Activar Notificaciones</h4>
                        <p className="text-sm text-text-secondary mb-3">
                            Recibe alertas cuando alguien vea tu vehículo o te envíe mensaje.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition"
                            >
                                Después
                            </button>
                            <button
                                onClick={subscribeUser}
                                disabled={isLoading}
                                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-primary-500/20"
                            >
                                {isLoading ? 'Activando...' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
