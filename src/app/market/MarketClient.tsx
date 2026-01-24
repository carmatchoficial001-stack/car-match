"use client"
// v1.4 Refactor: Global LocationContext Usage

import { useEffect, useState, useRef, useCallback } from 'react'
import { MapPin, Search, Loader2, Plus } from 'lucide-react'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocation } from '@/contexts/LocationContext'
import { searchCity, searchCities, calculateDistance, normalizeCountryCode, LocationData } from '@/lib/geolocation'
import MarketFilters from '@/components/MarketFilters'
import FavoriteButton from '@/components/FavoriteButton'
import ShareButton from '@/components/ShareButton'
import ReportImageButton from '@/components/ReportImageButton'
import { formatPrice, formatNumber } from '@/lib/vehicleTaxonomy'

interface FeedItem {
    id: string
    title: string
    brand?: string
    model?: string
    year?: number
    price?: number
    currency?: string | null
    city: string
    latitude: number | null
    longitude: number | null
    country?: string | null
    images?: string[]
    transmission?: string
    mileage?: number
    vehicleType?: string
    isFavorited?: boolean
    feedType: 'VEHICLE' | 'BUSINESS'
    isBoosted?: boolean
    category?: string
    user: {
        name: string
        image: string | null
    }
}

interface MarketClientProps {
    initialItems: FeedItem[]
    currentUserId: string
    brands: string[]
    vehicleTypes: string[]
    colors: string[]
    searchParams: any
}

// Utility: Fisher-Yates Shuffle with 300% Boost Prioritization
function boostShuffleArray(array: FeedItem[]): FeedItem[] {
    const boosted = array.filter(item => item.isBoosted)
    const regular = array.filter(item => !item.isBoosted)

    // Shuffle regular items
    for (let i = regular.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regular[i], regular[j]] = [regular[j], regular[i]];
    }

    // Shuffle boosted items
    for (let i = boosted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boosted[i], boosted[j]] = [boosted[j], boosted[i]];
    }

    const result: FeedItem[] = []

    // First items should be boosted if available
    const initialBoost = boosted.slice(0, 3)
    const remainingBoost = boosted.slice(3)

    result.push(...initialBoost)

    // Distribute remaining boosted items every 3 regular items (300% visibility)
    let bIndex = 0
    let rIndex = 0

    while (rIndex < regular.length || bIndex < remainingBoost.length) {
        // Add up to 3 regular items
        for (let k = 0; k < 3 && rIndex < regular.length; k++) {
            result.push(regular[rIndex++])
        }
        // Add 1 boosted item if available
        if (bIndex < remainingBoost.length) {
            result.push(remainingBoost[bIndex++])
        }
    }

    return result
}

