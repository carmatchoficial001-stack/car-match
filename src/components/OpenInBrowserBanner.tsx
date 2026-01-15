"use client"

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { useWebViewDetection } from '@/hooks/useWebViewDetection'

export default function OpenInBrowserBanner() {
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

    const getInstructions = () => {
        const isAndroid = navigator.userAgent.toLowerCase().includes('android')
        const appName = getAppName()

        if (isAndroid) {
            return `Toca el menú (⋮) y selecciona "Abrir en Chrome" para poder instalar CarMatch.`
        } else {
            return `Toca el botón de compartir y selecciona "Abrir en Safari" para poder instalar CarMatch.`
        }
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[999] bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 shadow-lg">
            <div className="flex items-start gap-3 max-w-4xl mx-auto">
                <ExternalLink className="flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm mb-1">
                        📱 Estás navegando desde {getAppName()}
                    </p>
                    <p className="text-xs opacity-90">
                        {getInstructions()}
                    </p>
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
    )
}
