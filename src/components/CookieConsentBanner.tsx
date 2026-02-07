'use client'

import { useEffect, useState } from 'react'
import { Cookie, X } from 'lucide-react'
import Link from 'next/link'

export default function CookieConsentBanner() {
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // Check if user already accepted cookies
        const hasConsented = localStorage.getItem('cookieConsent')
        if (!hasConsented) {
            // Show banner after 2 seconds
            const timer = setTimeout(() => setShowBanner(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'accepted')
        setShowBanner(false)
    }

    const rejectCookies = () => {
        localStorage.setItem('cookieConsent', 'rejected')
        setShowBanner(false)
        // Disable Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any)['ga-disable-G-Q84TC96LDB'] = true
        }
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-5xl mx-auto bg-surface border-2 border-primary-500/30 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Cookie className="text-orange-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">
                                🍪 Cookies y Privacidad
                            </h3>
                        </div>
                        <button
                            onClick={rejectCookies}
                            className="p-2 hover:bg-surface-highlight rounded-lg transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Usamos <strong className="text-text-primary">cookies esenciales</strong> para que CarMatch Social funcione correctamente,
                            y <strong className="text-text-primary">Google Analytics</strong> para analizar cómo usas la plataforma y mejorarla.
                            Al aceptar, nos ayudas a ofrecerte una mejor experiencia.
                        </p>

                        {/* Technology badges */}
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                                ✅ Cookies esenciales
                            </span>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
                                📊 Google Analytics
                            </span>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap gap-4 text-xs">
                            <Link
                                href="/privacy"
                                className="text-primary-400 hover:text-primary-300 underline"
                            >
                                Aviso de Privacidad
                            </Link>
                            <Link
                                href="/cookies"
                                className="text-primary-400 hover:text-primary-300 underline"
                            >
                                Política de Cookies
                            </Link>
                            <Link
                                href="/terms"
                                className="text-primary-400 hover:text-primary-300 underline"
                            >
                                Términos y Condiciones
                            </Link>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={acceptCookies}
                                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                ✅ Aceptar todo
                            </button>
                            <button
                                onClick={rejectCookies}
                                className="flex-1 px-6 py-3 bg-surface-highlight hover:bg-surface border border-surface-highlight text-text-secondary hover:text-text-primary font-medium rounded-xl transition-all"
                            >
                                Solo esenciales
                            </button>
                        </div>

                        <p className="text-xs text-text-secondary opacity-60 text-center">
                            Puedes cambiar tus preferencias en cualquier momento desde Configuración
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