export default function MarketClient({
    initialItems,
    currentUserId,
    brands,
    vehicleTypes,
    colors,
    searchParams
}: MarketClientProps) {
    const { t, locale } = useLanguage()

    // 🔥 USANDO CONTEXTO GLOBAL
    const { location, loading: locationLoading, manualLocation, setManualLocation } = useLocation()
    const [isFiltering, setIsFiltering] = useState(true)

    // ANILLOS PROGRESIVOS
    const RADIUS_TIERS = [12, 100, 250, 500, 1000, 2500, 5000]
    const [tierIndex, setTierIndex] = useState(0)
    const searchRadius = RADIUS_TIERS[tierIndex]

    const [items, setItems] = useState<FeedItem[]>(initialItems)
    const [filteredItems, setFilteredItems] = useState<FeedItem[]>(initialItems)
    const [showFilters, setShowFilters] = useState(false)

    // Modal UI State
    const [showLocationModal, setShowLocationModal] = useState(false)

    const [locationInput, setLocationInput] = useState('')

    // 🆕 Candidate List State
    const [locationCandidates, setLocationCandidates] = useState<LocationData[]>([])
    const [showCandidates, setShowCandidates] = useState(false)

    // Ubicación Activa
    const activeLocation = manualLocation || location
    const displayCity = activeLocation?.city || activeLocation?.state || (locationLoading ? t('common.loading') : t('market.radius_unknown'))
    const userCountry = normalizeCountryCode(activeLocation?.countryCode || activeLocation?.country)

    // Pagination
    const CARS_PER_PAGE = 6
    const [visibleCount, setVisibleCount] = useState(CARS_PER_PAGE)

    useEffect(() => {
        // 🔄 URL -> Context Synchronization
        // If a city is in URL but not in manual context, sync it so distances are calculated from there
        const syncUrlCity = async () => {
            if (searchParams.city && (!manualLocation || manualLocation.city !== searchParams.city)) {
                try {
                    const loc = await searchCity(searchParams.city)
                    if (loc) {
                        setManualLocation(loc)
                        setTierIndex(0)
                    }
                } catch (e) {
                    console.warn("Failed to sync URL city to context", e)
                }
            }
        }
        syncUrlCity()

        // Try to restore state from sessionStorage
        const savedCount = sessionStorage.getItem('market_visible_count')
        if (savedCount) setVisibleCount(parseInt(savedCount))

        const savedItemsOrder = sessionStorage.getItem('market_items_order')
        if (savedItemsOrder && !searchParams.sort) {
            try {
                const orderedIds = JSON.parse(savedItemsOrder)
                const orderedItems = orderedIds.map((id: string) => initialItems.find(it => it.id === id)).filter(Boolean)
                if (orderedItems.length === initialItems.length) {
                    setItems(orderedItems)
                    return // Skip initial shuffle
                }
            } catch (e) {
                console.error("Failed to restore items order", e)
            }
        }

        // Shuffle only on first load if no specific sort
        const shouldShuffle = !searchParams.sort || searchParams.sort === 'newest'
        if (shouldShuffle) {
            const shuffled = boostShuffleArray(initialItems)
            setItems(shuffled)
            // Save order for next time
            sessionStorage.setItem('market_items_order', JSON.stringify(shuffled.map(it => it.id)))
        }
    }, [initialItems, searchParams.sort])

    // Save visibleCount whenever it changes
    useEffect(() => {
        sessionStorage.setItem('market_visible_count', visibleCount.toString())
    }, [visibleCount])

    // --- INFINITE SCROLL LOGIC ---
    const observer = useRef<IntersectionObserver | null>(null)
    const lastItemRef = useCallback((node: HTMLDivElement | null) => {
        if (isFiltering) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < filteredItems.length) {
                setVisibleCount(prev => prev + CARS_PER_PAGE)
            }
        }, { threshold: 0.5 })

        if (node) observer.current.observe(node)
    }, [isFiltering, visibleCount, filteredItems.length])

    // --- LÓGICA DE FILTRADO Y DISTANCIA ---
    useEffect(() => {
        const filterItems = async () => {
            // Si estamos cargando ubicación inicial, mostramos spinner
            if (locationLoading && !activeLocation) {
                setIsFiltering(true)
                return
            }

            setIsFiltering(true)

            try {
                const userLat = activeLocation?.latitude
                const userLng = activeLocation?.longitude

                const processed = items
                    .map(item => {
                        let d = 99999
                        if (userLat && userLng && item.latitude && item.longitude) {
                            d = calculateDistance(userLat, userLng, item.latitude, item.longitude)
                        }

                        // 👑 ADMIN GLOBAL VISIBILITY:
                        // If it's an admin vehicle (isBoosted) AND in the same country,
                        // force distance to 0 so it appears as "Local" (0-12km tier) anywhere in the country.
                        if (item.isBoosted && normalizeCountryCode(item.country) === userCountry) {
                            d = 0
                        }

                        return { ...item, distance: d }
                    })
                    // 🌍 FRONTERA DIGITAL: Filtrar estrictamente por país normalizado
                    .filter(item => {
                        const itemCountry = normalizeCountryCode(item.country)
                        return itemCountry === userCountry
                    })
                    // Filtrar por radio
                    .filter(item => {
                        if (!userLat || !userLng) return true
                        return item.distance <= searchRadius
                    })
                    .sort((a, b) => (a.distance || 0) - (b.distance || 0))

                setFilteredItems(processed)
            } catch (error) {
                console.error('Filter error', error)
                setFilteredItems(items)
            } finally {
                setIsFiltering(false)
            }
        }

        filterItems()
    }, [items, searchRadius, activeLocation, locationLoading, userCountry, t])

    const router = useRouter()
    const [searchText, setSearchText] = useState(searchParams.search || '')
    const [isSearching, setIsSearching] = useState(false)

    const handleSmartSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchText.trim()) return
        setIsSearching(true)
        try {
            const res = await fetch('/api/ai/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchText, context: 'MARKET' })
            })
            const filters = await res.json()
            const params = new URLSearchParams()
            params.set('search', searchText)
            if (filters.category) params.set('category', filters.category)
            if (filters.brand) params.set('brand', filters.brand)
            if (filters.model) params.set('model', filters.model)
            if (filters.vehicleType) params.set('vehicleType', filters.vehicleType)
            if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
            if (filters.minYear) params.set('minYear', filters.minYear.toString())
            if (filters.color) params.set('color', filters.color)
            if (filters.transmission) params.set('transmission', filters.transmission)
            if (filters.fuel) params.set('fuel', filters.fuel)
            if (filters.passengers) params.set('passengers', filters.passengers.toString())
            if (filters.cylinders) params.set('cylinders', filters.cylinders.toString())
            if (filters.sort) params.set('sort', filters.sort)
            if (filters.features && Array.isArray(filters.features)) {
                params.set('features', filters.features.join(','))
            }

            // 🧠 SMART CLEANUP: Si la IA encontró filtros útiles (Marca, Modelo, Color), 
            // eliminamos el texto de búsqueda para evitar que el filtro de texto estricto oculte resultados.
            // Ej: "Ram negra" -> Brand: RAM, Color: Negro. Si dejamos "search=Ram negra", el backend buscará texto exacto y fallará.
            const hasKeyFilters = filters.brand || filters.model || filters.category || filters.vehicleType || filters.color;
            if (hasKeyFilters) {
                params.delete('search')
            } else {
                // Si no encontró nada estructurado, mantenemos la búsqueda de texto como fallback
                params.set('search', searchText)
            }

            router.push(`/market?${params.toString()}`)
        } catch (error) {
            router.push(`/market?search=${encodeURIComponent(searchText)}`)
        } finally {
            setIsSearching(false)
        }
    }

    const handleExpandSearch = () => {
        setIsFiltering(true)
        setTimeout(() => {
            setTierIndex(prev => (prev + 1) % RADIUS_TIERS.length)
            setVisibleCount(CARS_PER_PAGE)
            setIsFiltering(false)
        }, 300)
    }

    const [isSearchingLocation, setIsSearchingLocation] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)

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

    // Helper para seleccionar ubicación
    const selectLocation = (loc: LocationData) => {
        setManualLocation(loc) // Usa el método del Contexto Global
        setTierIndex(0)
        setShowLocationModal(false)
        setLocationInput('')
        setShowCandidates(false)
        setLocationCandidates([])
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 pt-8 pb-24">
                {/* Header */}
                <header className="mb-8">
                    {/* Controles en una sola línea */}
                    <div className="flex flex-row gap-2 md:gap-4 items-center">
                        {/* Botón para mostrar filtros - Solo si están ocultos */}
                        {!showFilters && (
                            <button
                                onClick={() => setShowFilters(true)}
                                className="w-full md:w-auto px-6 py-3 bg-surface border border-surface-highlight rounded-xl text-text-primary font-medium hover:border-primary-700 transition flex items-center justify-center md:justify-start gap-2 whitespace-nowrap"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>{t('market.filters.show_filters')}</span>
                            </button>
                        )}

                        {/* Barra de búsqueda con IA - Oculta en móvil porque ya existe en Filtros */}
                        <form onSubmit={handleSmartSearch} className="hidden md:block flex-1 w-full relative group">
                            {/*  Hint Tooltip */}
                            <div className="absolute -top-8 left-0 text-xs text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {t('smart_search.tooltip_hint')}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary-500">
                                    {isSearching ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder={isSearching ? t('smart_search.placeholder_active') : t('market.search_placeholder')}
                                    disabled={isSearching}
                                    className="w-full px-4 py-3 pl-12 bg-surface border border-surface-highlight rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-700 transition disabled:opacity-70"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="absolute right-2 top-2 px-4 py-1.5 bg-primary-700 text-text-primary rounded-lg hover:bg-primary-600 transition font-medium disabled:opacity-50"
                                >
                                    {isSearching ? t('smart_search.btn_analyzing') : t('market.search_btn') || t('smart_search.btn_search')}
                                </button>
                            </div>
                        </form>

                        {/* El indicador de radio se movió dentro de los estados específicos */}
                    </div>

                    {/* Mobile Distance Indicator */}
                    {/* El indicador de radio se movió dentro de los estados específicos */}
                </header>

                {/* Área de Filtros (Full Width) */}
                {
                    showFilters && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                            <MarketFilters
                                brands={brands}
                                vehicleTypes={vehicleTypes}
                                colors={colors}
                                currentFilters={searchParams}
                                onClose={() => setShowFilters(false)}
                            />
                        </div>
                    )
                }

                {/* Grid de Vehículos */}
                <div>
                    {(isFiltering && items.length === 0) ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-text-secondary">{t('common.searching')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredItems.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
                                    {filteredItems.slice(0, visibleCount).map((item) => {
                                        const isBusiness = item.feedType === 'BUSINESS'
                                        return (
                                            <div key={item.id} className={`bg-surface border rounded-2xl overflow-hidden hover:shadow-xl transition group relative ${isBusiness ? 'border-primary-700/30' : 'border-surface-highlight'}`}>
                                                {/* Imagen y Badge */}
                                                <Link
                                                    href={isBusiness
                                                        ? `/map-store?id=${item.id}`
                                                        : `/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`
                                                    }
                                                    className="block relative aspect-[4/3] bg-gray-800 group-hover:opacity-95 transition-opacity"
                                                >
                                                    {item.images && item.images[0] ? (
                                                        <img
                                                            src={item.images[0]}
                                                            alt={item.title}
                                                            className="w-full h-full object-contain bg-black/40"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary opacity-20">
                                                            {isBusiness ? (
                                                                <MapPin className="w-16 h-16" />
                                                            ) : (
                                                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12l-2.08-5.99z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    )}

                                                    {isBusiness && (
                                                        <div className="absolute top-3 right-10 z-10 px-2 py-0.5 bg-primary-600 text-[10px] text-white font-bold rounded-full">
                                                            {t('market.business_badge')}
                                                        </div>
                                                    )}



                                                </Link>

                                                <div className="p-2 md:p-4">
                                                    <Link
                                                        href={isBusiness
                                                            ? `/map-store?id=${item.id}`
                                                            : `/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`
                                                        }
                                                        className="block mb-0.5 group-hover:text-primary-400 transition"
                                                    >
                                                        <h3 className="font-bold text-xs md:text-lg text-text-primary line-clamp-1">
                                                            {item.brand ? `${item.brand} ${item.model}` : item.title}
                                                        </h3>
                                                    </Link>

                                                    {isBusiness ? (
                                                        <p className="text-[9px] font-bold text-primary-400 uppercase mb-1">
                                                            {item.category}
                                                        </p>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[9px] md:text-xs text-text-secondary">
                                                            <span>{item.year}</span>
                                                            <span>•</span>
                                                            <span>{formatNumber(item.mileage || 0, locale)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-1 mb-1.5 mt-1">
                                                        {!isBusiness && item.transmission && (
                                                            <Link
                                                                href={isBusiness
                                                                    ? `/map-store?id=${item.id}`
                                                                    : `/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`
                                                                }
                                                                className="text-[9px] md:text-xs text-text-secondary bg-surface-highlight px-1.5 py-0.5 rounded hover:bg-surface-highlight/80 transition"
                                                            >
                                                                {item.transmission}
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={isBusiness
                                                                ? `/map-store?id=${item.id}`
                                                                : `/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`
                                                            }
                                                            className="text-[9px] md:text-xs text-text-secondary bg-surface-highlight px-1.5 py-0.5 rounded hover:bg-surface-highlight/80 transition"
                                                        >
                                                            {/* 📍 ADMIN DYNAMIC LOCATION: Override city if it's an admin post */}
                                                            {item.isBoosted && activeLocation?.city ? activeLocation.city : item.city}
                                                        </Link>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto">
                                                        <div className="flex flex-col">
                                                            {!isBusiness ? (
                                                                <>
                                                                    <Link
                                                                        href={`/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`}
                                                                        className="block group/price"
                                                                    >
                                                                        <p className="font-bold text-sm md:text-xl text-primary-400 group-hover/price:text-primary-300 transition" suppressHydrationWarning>
                                                                            {formatPrice(item.price || 0, item.currency || 'MXN', locale)}
                                                                        </p>
                                                                    </Link>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Link
                                                                            href={`/vehicle/${item.id}${item.isBoosted && activeLocation?.city ? `?contextCity=${encodeURIComponent(activeLocation.city)}` : ''}`}
                                                                            className="text-[10px] font-bold text-primary-400 uppercase group-hover:text-primary-300"
                                                                        >
                                                                            {t('common.view_more') || 'Ver más'}
                                                                        </Link>
                                                                        <ReportImageButton
                                                                            imageUrl={item.images?.[0] || ''}
                                                                            vehicleId={item.id}
                                                                            className="!p-1 bg-transparent hover:text-red-500 scale-75 origin-left"
                                                                        />
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Link
                                                                        href={`/map-store?id=${item.id}`}
                                                                        className="text-[10px] font-bold text-primary-400 hover:underline"
                                                                    >
                                                                        {t('market.view_on_map')}
                                                                    </Link>
                                                                    <ReportImageButton
                                                                        imageUrl={item.images?.[0] || ''}
                                                                        businessId={item.id}
                                                                        className="!p-1 bg-transparent hover:text-red-500 scale-75 origin-left"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="hidden md:block">
                                                                <ShareButton
                                                                    title={item.title}
                                                                    text={t('market.interest_text').replace('{title}', item.title)}
                                                                    url={typeof window !== 'undefined' ? `${window.location.origin}${isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}` : (isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`)}
                                                                    variant="minimal"
                                                                />
                                                            </div>
                                                            <FavoriteButton
                                                                vehicleId={!isBusiness ? item.id : undefined}
                                                                businessId={isBusiness ? item.id : undefined}
                                                                initialIsFavorited={item.isFavorited}
                                                                size="md"
                                                                rounded="rounded-full"
                                                                className="shadow-md bg-surface border border-surface-highlight"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>



                                            </div>
                                        )
                                    })}

                                    {/* Action Card (Infinite Scroll Sentinel or Expand) */}
                                    {visibleCount < filteredItems.length ? (
                                        <div
                                            ref={lastItemRef}
                                            className="col-span-2 md:col-span-3 py-10 flex flex-col items-center justify-center space-y-4"
                                        >
                                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                            <p className="text-text-secondary text-sm font-medium animate-pulse">
                                                {t('market.loading_more') || 'Cargando más vehículos...'}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleExpandSearch}
                                            className="bg-primary-900/20 border-2 border-primary-700/50 hover:border-primary-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-primary-900/40 transition group min-h-[250px]"
                                        >
                                            <div className="w-16 h-16 bg-primary-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary-900/50">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <span className="font-bold text-lg text-white">
                                                {tierIndex === RADIUS_TIERS.length - 1 ? t('market.restart_search') : t('market.expand_search')}
                                            </span>
                                            <div className="mt-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                                <span className="text-[10px] md:text-xs text-primary-200 font-bold uppercase tracking-wider">
                                                    {t('market.radius_label').replace('{radius}', searchRadius.toString())} | {displayCity}
                                                </span>
                                            </div>
                                            <span className="text-sm text-primary-200 mt-2">
                                                {tierIndex === RADIUS_TIERS.length - 1 ? t('market.restart_search_desc') : t('market.expand_search_desc')}
                                            </span>

                                            <div className="mt-6 pt-6 border-t border-white/10 w-full flex flex-col items-center">
                                                <p className="text-xs text-primary-300 font-medium mb-3 uppercase tracking-wider">{t('market.cant_find_desc')}</p>
                                                <Link
                                                    href="/publish"
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-900 rounded-xl hover:bg-white/90 transition font-bold shadow-lg"
                                                >
                                                    <Plus size={18} />
                                                    {t('market.publish_cta')}
                                                </Link>
                                            </div>
                                        </button>

                                    )}
                                </div>
                            ) : (
                                <div className="mt-12 p-8 bg-surface border border-surface-highlight rounded-2xl text-center flex flex-col items-center mb-8 shadow-xl animate-in zoom-in duration-300">

                                    {/* 📍 Radio Badge movido aquí por petición del usuario */}
                                    <button
                                        onClick={() => setShowLocationModal(true)}
                                        className="mb-8 px-4 py-2 bg-primary-700/10 hover:bg-primary-700/20 active:scale-95 transition-all text-white text-xs rounded-full border border-primary-500/20 shadow-sm flex items-center gap-2 cursor-pointer group"
                                    >
                                        <MapPin className="w-3 h-3 text-primary-400" />
                                        <span className="font-bold text-primary-300">
                                            {t('market.radius_label').replace('{radius}', searchRadius.toString())} | {displayCity}
                                        </span>
                                        <Search className="w-3 h-3 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-text-primary">
                                            {searchRadius >= 5000 ? t('market.no_results') : t('market.cant_find_title')}
                                        </h3>
                                        <p className="text-text-secondary">
                                            {searchRadius >= 5000 ? t('market.try_adjusting') : t('market.cant_find_desc')}
                                        </p>
                                    </div>

                                    {/* Action Buttons for Empty List */}
                                    <div className="flex flex-col md:flex-row gap-3">
                                        {/* Always show Expand/Restart button here */}
                                        <button
                                            onClick={handleExpandSearch}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-700 text-text-primary rounded-xl hover:bg-primary-600 transition font-bold shadow-lg justify-center whitespace-nowrap"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {tierIndex === RADIUS_TIERS.length - 1 ? "Volver a empezar" : "Expandir búsqueda"}
                                        </button>

                                        {/* New: Change Location Button */}
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-surface-highlight/50 text-text-primary rounded-xl hover:bg-surface-highlight transition font-medium justify-center whitespace-nowrap"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {t('market.change_location')}
                                        </button>

                                        {/* Botón de publicar vehículo en estado vacío */}
                                        <Link
                                            href="/publish"
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-900 rounded-xl hover:bg-white/90 transition font-bold shadow-lg justify-center whitespace-nowrap"
                                        >
                                            <Plus size={20} />
                                            {t('market.publish_cta')}
                                        </Link>
                                    </div>
                                </div>

                            )}
                        </>
                    )}
                </div>

                {/* LOCATION MODAL */}
                {
                    showLocationModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                            <div className="bg-surface border border-surface-highlight rounded-xl w-full max-w-md p-6 relative">
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
                    )
                }
            </div>
        </div>
    )
}
