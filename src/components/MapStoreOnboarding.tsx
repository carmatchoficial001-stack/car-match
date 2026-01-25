"use client"

import { useState, useEffect } from 'react'
import { Plus, X, MapPin, Wrench, Store } from 'lucide-react'
import Link from 'next/link'

export default function MapStoreOnboarding() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Mostrar después de 1 segundo para no estorbar la carga inicial del mapa
        const timer = setTimeout(() => {
            // Verificar si ya lo cerró antes (opcional, por ahora siempre mostrar para testing)
            const hasSeen = localStorage.getItem('mapstore_onboarding_seen')
            if (!hasSeen) {
                setIsVisible(true)
            }
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        localStorage.setItem('mapstore_onboarding_seen', 'true')
    }

    if (!isVisible) return null

    return (
        <div className="absolute top-4 left-4 right-4 z-20 animate-in slide-in-from-top-2 fade-in duration-700 flex justify-center">
            <div className="bg-surface/95 backdrop-blur-md border border-primary-500/30 rounded-full shadow-lg overflow-hidden relative group max-w-4xl w-full">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>

                <div className="flex items-center justify-between px-2 py-1.5 md:p-2 gap-3">
                    {/* Icon & Text Section */}
                    <div className="flex items-center gap-3 pl-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
                            <Store className="text-primary-400" size={16} />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 overflow-hidden">
                            <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                                ¿Tienes un Negocio?
                            </span>
                            <span className="hidden md:inline text-text-secondary text-xs">•</span>
                            <span className="text-[10px] md:text-xs text-text-secondary truncate">
                                Sube tu taller o servicio al MapStore
                            </span>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/my-businesses?action=new"
                            className="px-4 py-1.5 bg-primary-600 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide hover:bg-primary-500 transition-all shadow-md whitespace-nowrap"
                        >
                            ¡Subir Gratis!
                        </Link>

                        <button
                            onClick={handleClose}
                            className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
