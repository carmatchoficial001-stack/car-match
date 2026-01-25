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
        <div className="absolute top-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-20 animate-in slide-in-from-top-4 fade-in duration-700">
            <div className="bg-surface/95 backdrop-blur-xl border border-primary-500/30 rounded-2xl shadow-2xl overflow-hidden relative group">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500"></div>

                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-1.5 text-text-secondary hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all z-10"
                >
                    <X size={14} />
                </button>

                <div className="p-5 relative">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-900/50 shrink-0">
                            <Store className="text-white" size={24} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-black text-white leading-tight mb-1">
                                ¿Tienes un Negocio?
                            </h3>
                            <p className="text-xs text-text-secondary font-medium leading-relaxed mb-4">
                                Únete a la red más grande de servicios automotrices. <br />
                                <span className="text-primary-300">¡Sube tu taller, refaccionaria o servicio mecánico al MapStore!</span>
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Talleres', 'Llanteras', 'Grúas', 'Car Wash'].map((item) => (
                                    <span key={item} className="px-2 py-0.5 bg-surface-highlight/50 border border-white/5 rounded-md text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                                        {item}
                                    </span>
                                ))}
                            </div>

                            <Link
                                href="/my-businesses?action=new"
                                className="block w-full py-2.5 bg-white text-primary-950 text-center rounded-lg font-black text-xs uppercase tracking-widest hover:bg-primary-50 active:scale-[0.98] transition-all shadow-lg"
                            >
                                ¡Súbelo Gratis Aquí!
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
