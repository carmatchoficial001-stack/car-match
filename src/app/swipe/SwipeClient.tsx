// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER (Frontera Digital)
// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import SwipeFeed from '@/components/SwipeFeed'
import Header from '@/components/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, RefreshCw, Search } from 'lucide-react'
import { calculateDistance, searchCity, normalizeCountryCode } from '@/lib/geolocation'

interface FeedItem {
    id: string
    userId: string
    title: string
    feedType: 'VEHICLE' | 'BUSINESS'
    brand?: string
    model?: string
    category?: string
    year?: number
    price?: number
    city: string
    latitude: number | null
    longitude: number | null
    country?: string | null
    images?: string[]
    isFavorited?: boolean
    isBoosted?: boolean
    user: {
        name: string
        image: string | null
    }
    _count?: {
        favorites: number
    }
}

interface SwipeClientProps {
    initialItems: FeedItem[]
    currentUserId: string
}

function boostShuffleArray(array: FeedItem[]): FeedItem[] {
    const boosted = array.filter(item => item.isBoosted)
    const regular = array.filter(item => !item.isBoosted)

    for (let i = regular.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regular[i], regular[j]] = [regular[j], regular[i]];
    }

    for (let i = boosted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boosted[i], boosted[j]] = [boosted[j], boosted[i]];
    }

    const result: FeedItem[] = []

    const initialBoost = boosted.slice(0, 3)
    const remainingBoost = boosted.slice(3)

    result.push(...initialBoost)

    let bIndex = 0
    let rIndex = 0

    while (rIndex < regular.length || bIndex < remainingBoost.length) {
        for (let k = 0; k < 3 && rIndex < regular.length; k++) {
            result.push(regular[rIndex++])
        }
        if (bIndex < remainingBoost.length) {
            result.push(remainingBoost[bIndex++])
        }
    }

    return result
}

