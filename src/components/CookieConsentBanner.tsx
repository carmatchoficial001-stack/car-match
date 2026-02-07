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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-5xl mx-auto bg-surface border-2 border-primary-500/30 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg">
                                <Cookie className="text-orange-500" size={20} />
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-text-primary">
                                🍪 Cookies
                            </h3>
                        </div>
                        <button
                            onClick={acceptCookies}
                            className="p-1.5 hover:bg-surface-highlight rounded-lg transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={18} className="text-text-secondary" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <p className="text-text-secondary text-xs md:text-sm leading-relaxed">
                            Usamos <strong className="text-text-primary">cookies esenciales</strong> y{' '}
                            <strong className="text-text-primary">Google Analytics</strong> para mejorar tu experiencia.
                        </p>

                        {/* Links */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            <Link
                                href="/privacy"
                                className="text-primary-400 hover:text-primary-300 underline"
                                onClick={() => setShowBanner(false)}
                            >
                                Privacidad
                            </Link>
                            <Link
                                href="/cookies"
                                className="text-primary-400 hover:text-primary-300 underline"
                                onClick={() => setShowBanner(false)}
                            >
                                Cookies
                            </Link>
                            <Link
                                href="/terms"
                                className="text-primary-400 hover:text-primary-300 underline"
                                onClick={() => setShowBanner(false)}
                            >
                                Términos
                            </Link>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={acceptCookies}
                                className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition-all"
                            >
                                ✅ Aceptar
                            </button>
                            <button
                                onClick={rejectCookies}
                                className="flex-1 px-4 py-2.5 bg-surface-highlight hover:bg-surface border border-surface-highlight text-text-secondary hover:text-text-primary text-sm font-medium rounded-xl transition-all"
                            >
                                Solo esenciales
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
