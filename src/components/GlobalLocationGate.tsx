"use client"

import { useLocation } from "@/contexts/LocationContext"
import { useState, useEffect } from "react"
import { MapPin, Navigation, Search, Globe } from "lucide-react"
import { searchCities, LocationData } from "@/lib/geolocation"

export default function GlobalLocationGate() {
    const { location, loading, error, setManualLocation, refreshLocation } = useLocation()
    const [isSearching, setIsSearching] = useState(false)
    const [input, setInput] = useState("")
    const [candidates, setCandidates] = useState<LocationData[]>([])
    const [searchError, setSearchError] = useState<string | null>(null)
    const [mode, setMode] = useState<'INITIAL' | 'SEARCH'>('INITIAL')

    // Si está cargando o ya tenemos ubicación, no mostramos nada
    if (loading || location) return null

    // Si no hay loading y no hay location, es porque falló la detección automática
    // Mostramos el modal OBLIGATORIO (Global Gate)

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setIsSearching(true)
        setSearchError(null)
        setCandidates([])

        try {
            const results = await searchCities(input)
            if (results.length === 0) {
                setSearchError("No encontramos esa ciudad. Intenta con 'Ciudad, País'")
            } else {
                setCandidates(results)
            }
        } catch (err) {
            setSearchError("Error de conexión. Intenta de nuevo.")
        } finally {
            setIsSearching(false)
        }
    }

    const selectCity = (loc: LocationData) => {
        setManualLocation(loc)
        // El modal desaparecerá automáticamente porque location ya no será null
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#111114] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
                        <Globe className="w-8 h-8 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-black italic text-white mb-2">
                        ¿Dónde te encuentras?
                    </h2>
                    <p className="text-text-secondary text-sm">
                        CarMatch es una plataforma global. Necesitamos tu ubicación para mostrarte vehículos cercanos.
                    </p>
                </div>

                {mode === 'INITIAL' ? (
                    <div className="space-y-4 relative z-10">
                        <button
                            onClick={() => refreshLocation()}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group"
                        >
                            <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                            Detectar mi Ubicación
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-text-secondary uppercase tracking-widest">O manual</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <button
                            onClick={() => setMode('SEARCH')}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Search className="w-5 h-5" />
                            Escribir Ciudad
                        </button>
                    </div>
                ) : (
                    <div className="relative z-10 animate-in slide-in-from-right-4">
                        <button
                            onClick={() => setMode('INITIAL')}
                            className="absolute -top-12 left-0 text-text-secondary hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                        >
                            ← Volver
                        </button>

                        <form onSubmit={handleManualSearch} className="mb-4">
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary-500 focus:outline-none placeholder:text-white/20"
                                    placeholder="Ej: Monterrey, Madrid, Bogotá..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isSearching}
                                className="w-full mt-3 py-3 bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all"
                            >
                                {isSearching ? 'Buscando...' : 'Buscar Ciudad'}
                            </button>
                        </form>

                        {searchError && (
                            <p className="text-red-400 text-xs text-center mb-4 bg-red-500/10 py-2 rounded-lg border border-red-500/20">{searchError}</p>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {candidates.map((cand, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectCity(cand)}
                                    className="w-full text-left p-3 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-white/10"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">{
                                            cand.countryCode === 'MX' ? '🇲🇽' :
                                                cand.countryCode === 'US' ? '🇺🇸' :
                                                    cand.countryCode === 'ES' ? '🇪🇸' :
                                                        cand.countryCode === 'CO' ? '🇨🇴' : '🌍'
                                        }</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{cand.city}</p>
                                        <p className="text-xs text-text-secondary">{cand.state}, {cand.country}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
