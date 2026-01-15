"use client"

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ExternalLink, X, Chrome } from 'lucide-react'
import { useWebViewDetection } from '@/hooks/useWebViewDetection'

export default function OpenInBrowserBanner() {
    const pathname = usePathname()

    // No mostrar en rutas admin
    if (pathname?.startsWith('/admin')) {
        return null
    }

    const { isWebView, webViewType } = useWebViewDetection()
    const [dismissed, setDismissed] = useState(false)

    if (!isWebView || dismissed) return null

    const getAppName = () => {
        switch (webViewType) {
            case 'whatsapp': return 'WhatsApp'
            case 'facebook': return 'Facebook'
            case 'telegram': return 'Telegram'
            case 'instagram': return 'Instagram'
            default: return 'esta app'
        }
    }

    const handleOpenInBrowser = () => {
        const currentUrl = window.location.href
        const isAndroid = navigator.userAgent.toLowerCase().includes('android')

        if (isAndroid) {
            // Android: Intentar abrir con Intent URL
            const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`
            window.location.href = intentUrl

            // Fallback después de 1 segundo si no funcionó
            setTimeout(() => {
                window.open(currentUrl, '_blank')
            }, 1000)
        } else {
            // iOS: Usar esquema especial de Safari
            window.location.href = `x-safari-${currentUrl}`

            // Fallback
            setTimeout(() => {
                window.open(currentUrl, '_blank')
            }, 1000)
        }
    }

    const getInstructions = () => {
        const isAndroid = navigator.userAgent.toLowerCase().includes('android')
        if (isAndroid) {
            return `Para descargar CarMatch en tu celular, necesitas abrirlo en Chrome`
        } else {
            return `Para descargar CarMatch en tu celular, necesitas abrirlo en Safari`
        }
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[999] bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
            <div className="px-4 py-3 max-w-4xl mx-auto">
                <div className="flex items-start gap-3">
                    <ExternalLink className="flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-1">
                            📱 Estás en {getAppName()}
                        </p>
                        <p className="text-xs opacity-90 mb-3">
                            {getInstructions()}
                        </p>
                        <button
                            onClick={handleOpenInBrowser}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm hover:bg-orange-50 transition active:scale-95 shadow-md w-full justify-center sm:w-auto"
                        >
                            <Chrome size={16} />
                            Abrir para Descargar App
                        </button>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
