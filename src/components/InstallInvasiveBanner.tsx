'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Sparkles, X, Smartphone, Globe } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallInvasiveBanner() {
    const { isInstallable, isStandalone, triggerInstall } = usePWAInstall()
    const [isVisible, setIsVisible] = useState(false)
    const [isAndroid, setIsAndroid] = useState(false)

    useEffect(() => {
        // Detectar si es Android
        const ua = navigator.userAgent.toLowerCase()
        const android = ua.includes('android')
        setIsAndroid(android)

        // Mostrar solo si es instalable, no está instalada y es Android
        if (isInstallable && !isStandalone && android) {
            // Verificar si el usuario ya la cerró en esta sesión
            const isDismissed = sessionStorage.getItem('pwa-banner-dismissed')
            if (!isDismissed) {
                // Pequeño delay para no interrumpir la carga inicial
                const timer = setTimeout(() => setIsVisible(true), 3000)
                return () => clearTimeout(timer)
            }
        }
    }, [isInstallable, isStandalone])

    // 🔥 Auto-ocultar después de 1 minuto (60s)
    useEffect(() => {
        if (isVisible) {
            const autoCloseTimer = setTimeout(() => {
                handleDismiss()
            }, 60000) // 1 minuto
            return () => clearTimeout(autoCloseTimer)
        }
    }, [isVisible])

    const handleInstall = async () => {
        const success = await triggerInstall()
        if (success) {
            setIsVisible(false)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        sessionStorage.setItem('pwa-banner-dismissed', 'true')
    }

    if (!isVisible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[1001] bg-slate-900 border-b border-accent-500/30 shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="bg-gradient-to-r from-accent-600/10 via-slate-900 to-accent-600/10 px-4 py-3">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex-shrink-0 w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg ring-2 ring-accent-500/20 overflow-hidden">
                            <Image
                                src="/icon-192-v20.png"
                                alt="CarMatch Logo"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-black text-white text-sm sm:text-base uppercase tracking-tight leading-none mb-1 truncate">
                                🔥 CarMatch Social App Oficial
                            </h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight truncate">
                                Instala la experiencia nativa para vender 10x más rápido
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleDismiss}
                            className="hidden sm:block text-slate-500 hover:text-white px-3 py-2 text-xs font-bold transition"
                        >
                            Ahora no
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-accent-600/20 ring-1 ring-white/20"
                        >
                            <Smartphone size={14} />
                            Instalar
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="sm:hidden p-2 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
            {/* Barra de progreso decorativa inferior */}
            <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-accent-500 animate-progress origin-left"></div>
            </div>
        </div>
    )
}
