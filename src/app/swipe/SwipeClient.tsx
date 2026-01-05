// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER (Frontera Digital)
// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { LocationProvider, useLocation } from '@/contexts/LocationContext'
import SwipeFeed from '@/components/SwipeFeed'
import Header from '@/components/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, RefreshCw } from 'lucide-react'
import { calculateDistance } from '@/lib/geolocation'

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

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray
}

export default function SwipeClient({ initialItems, currentUserId }: SwipeClientProps) {
    return (
        <LocationProvider>
            <SwipeContent items={initialItems} currentUserId={currentUserId} />
        </LocationProvider>
    )
}

function SwipeContent({ items, currentUserId }: { items: FeedItem[], currentUserId: string }) {
    const { t } = useLanguage()
    const { location, loading: locationLoading } = useLocation()

    // ANILLOS PROGRESIVOS
    const RADIUS_TIERS = [12, 100, 250, 500, 1000, 2500, 5000]
    const STORAGE_KEY = 'carmatch_swipe_seen_v1'

    const [tierIndex, setTierIndex] = useState(0)
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
    const [isInternalLoading, setIsInternalLoading] = useState(false)

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

    // 2. MAZO ESTABLE
    const stablePool = useMemo(() => {
        if (locationLoading || !location) return []

        const normalizeCountry = (c?: string | null) => {
            if (!c) return null
            const upper = c.toUpperCase()
            if (upper.includes('MEX') || upper === 'MX') return 'MX'
            if (upper.includes('USA') || upper.includes('UNIT') || upper.includes('ESTAD') || upper === 'US') return 'US'
            return upper.substring(0, 2)
        }

        const userCountry = normalizeCountry(location?.country)

        const withDist = items
            .filter((item: FeedItem) => {
                const itemCountry = normalizeCountry(item.country)
                return (itemCountry || 'MX') === userCountry
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

        return tiers.reduce((acc, ss) => [...acc, ...shuffleArray(ss.items)], [] as any[])
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

    const isLoading = locationLoading || isInternalLoading

    return (
        <div className="flex flex-col min-h-screen bg-background text-text-primary">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-10 pb-20 flex flex-col items-center justify-center">
                <div className="mb-6 px-4 py-2 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm border border-white/10 shadow-sm flex flex-col items-center gap-1">
                    <span className="font-bold text-primary-300">📍 Radio: 0 - {currentRadius} km | {location?.city || 'Buscando...'}</span>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-primary-700 animate-spin mb-4" />
                        <p className="text-text-secondary animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : nearbyItems.length === 0 ? (
                    <div className="bg-surface rounded-3xl shadow-2xl p-10 text-center border border-white/5 max-w-sm w-full animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <MapPin className="text-primary-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">
                            ¡Has visto todo en esta zona!
                        </h2>
                        <button
                            onClick={expandSearch}
                            className="w-full py-5 bg-primary-700 hover:bg-primary-600 text-white rounded-2xl font-bold transition shadow-xl active:scale-95 flex items-center justify-center gap-3 text-lg"
                        >
                            <RefreshCw size={20} />
                            {tierIndex === RADIUS_TIERS.length - 1 ? 'Reiniciar' : 'Expandir'}
                        </button>
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
        </div>
    )
}
