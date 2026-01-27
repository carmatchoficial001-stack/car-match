'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

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
    const { data: session, status } = useSession()
    const [showPrompt, setShowPrompt] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (status !== 'authenticated') return

        // Solo mostrar si las notificaciones están soportadas y en estado 'default'
        if ('Notification' in window && Notification.permission === 'default') {
            const timer = setTimeout(() => setShowPrompt(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [status])

    const subscribeUser = async () => {
        if (!session?.user?.id) {
            alert('Debes iniciar sesión para activar las notificaciones')
            return
        }

        setIsLoading(true)

        try {
            // Verificar soporte de Service Worker
            if (!('serviceWorker' in navigator)) {
                throw new Error('Tu navegador no soporta notificaciones push')
            }

            // Esperar a que el Service Worker esté listo
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Tiempo de espera agotado')), 5000)
                )
            ]) as ServiceWorkerRegistration

            // Verificar VAPID Key
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                throw new Error('Error de configuración del servidor')
            }

            // Solicitar permiso
            const permissionResult = await Notification.requestPermission()

            if (permissionResult !== 'granted') {
                setShowPrompt(false)
                return
            }

            // ✅ CERRAR MODAL INMEDIATAMENTE después de que usuario acepta
            setShowPrompt(false)

            // Crear suscripción
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

            if (!response.ok) {
                throw new Error('Error al guardar la suscripción')
            }


        } catch (error: any) {
            console.error('Push Error:', error)
            alert(error.message || 'Error al activar las notificaciones')
            setShowPrompt(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
    }

    // No mostrar si no está autenticado o si ya no debe mostrarse
    if (status !== 'authenticated' || !showPrompt) {
        return null
    }

    return (
        <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-surface border border-primary-500/20 rounded-xl shadow-2xl p-4 max-w-sm md:ml-auto relative overflow-hidden">
                {/* Barra lateral de acento */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>

                {/* Botón cerrar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-text-secondary hover:text-text-primary transition"
                    aria-label="Cerrar"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4">
                    {/* Ícono */}
                    <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="text-primary-600" size={24} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 pr-6">
                        <h4 className="font-bold text-text-primary mb-1">Activar Notificaciones</h4>
                        <p className="text-sm text-text-secondary mb-4">
                            Recibe alertas de mensajes y favoritos.
                        </p>

                        {/* Botones */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition"
                            >
                                Ahora no
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
