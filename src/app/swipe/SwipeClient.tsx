// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER (Frontera Digital)
// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { LocationProvider, useLocation } from '@/contexts/LocationContext'
import SwipeFeed from '@/components/SwipeFeed'
import Header from '@/components/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react'
import { calculateDistance } from '@/lib/geolocation'

interface Vehicle {
    id: string
    userId: string
    title: string
    brand: string
    model: string
    year: number
    price: number
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
    _count: {
        favorites: number
    }
}

interface SwipeClientProps {
    initialVehicles: Vehicle[]
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

export default function SwipeClient({ initialVehicles, currentUserId }: SwipeClientProps) {
    return (
        <LocationProvider>
            <SwipeContent vehicles={initialVehicles} currentUserId={currentUserId} />
        </LocationProvider>
    )
}

function SwipeContent({ vehicles, currentUserId }: { vehicles: Vehicle[], currentUserId: string }) {
    const { t } = useLanguage()
    const { location, loading: locationLoading } = useLocation()

    // ANILLOS PROGRESIVOS: Siempre empezar en 12km y expandir progresivamente
    // 12km → 100km → 250km → 500km → 1000km → 2500km → 5000km → (ciclo de nuevo a 12km)
    const RADIUS_TIERS = [12, 100, 250, 500, 1000, 2500, 5000]
    const STORAGE_KEY = 'carmatch_swipe_seen_v1' // Solo para vehículos vistos, NO para el tier

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
                        // Validez de 24 horas
                        if (now - ts < 24 * 60 * 60 * 1000) validIds.add(id)
                    })
                }
                setSeenIds(validIds)
            } catch (e) { setSeenIds(new Set()) }
        }
    }, [])

    // 2. MAZO ESTABLE CON ALEATORIZACIÓN ÚNICA POR TIER
    const stablePool = useMemo(() => {
        if (locationLoading) return []
        const lat = location?.latitude
        const lng = location?.longitude

        // Helper para normalizar países (MX, Mexico, México -> MX)
        const normalizeCountry = (c?: string | null) => {
            if (!c) return null
            const upper = c.toUpperCase()
            if (upper.length === 2) return upper // Asumir ISO code si son 2 letras

            // NORTH AMERICA
            if (upper.includes('MEX') || upper === 'MX') return 'MX'
            if (upper.includes('USA') || upper.includes('UNIT') || upper.includes('ESTAD') || upper === 'US') return 'US'
            if (upper.includes('CAN') || upper === 'CA') return 'CA'

            // LATAM
            if (upper.includes('COL') || upper === 'CO') return 'CO'
            if (upper.includes('ARG') || upper === 'AR') return 'AR'
            if (upper.includes('BRA') || upper === 'BR') return 'BR'
            if (upper.includes('CHIL') || upper === 'CL') return 'CL'
            if (upper.includes('PERU') || upper === 'PE') return 'PE'

            // EUROPE
            if (upper.includes('ESP') || upper.includes('SPA') || upper === 'ES') return 'ES'
            if (upper.includes('FRA') || upper === 'FR') return 'FR'
            if (upper.includes('DEU') || upper.includes('GER') || upper.includes('ALEM') || upper === 'DE') return 'DE'
            if (upper.includes('ITA') || upper === 'IT') return 'IT'

            // ASIA / OM
            if (upper.includes('JAP') || upper === 'JP') return 'JP'
            if (upper.includes('CHN') || upper.includes('CHIN') || upper === 'CN') return 'CN'

            // Default fallback: primeras 2 letras (mejor esfuerzo)
            return upper.substring(0, 2)
        }

        const normalizeString = (s?: string | null) => {
            if (!s) return ""
            return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        }

        const userCountryRaw = location?.countryCode || location?.country || 'MX'
        const userCountry = normalizeCountry(userCountryRaw) || 'MX'
        const userCity = normalizeString(location?.city)

        console.log(`[CARMATCH] User: ${userCountry} / ${location?.city || 'No City'} (Raw: ${userCountryRaw})`)

        const withDist = vehicles
            .filter(v => {
                const vCountry = normalizeCountry(v.country)
                // Si el vehículo no tiene país, asumimos que es del mismo país que el usuario (o MX por defecto)
                // para evitar ocultar coches sin datos.
                const match = (vCountry || 'MX') === userCountry
                return match
            })
            .map(v => {
                let d = 99999
                if (lat && lng && v.latitude && v.longitude) {
                    d = calculateDistance(lat, lng, v.latitude, v.longitude)
                } else if (!lat || !lng) {
                    d = 0
                } else if (v.latitude === null || v.longitude === null) {
                    // ⚡ FIX: Si no tiene coordenadas pero es la misma ciudad del usuario,
                    // asignamos 0.1km para que salga en el mazo inicial (12km)
                    const vCity = normalizeString(v.city)
                    if (vCity && userCity && vCity === userCity) {
                        console.log(`[CARMATCH] City Match for ${v.title} (${v.city}) - Set distance to 0.1km`)
                        d = 0.1
                    } else {
                        d = 4999 // Si no tiene coords y no es la ciudad, mandamos al final
                    }
                }
                return { ...v, distance: d }
            })

        // Agrupar por anillos y barajar solo una vez para este tierIndex
        const tiers = RADIUS_TIERS.map(r => ({
            max: r,
            items: [] as any[]
        }))

        withDist.forEach(v => {
            const target = tiers.find(ss => v.distance <= ss.max)
            if (target) target.items.push(v)
        })

        return tiers.reduce((acc, ss) => [...acc, ...shuffleArray(ss.items)], [] as any[])
    }, [vehicles, location, locationLoading]) // Removed tierIndex: Pool should be stable per location

    // 3. FILTRADO FINAL (DINÁMICO SEGÚN VISTOS)
    const nearbyVehicles = useMemo(() => {
        const stack = stablePool.filter(v => v.distance <= currentRadius && !seenIds.has(v.id))
        console.log(`[CARMATCH] Radius: ${currentRadius}km | Total Pool: ${stablePool.length} | Visible Now: ${stack.length}`)
        return stack
    }, [stablePool, seenIds, currentRadius])

    // 🔥 SMART START: Si no hay carros en el radio inicial (12km) pero SI hay en el país,
    // saltar automáticamente al primer anillo con carros para evitar la pantalla "Aburrida".
    useEffect(() => {
        if (isInternalLoading || locationLoading || stablePool.length === 0) return

        // Si en el radio actual hay 0 visibles, pero en total hay más...
        // Buscar el radio mínimo necesario
        const currentCount = stablePool.filter(v => v.distance <= currentRadius).length

        // Solo aplicar si estamos en el arranque (o si el usuario agotó todo y se reseteó)
        // Y asegurarnos de no saltar si ya hay carros visibles
        if (currentCount === 0) {
            const bestTierIndex = RADIUS_TIERS.findIndex(r => stablePool.some(v => v.distance <= r))
            if (bestTierIndex !== -1 && bestTierIndex > tierIndex) {
                console.log(`[CARMATCH] Smart Start: Jumping from ${currentRadius}km to ${RADIUS_TIERS[bestTierIndex]}km`)
                setTierIndex(bestTierIndex)
            }
        }
    }, [stablePool, currentRadius, tierIndex, isInternalLoading, locationLoading])

    // --- MANEJADORES ---

    const expandSearch = useCallback(() => {
        setIsInternalLoading(true)

        // 🔄 SIEMPRE limpiar historial al expandir para volver a ver todos los vehículos
        // desde 0km hasta el nuevo radio
        setSeenIds(new Set());
        localStorage.removeItem(STORAGE_KEY);

        setTierIndex(prev => {
            const next = (prev + 1) % RADIUS_TIERS.length;
            return next;
        });

        setTimeout(() => setIsInternalLoading(false), 400)
    }, [RADIUS_TIERS.length])

    const markAsSeen = (id: string) => {
        setSeenIds(prev => {
            const next = new Set(prev)
            next.add(id)

            // Persistir
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

                {/* DEBUG INFO OVERLAY */}
                <div className="mb-6 px-4 py-2 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm border border-white/10 shadow-sm flex flex-col items-center gap-1">
                    <span className="font-bold text-primary-300">📍 Radio: 0 - {currentRadius} km | {location?.city || 'Cargando ubicación...'}</span>
                    <span className="font-bold text-primary-300">Radio: 0 - {currentRadius} km</span>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-primary-700 animate-spin mb-4" />
                        <p className="text-text-secondary animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : nearbyVehicles.length === 0 ? (
                    <div className="bg-surface rounded-3xl shadow-2xl p-10 text-center border border-white/5 max-w-sm w-full animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <MapPin className="text-primary-400" size={40} />
                        </div>

                        <h2 className="text-2xl font-bold mb-4 tracking-tight">
                            {tierIndex === 0 ? t('radius.no_more_nearby') : t('radius.zone_checked')}
                        </h2>

                        <p className="text-text-secondary text-base mb-10 leading-relaxed">
                            {tierIndex === RADIUS_TIERS.length - 1
                                ? t('radius.national_viewed')
                                : t('radius.expand_hint')}
                        </p>

                        <button
                            onClick={expandSearch}
                            className="w-full py-5 bg-primary-700 hover:bg-primary-600 text-white rounded-2xl font-bold transition shadow-xl active:scale-95 flex items-center justify-center gap-3 text-lg"
                        >
                            <RefreshCw size={20} />
                            {tierIndex === RADIUS_TIERS.length - 1 ? t('radius.restart') : t('radius.expand')}
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col">
                        <SwipeFeed
                            // ⚡ FIX: Usar solo tierIndex como key.
                            // No usar seenIds.size porque eso fuerza el remount completo del componente en cada swipe,
                            // rompiendo las animaciones de Framer Motion y causando "parpadeos" o cartas duplicadas.
                            key={`stack-tier-${tierIndex}`}
                            vehicles={nearbyVehicles}
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
