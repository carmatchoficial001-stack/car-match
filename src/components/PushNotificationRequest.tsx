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
    const [debugLogs, setDebugLogs] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Helper para logs
    const addLog = (msg: string) => setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission)
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => setShowPrompt(true), 2000)
                return () => clearTimeout(timer)
            }
        } else {
            addLog('❌ Este navegador no soporta notificaciones')
        }
    }, [])

    const subscribeUser = async () => {
        setIsLoading(true)
        setDebugLogs([]) // Limpiar logs anteriores
        addLog('🚀 Iniciando proceso de activación...')

        try {
            // 1. Verificar Service Worker Environment
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker no soportado en este navegador')
            }
            addLog('✅ Service Worker soportado')

            // 2. Verificar Registro y Estado
            addLog('⏳ Esperando Service Worker Ready...')

            // Race condition timeout
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT: Service Worker no respondió en 5s')), 5000)
                )
            ]) as ServiceWorkerRegistration

            addLog(`✅ Service Worker Ready (Scope: ${registration.scope})`)

            if (!registration.active) {
                addLog('⚠️ SW registrado pero no activo. Intentando reactivar...')
            }

            // 3. Verificar VAPID Key
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) throw new Error('❌ Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY')
            addLog(`✅ VAPID Key encontrada (${vapidKey.substring(0, 10)}...)`)

            // 4. Solicitar Permiso de Notificación
            addLog('⏳ Solicitando permiso al usuario...')
            const permissionResult = await Notification.requestPermission()
            addLog(`Respuesta usuario: ${permissionResult}`)

            if (permissionResult !== 'granted') {
                throw new Error('Permiso denegado por el usuario')
            }

            // 5. Suscribirse en PushManager
            addLog('⏳ Creando suscripción en navegador...')
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })
            addLog('✅ Suscripción de navegador creada')

            // 6. Enviar al Backend
            addLog('⏳ Enviando a servidor...')
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(`Error servidor: ${response.status} - ${errorData.error || 'Unknown'}`)
            }

            addLog('✅ ¡ÉXITO! Suscripción guardada en BD.')
            setPermission('granted')

            // Delay para que el usuario pueda leer los logs de éxito antes de cerrar
            setTimeout(() => setShowPrompt(false), 3000)

        } catch (error: any) {
            console.error('Push Error:', error)
            addLog(`❌ ERROR FATAL: ${error.message || error}`)
            alert(`Error: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (!showPrompt && debugLogs.length === 0) return null
    if (permission === 'granted' && debugLogs.length === 0) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-surface border border-primary-500/20 rounded-xl shadow-2xl p-4 max-w-sm ml-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="text-primary-600" size={24} />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-text-primary mb-1">Activar Notificaciones</h4>
                        <p className="text-sm text-text-secondary mb-3">
                            Recibe alertas de mensajes y favoritos.
                            <br/>
                            <span className="text-[10px] text-gray-500 font-mono">
                                v2.0-DEBUG | VAPID: {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'OK' : 'MISSING'}
                            </span>
                        </p>

                        {/* DEBUG CONSOLE */}
                        {debugLogs.length > 0 && (
                            <div className="mb-3 p-2 bg-black/90 rounded text-[10px] font-mono text-green-400 h-32 overflow-y-auto border border-green-900 shadow-inner">
                                {debugLogs.map((log, i) => (
                                    <div key={i} className="border-b border-green-900/30 pb-0.5 mb-0.5">{log}</div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowPrompt(false); setDebugLogs([]) }}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={subscribeUser}
                                disabled={isLoading}
                                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-primary-500/20"
                            >
                                {isLoading ? 'Procesando...' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