export default function SwipeClient({ initialItems, currentUserId }: SwipeClientProps) {
    const { t } = useLanguage()
    const { location, loading: locationLoading, setManualLocation } = useLocation()

    const items = initialItems

    // ANILLOS PROGRESIVOS
    const RADIUS_TIERS = [12, 100, 250, 500, 1000, 2500, 5000]
    const STORAGE_KEY = 'carmatch_swipe_seen_v1'

    const [tierIndex, setTierIndex] = useState(0)
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
    const [isInternalLoading, setIsInternalLoading] = useState(false)

    // Modal State
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationInput, setLocationInput] = useState('')

    const currentRadius = RADIUS_TIERS[tierIndex]

    // 1. Cargar historial
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                const now = Date.now()
                const validIds = new Set<string>()
                if (Array.isArray(parsed)) {
                    parsed.forEach((item: any) => {
                        const id = typeof item === 'string' ? item : item.id
                        const ts = typeof item === 'string' ? now : item.timestamp
                        if (now - ts < 24 * 60 * 60 * 1000) validIds.add(id)
                    })
                }
                setSeenIds(validIds)
            } catch (e) { setSeenIds(new Set()) }
        }
    }, [])

    // 2. MAZO ESTABLE CON FRONTERA DIGITAL
    const stablePool = useMemo(() => {
        if (locationLoading || !location) return []

        const userCountry = normalizeCountryCode(location?.country)

        const withDist = items
            .filter((item: FeedItem) => {
                // 🔐 FRONTERA DIGITAL ESTRICTA
                // Solo mostrar vehículos del mismo país que la ubicación del usuario.
                const itemCountry = normalizeCountryCode(item.country)
                return itemCountry === userCountry
            })
            .map((item: FeedItem) => {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    item.latitude || 0,
                    item.longitude || 0
                )
                return { ...item, distance }
            })

        const tiers = RADIUS_TIERS.map(r => ({ max: r, items: [] as any[] }))

        withDist.forEach(item => {
            const tier = tiers.find(t => item.distance <= t.max) || tiers[tiers.length - 1]
            tier.items.push(item)
        })

        return tiers.reduce((acc, ss) => [...acc, ...boostShuffleArray(ss.items)], [] as any[])
    }, [items, location, locationLoading])

    // 3. FILTRADO FINAL
    const nearbyItems = useMemo(() => {
        const stack = stablePool.filter(v => v.distance <= currentRadius && !seenIds.has(v.id))
        return stack
    }, [stablePool, seenIds, currentRadius])

    const expandSearch = useCallback(() => {
        setIsInternalLoading(true)
        setSeenIds(new Set());
        localStorage.removeItem(STORAGE_KEY);
        setTierIndex(prev => (prev + 1) % RADIUS_TIERS.length);
        setTimeout(() => setIsInternalLoading(false), 400)
    }, [RADIUS_TIERS.length])

    const markAsSeen = (id: string) => {
        setSeenIds(prev => {
            const next = new Set(prev)
            next.add(id)
            const saved = localStorage.getItem(STORAGE_KEY)
            let entries: any[] = saved ? JSON.parse(saved) : []
            entries.push({ id, timestamp: Date.now() })
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-500)))
            return next
        })
    }

    const handleLike = async (id: string) => {
        markAsSeen(id)
        try {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleId: id, action: 'add' })
            })
            window.dispatchEvent(new CustomEvent('favoriteUpdated'))
        } catch (e) { }
    }

    const handleDislike = (id: string) => markAsSeen(id)

    // Manual Search Handler
    const searchManualLocation = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!locationInput.trim()) return
        const result = await searchCity(locationInput)
        if (result) {
            setManualLocation(result) // Global Context Update
            setTierIndex(0) // Reset radius logic locally
            setSeenIds(new Set()) // Reset seen stack
            setShowLocationModal(false)
        }
    }

    const isLoading = locationLoading || isInternalLoading

    return (
        <div className="flex flex-col min-h-screen bg-background text-text-primary">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-10 pb-20 flex flex-col items-center justify-center">

                {/* El indicador de radio se movió dentro de los estados específicos */}

                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-primary-700 animate-spin mb-4" />
                        <p className="text-text-secondary animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : nearbyItems.length === 0 ? (
                    <div className="bg-surface rounded-3xl shadow-2xl p-10 text-center border border-white/5 max-w-sm w-full animate-in zoom-in duration-300 flex flex-col items-center">

                        {/* 📍 Radio Badge movido aquí por petición del usuario */}
                        <button
                            onClick={() => setShowLocationModal(true)}
                            className="mb-8 px-4 py-2 bg-primary-700/10 hover:bg-primary-700/20 active:scale-95 transition-all text-white text-xs rounded-full border border-primary-500/20 shadow-sm flex items-center gap-2 cursor-pointer group"
                        >
                            <MapPin className="w-3 h-3 text-primary-400" />
                            <span className="font-bold text-primary-300">
                                Radio: 0 - {currentRadius} km | {location?.city || 'Buscando...'}
                            </span>
                            <Search className="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="w-20 h-20 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <MapPin className="text-primary-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">
                            ¡Has visto todo en esta zona!
                        </h2>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={expandSearch}
                                className="w-full py-4 bg-primary-700 hover:bg-primary-600 text-white rounded-2xl font-bold transition shadow-xl active:scale-95 flex items-center justify-center gap-3 text-lg"
                            >
                                <RefreshCw size={20} />
                                {tierIndex === RADIUS_TIERS.length - 1 ? 'Reiniciar' : 'Expandir radio'}
                            </button>

                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="w-full py-4 bg-surface-highlight/30 hover:bg-surface-highlight/50 text-text-primary border border-white/10 rounded-2xl font-medium transition active:scale-95 flex items-center justify-center gap-3"
                            >
                                <MapPin size={20} />
                                Buscar en otra ciudad
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col">
                        <SwipeFeed
                            key={`stack-tier-${tierIndex}`}
                            items={nearbyItems}
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onNeedMore={expandSearch}
                        />
                    </div>
                )}
            </main>

            {/* 🌍 LOCATION MODAL */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                    <div className="bg-surface border border-surface-highlight rounded-xl w-full max-w-md p-6 relative animate-in zoom-in duration-200">
                        <button
                            onClick={() => setShowLocationModal(false)}
                            className="absolute top-4 right-4 text-text-secondary hover:text-white"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-text-primary mb-4">Cambiar Ubicación</h3>
                        <p className="text-text-secondary text-sm mb-6">
                            Ingresa una ciudad para explorar vehículos en esa zona en modo Swipe.
                        </p>

                        <form onSubmit={searchManualLocation} className="space-y-4">
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="Ciudad o Código Postal..."
                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-500 outline-none"
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualLocation(null) // Reset to GPS
                                        setTierIndex(0)
                                        setSeenIds(new Set())
                                        setShowLocationModal(false)
                                        setLocationInput('')
                                    }}
                                    className="flex-1 px-4 py-3 bg-surface-highlight text-text-primary rounded-lg font-medium hover:bg-surface-highlight/80"
                                >
                                    Usar mi GPS
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700"
                                >
                                    Buscar Zona
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
