// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER (Frontera Digital)
// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import SwipeFeed from '@/components/SwipeFeed'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, RefreshCw, Search, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateDistance, searchCity, searchCities, normalizeCountryCode, LocationData } from '@/lib/geolocation'
import { useRestoreSessionModal } from '@/hooks/useRestoreSessionModal'

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
    description?: string | null // ✅ Added description
    isFavorited?: boolean
    isBoosted?: boolean
    user: {
        name: string
        image: string | null
    }
    _count?: {
        favorites: number
    }
    distance?: number
}

interface SwipeClientProps {
    initialItems: FeedItem[]
    currentUserId: string
}

// 🔧 CONSTANTE FUERA DEL COMPONENTE: Evita recreación en cada render
const RADIUS_TIERS = [25, 100, 250, 500, 1000, 2500, 5000]

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
    const router = useRouter()
    const { openModal } = useRestoreSessionModal()

    // 🎯 Memoize items to prevent reference changes causing expensive recalculations
    const items = useMemo(() => initialItems, [initialItems.length, initialItems[0]?.id])

    const [tierIndex, setTierIndex] = useState(0)
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
    const [isInternalLoading, setIsInternalLoading] = useState(false)
    const [newVehiclesCount, setNewVehiclesCount] = useState(0)

    // Modal State
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationInput, setLocationInput] = useState('')

    // 🆕 Candidate List State
    const [locationCandidates, setLocationCandidates] = useState<LocationData[]>([])
    const [showCandidates, setShowCandidates] = useState(false)

    // 1. Historial (Eliminado para que sea siempre dinámico)

    // 2. MAZO ESTABLE CON FRONTERA DIGITAL - ESTRATEGIA INCREMENTAL
    const [shuffledItems, setShuffledItems] = useState<FeedItem[]>([])
    const isFirstRun = useRef(true)

    // 🚀 RESTAURAR ESTADO DESDE SESSIONSTORAGE (Para persistencia al volver atrás)
    useEffect(() => {
        try {
            const savedItems = sessionStorage.getItem('carmatch_swipe_items')
            const savedSeen = sessionStorage.getItem('carmatch_swipe_seen')
            const savedTier = sessionStorage.getItem('carmatch_swipe_tier')

            if (savedItems) {
                const parsedItems = JSON.parse(savedItems)
                if (parsedItems.length > 0) {
                    setShuffledItems(parsedItems)
                    isFirstRun.current = false
                }
            }
            if (savedSeen) {
                setSeenIds(new Set(JSON.parse(savedSeen)))
            }
            if (savedTier) {
                setTierIndex(parseInt(savedTier))
            }
        } catch (e) {
            console.error("Error al restaurar sesión de swipe:", e)
        }

        // 🔔 REAL-TIME NOTIFICATIONS
        const handleNewVehicleOnSocket = (vehicle: any) => {
            // Filtrar por distancia si tenemos ubicación activa
            if (location && location.latitude && location.longitude && vehicle.latitude && vehicle.longitude) {
                const dist = calculateDistance(
                    location.latitude,
                    location.longitude,
                    vehicle.latitude,
                    vehicle.longitude
                )

                // Si está dentro del radio actual (o es boosted), avisar
                if (dist <= RADIUS_TIERS[tierIndex] || vehicle.isBoosted) {
                    console.log("🔔 [Swipe] Nuevo vehículo detectado:", vehicle.title)
                    setNewVehiclesCount(prev => prev + 1)
                }
            } else if (!location) {
                setNewVehiclesCount(prev => prev + 1)
            }
        }

        import('@/lib/socket').then(({ socket }) => {
            if (!socket.connected) socket.connect()
            socket.on('new_vehicle_published', handleNewVehicleOnSocket)
        })

        return () => {
            import('@/lib/socket').then(({ socket }) => {
                socket.off('new_vehicle_published', handleNewVehicleOnSocket)
            })
        }
    }, [location, tierIndex])

    // 💾 GUARDAR ESTADO EN SESSIONSTORAGE
    useEffect(() => {
        if (!isFirstRun.current) {
            sessionStorage.setItem('carmatch_swipe_items', JSON.stringify(shuffledItems))
            sessionStorage.setItem('carmatch_swipe_tier', tierIndex.toString())
        }
    }, [shuffledItems, tierIndex])

    useEffect(() => {
        sessionStorage.setItem('carmatch_swipe_seen', JSON.stringify(Array.from(seenIds)))
    }, [seenIds])

    useEffect(() => {
        if (locationLoading || !location || items.length === 0) return

        const userCountry = normalizeCountryCode(location?.country)

        // 1. Filtrar los items de la prop que pertenecen a la frontera digital
        const validItems = items.filter((item: FeedItem) => {
            const itemCountry = normalizeCountryCode(item.country)
            return itemCountry === userCountry
        })

        // 2. Identificar qué items son NUEVOS (no están en nuestro mazo actual)
        const currentIds = new Set(shuffledItems.map(i => i.id))
        const newItemsRaw = validItems.filter(i => !currentIds.has(i.id))

        // Si es el primer run o cambiamos de ciudad, reiniciamos el mazo
        if (isFirstRun.current || (shuffledItems.length > 0 && shuffledItems[0].city !== location.city)) {
            // Si el cambio es por ciudad, limpiamos storage
            if (shuffledItems.length > 0 && shuffledItems[0].city !== location.city) {
                sessionStorage.removeItem('carmatch_swipe_items')
                sessionStorage.removeItem('carmatch_swipe_seen')
                sessionStorage.removeItem('carmatch_swipe_tier')
                setSeenIds(new Set())
                setTierIndex(0)
            }

            const withDist = validItems.map((item: FeedItem) => {
                let distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    item.latitude || 0,
                    item.longitude || 0
                )
                if (item.isBoosted) distance = 0
                return { ...item, distance }
            })

            const tiers = RADIUS_TIERS.map(r => ({ max: r, items: [] as any[] }))
            withDist.forEach(item => {
                const tier = tiers.find(t => item.distance <= t.max) || tiers[tiers.length - 1]
                tier.items.push(item)
            })

            const finalPool = tiers.reduce((acc, ss) => [...acc, ...boostShuffleArray(ss.items)], [] as any[])
            setShuffledItems(finalPool)
            isFirstRun.current = false
            return
        }

        // 3. Si hay items nuevos, los mezclamos y los añadimos AL FINAL
        if (newItemsRaw.length > 0) {
            const newWithDist = newItemsRaw.map(item => ({
                ...item,
                distance: calculateDistance(
                    location.latitude,
                    location.longitude,
                    item.latitude || 0,
                    item.longitude || 0
                )
            }))

            // Mezclamos los nuevos items y los pegamos al final de los existentes
            const shuffledNew = boostShuffleArray(newWithDist)
            setShuffledItems(prev => [...prev, ...shuffledNew])
        }
    }, [items, location?.city, locationLoading])

    const stablePool = shuffledItems

    const currentRadius = RADIUS_TIERS[tierIndex]

    // 🎯 OPTIMIZACIÓN: Memoizar validIds para evitar crear Set en cada render
    const validIds = useMemo(() => new Set(items.map(i => i.id)), [items])

    // 3. FILTRADO FINAL
    const nearbyItems = useMemo(() => {
        return stablePool.filter(v =>
            (v.distance ?? 999999) <= currentRadius &&
            !seenIds.has(v.id) &&
            validIds.has(v.id) // Solo si sigue estando en la lista del servidor
        )
    }, [stablePool, currentRadius, validIds, seenIds])

    // 🎯 MEMOIZAR items para SwipeFeed para evitar re-creación del array en cada render
    const swipeFeedItems = useMemo(() => {
        // 🔒 Si no hay items, devolver array vacío estático
        if (nearbyItems.length === 0) return []

        return nearbyItems.map(item => ({
            ...item,
            // 🚀 ADMIN NACIONAL: Mostrar ciudad del usuario en publicaciones de admin
            city: item.isBoosted && location?.city ? location.city : item.city
        }))
    }, [nearbyItems, location?.city])

    // 🔒 REF para prevenir múltiples llamadas simultáneas
    const isExpandingRef = useRef(false)
    const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const expandSearch = useCallback(() => {
        console.log('[expandSearch] Llamada recibida, isExpandingRef.current:', isExpandingRef.current)

        if (isExpandingRef.current) {
            console.log('[expandSearch] BLOQUEADO - ya está expandiendo')
            return
        }

        console.log('[expandSearch] EJECUTANDO expansión...')
        isExpandingRef.current = true

        // Limpiar timeout anterior si existe
        if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current)
        }

        // 🔥 CRITICAL FIX: Usar setTimeout(0) para permitir que React procese el render antes de los cambios de estado
        // Esto previene el bloqueo del UI cuando se cambian múltiples estados
        setTimeout(() => {
            // 🔥 BATCH UPDATE: Actualizar todo el estado de una vez usando función de actualización
            setTierIndex(prev => {
                const nextTier = (prev + 1) % RADIUS_TIERS.length
                console.log('[expandSearch] Cambiando tier de', prev, 'a', nextTier)
                return nextTier
            })
            setSeenIds(new Set())
            setIsInternalLoading(true)

            expandTimeoutRef.current = setTimeout(() => {
                console.log('[expandSearch] Reseteando flags después de 600ms')
                setIsInternalLoading(false)
                isExpandingRef.current = false
                expandTimeoutRef.current = null
            }, 600)
        }, 0)
    }, []) // ✅ Sin dependencias - función estable que no causa re-renders

    // 🧹 Cleanup del timeout cuando el componente se desmonta
    useEffect(() => {
        return () => {
            if (expandTimeoutRef.current) {
                clearTimeout(expandTimeoutRef.current)
                expandTimeoutRef.current = null
            }
        }
    }, [])

    const markAsSeen = (id: string) => {
        setSeenIds(prev => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
    }

    const handleLike = async (id: string) => {
        // 🔥 RESTAURAR SESIÓN: Si hay sesión pero está en "Modo Invitado", la activamos
        const isSoftLogout = document.cookie.includes('soft_logout=true') || localStorage.getItem('soft_logout') === 'true'
        if (currentUserId !== 'guest' && isSoftLogout) {
            openModal(
                "¿Deseas reactivar tu sesión para guardar este vehículo? Tu cuenta sigue vinculada.",
                () => executeLike(id)
            )
            return
        }

        await executeLike(id)
    }

    const executeLike = async (id: string) => {
        // Si no hay usuario logueado, redirigir con callback
        if (currentUserId === 'guest') {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/swipe'
            router.push(`/auth?callbackUrl=${encodeURIComponent(currentPath)}`)
            return
        }

        markAsSeen(id)
        try {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleId: id, action: 'add' })
            })
            window.dispatchEvent(new CustomEvent('favoriteUpdated'))
            router.refresh()
        } catch (e) { }
    }

    const handleDislike = (id: string) => {
        markAsSeen(id)
    }



    const [isSearchingLocation, setIsSearchingLocation] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)

    // Manual Search Handler
    const searchManualLocation = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!locationInput.trim() || isSearchingLocation) return

        setIsSearchingLocation(true)
        setLocationError(null)
        setShowCandidates(false)
        setLocationCandidates([])

        try {
            // 🔍 Usar búsqueda múltiple para desambiguación
            const results = await searchCities(locationInput)

            if (results && results.length > 0) {
                if (results.length === 1) {
                    // ✅ Caso 1: Solo un resultado -> Selección automática
                    selectLocation(results[0])
                } else {
                    // 📋 Caso 2: Múltiples resultados -> Mostrar lista
                    setLocationCandidates(results)
                    setShowCandidates(true)
                }
            } else {
                setLocationError('No pudimos encontrar esa ubicación. Intenta ser más específico.')
            }
        } catch (error) {
            setLocationError('Error al buscar la ciudad. Intenta nuevamente.')
        } finally {
            setIsSearchingLocation(false)
        }
    }

    // Helper para seleccionar ubicación (usado tanto en auto-select como en click de lista)
    const selectLocation = (loc: LocationData) => {
        setManualLocation(loc) // Global Context Update
        setTierIndex(0) // Reset radius logic locally
        setSeenIds(new Set()) // Reset seen stack
        setShowLocationModal(false)
        setLocationInput('')
        setShowCandidates(false)
        setLocationCandidates([])
    }

    const isLoading = locationLoading || isInternalLoading

    return (
        <div className="fixed inset-0 flex flex-col bg-background text-text-primary overflow-hidden overscroll-none pt-[70px] pb-4">
            <div className="w-full max-w-4xl mx-auto px-4 flex-1 flex flex-col items-center justify-center relative">

                {/* El indicador de radio se movió dentro de los estados específicos */}

                {/* 🔔 New Vehicles Notification */}
                {newVehiclesCount > 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in w-full max-w-xs sm:max-w-md px-4">
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('carmatch_swipe_items')
                                sessionStorage.removeItem('carmatch_swipe_seen')
                                sessionStorage.removeItem('carmatch_swipe_tier')
                                setNewVehiclesCount(0)
                                router.refresh()
                            }}
                            className="w-full bg-primary-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:bg-primary-700 transition transform hover:scale-105"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
                                {newVehiclesCount === 1
                                    ? '🚗 ¡Hay 1 vehículo nuevo en tu zona!'
                                    : `🚗 ¡Hay ${newVehiclesCount} vehículos nuevos en tu zona!`}
                            </span>
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-primary-700 animate-spin mb-4" />
                        <p className="text-text-secondary animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : nearbyItems.length === 0 ? (
                    <div className="bg-surface rounded-3xl shadow-2xl p-10 text-center border border-white/5 max-w-sm w-full animate-in zoom-in duration-300 flex flex-col items-center">

                        <div className="w-20 h-20 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <MapPin className="text-primary-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">
                            {t('swipe.no_vehicles')}
                        </h2>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={expandSearch}
                                disabled={isInternalLoading}
                                className="w-full py-4 bg-primary-700 hover:bg-primary-600 text-white rounded-2xl font-bold transition shadow-xl active:scale-95 flex flex-col items-center justify-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-700"
                            >
                                <div className="flex items-center gap-3 text-lg">
                                    <RefreshCw size={20} className={`transition-transform duration-500 ${isInternalLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                    {tierIndex === RADIUS_TIERS.length - 1 ? t('market.restart_search') : t('market.expand_search')}
                                </div>
                                <span className="text-[10px] text-primary-200 uppercase tracking-widest opacity-80 decoration-primary-500/30">
                                    {t('market.radius_label').replace('{radius}', currentRadius.toString())} | {location?.city}
                                </span>
                            </button>

                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="w-full py-4 bg-surface-highlight/30 hover:bg-surface-highlight/50 text-text-primary border border-white/10 rounded-2xl font-medium transition active:scale-95 flex items-center justify-center gap-3"
                            >
                                <MapPin size={20} />
                                {t('market.change_location')}
                            </button>

                            <div className="mt-4 pt-4 border-t border-white/10 w-full flex flex-col items-center">
                                <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider">{t('market.cant_find_desc')}</p>
                                <Link
                                    href="/publish"
                                    className="w-full py-4 bg-white text-primary-900 rounded-2xl font-bold transition shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    {t('swipe.publish') || t('market.publish_cta')}
                                </Link>
                            </div>
                        </div>
                    </div>

                ) : (
                    <div className="w-full flex-1 flex flex-col">
                        <SwipeFeed
                            items={swipeFeedItems}
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onNeedMore={expandSearch}
                        />
                    </div>
                )}
            </div>

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
                            {t('market.change_location_desc')}
                        </p>

                        <form onSubmit={searchManualLocation} className="space-y-4">
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => {
                                    setLocationInput(e.target.value)
                                    if (locationError) setLocationError(null)
                                    // Ocultar lista si el usuario sigue escribiendo
                                    if (showCandidates) setShowCandidates(false)
                                }}
                                placeholder={t('market.change_location_placeholder')}
                                className={`w-full px-4 py-3 bg-background border rounded-lg text-text-primary focus:border-primary-500 outline-none transition ${locationError ? 'border-red-500/50' : 'border-surface-highlight'}`}
                                autoFocus
                                disabled={isSearchingLocation}
                            />

                            {/* 📋 LISTA DE CANDIDATOS (Disambiguation UI) */}
                            {showCandidates && locationCandidates.length > 0 && (
                                <div className="bg-background border border-surface-highlight rounded-lg overflow-hidden max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                                    <p className="px-3 py-2 text-xs text-text-secondary bg-surface-highlight/30 font-bold uppercase tracking-wider">
                                        ¿A cuál te refieres?
                                    </p>
                                    {locationCandidates.map((cand, idx) => (
                                        <button
                                            key={`${cand.city}-${idx}`}
                                            type="button"
                                            onClick={() => selectLocation(cand)}
                                            className="w-full text-left px-4 py-3 hover:bg-surface-highlight transition border-b border-surface-highlight/50 last:border-0 flex items-center gap-3 group"
                                        >
                                            <MapPin size={16} className="text-primary-500 group-hover:scale-110 transition-transform" />
                                            <div>
                                                <span className="block font-bold text-text-primary text-sm">
                                                    {cand.city}
                                                </span>
                                                <span className="block text-xs text-text-secondary">
                                                    {cand.state}, {cand.country}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {locationError && (
                                <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                                    ⚠️ {locationError}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualLocation(null) // Reset to GPS
                                        setTierIndex(0)
                                        setSeenIds(new Set())
                                        setShowLocationModal(false)
                                        setLocationInput('')
                                        setLocationError(null)
                                        setShowCandidates(false)
                                        setLocationCandidates([])
                                    }}
                                    disabled={isSearchingLocation}
                                    className="flex-1 px-4 py-3 bg-surface-highlight text-text-primary rounded-lg font-medium hover:bg-surface-highlight/80 disabled:opacity-50"
                                >
                                    {t('market.use_gps')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!locationInput.trim() || isSearchingLocation}
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSearchingLocation ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Buscando...</span>
                                        </>
                                    ) : (
                                        t('market.search_zone')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
