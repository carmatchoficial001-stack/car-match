"use client"
// v1.2 Random Feed & Global Country Lock

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { filterNearbyVehicles, searchCity, LocationData, getUserLocation, reverseGeocode, EXPANSION_TIERS } from '@/lib/geolocation'
import DistanceBadge from '@/components/DistanceBadge'
import Header from '@/components/Header'
import MarketFilters from '@/components/MarketFilters'
import FavoriteButton from '@/components/FavoriteButton'
import ContactButton from '@/components/ContactButton'
import ShareButton from '@/components/ShareButton'
import { formatPrice, formatNumber } from '@/lib/vehicleTaxonomy'

interface Vehicle {
    id: string
    title: string
    description: string
    brand: string
    model: string
    year: number
    price: number
    currency?: string | null
    city: string
    latitude: number | null
    longitude: number | null
    country?: string | null // 🌍 Frontera Digital
    isFavorited?: boolean
    transmission: string | null
    mileage: number | null
    color: string | null
    vehicleType: string | null
    user: {
        name: string
        image: string | null
    }
    _count: {
        favorites: number
    }
    images?: string[]
    distance?: number
}

interface MarketClientProps {
    initialVehicles: Vehicle[]
    currentUserId: string
    brands: string[]
    vehicleTypes: string[]
    colors: string[]
    searchParams: any
}

// Utility: Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray
}

export default function MarketClient({
    initialVehicles,
    currentUserId,
    brands,
    vehicleTypes,
    colors,
    searchParams
}: MarketClientProps) {
    return (
        <LocationProvider>
            <MarketContent
                vehicles={initialVehicles}
                brands={brands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={searchParams}
            />
        </LocationProvider>
    )
}

function MarketContent({ vehicles, brands, vehicleTypes, colors, searchParams }: any) {
    const { t, locale } = useLanguage()

    // 🎲 RANDOMIZATION STATE
    // Almacenamos los vehículos en un orden aleatorio fijo para esta sesión
    const [randomizedVehicles, setRandomizedVehicles] = useState<Vehicle[]>([])

    // ANILLOS PROGRESIVOS (igual que SwipeClient): Siempre empezar en 12km
    // 12km → 100km → 250km → 500km → 1000km → 2500km → 5000km → (ciclo)
    const RADIUS_TIERS = [12, 100, 250, 500, 1000, 2500, 5000]
    // SIEMPRE empezar en tierIndex 0 (12km) al entrar a MarketCar
    const [tierIndex, setTierIndex] = useState(0)
    const searchRadius = RADIUS_TIERS[tierIndex]

    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    // Manual Location State
    const [manualLocation, setManualLocation] = useState<LocationData | null>(null)
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationInput, setLocationInput] = useState('')
    const [userCountry, setUserCountry] = useState<string>('MX') // Default MX until detected

    // 📄 Pagination State
    const [visibleCount, setVisibleCount] = useState(6)
    const CARS_PER_PAGE = 6

    // Missing state for Smart Expand
    const [userLocationState, setUserLocationState] = useState<{ lat: number; lng: number } | null>(null)

    // Silence unused warning for now (or use it)
    useEffect(() => {
        if (userLocationState) console.debug('Location locked for expansion:', userLocationState)
    }, [userLocationState])

    // 🎲 Effect: Init Shuffle (Solo una vez al montar o cambiar data base)
    useEffect(() => {
        // Solo barajamos si no hay filtros de ordenamiento explícitos (ej. precio, año)
        // Si el usuario pidió ordenar por precio, RESPETAMOS eso.
        // Si es "default" (newest/aleatorio), aplicamos shuffle.
        const shouldShuffle = !searchParams.sort || searchParams.sort === 'newest'

        if (shouldShuffle) {
            setRandomizedVehicles(shuffleArray(vehicles))
        } else {
            setRandomizedVehicles(vehicles)
        }
    }, [vehicles, searchParams.sort])

    // Filtrar vehículos por GPS o por ciudad manual
    useEffect(() => {
        const filterVehicles = async () => {
            // Si aún no tenemos los vehículos randomizados (primer render), esperamos
            // Salvo que no haya vehículos, entonces procedemos para mostrar "No results"
            if (randomizedVehicles.length === 0 && vehicles.length > 0) return

            try {
                // Usamos randomizedVehicles como base (ya barajados)
                const sourceVehicles = randomizedVehicles.length > 0 ? randomizedVehicles : vehicles

                // Si el radio es "infinito" (ej. mayor a 5000), mostramos todo
                if (searchRadius > 5000) {
                    setFilteredVehicles(sourceVehicles)
                    setLoading(false)
                    return
                }

                // Prioridad: Ubicación Manual > GPS
                let userLat: number, userLng: number
                let currentCountry = userCountry

                if (manualLocation) {
                    userLat = manualLocation.latitude
                    userLng = manualLocation.longitude
                    if (manualLocation.country) {
                        // 🌍 FRONTERA DIGITAL GLOBAL: Usar el código real
                        // Ya no forzamos MX/US, aceptamos lo que venga (ES, AR, CO...)
                        let code = manualLocation.countryCode?.toUpperCase() || 'MX'

                        // Fallback si no viene countryCode pero sí country string
                        if (!manualLocation.countryCode && manualLocation.country) {
                            const c = manualLocation.country.toUpperCase()
                            // Simple heuristic fallback
                            if (c.includes('MÉXICO') || c.includes('MEXICO')) code = 'MX'
                            else if (c.includes('ESTADOS UNIDOS') || c.includes('USA') || c.includes('UNITED STATES')) code = 'US'
                            // Si no sabemos, dejamos el que está o tratamos de inferir
                        }

                        currentCountry = code
                        setUserCountry(code)
                    }
                } else {
                    // Intentar usar GPS robusto (con reintentos)
                    try {
                        const coords = await getUserLocation()
                        userLat = coords.latitude
                        userLng = coords.longitude

                        // 🌍 Detectar país del usuario
                        const locData = await reverseGeocode(userLat, userLng)
                        if (locData.countryCode) {
                            // GLOBAL: Usar código directo
                            const code = locData.countryCode.toUpperCase()
                            currentCountry = code
                            setUserCountry(code)
                        }
                    } catch (error) {
                        console.warn('Fallo getUserLocation en Market, usando defaults', error)
                        throw error // Dejar que el catch de abajo maneje el fallback
                    }
                }

                // Guardar location para Smart Expand
                setUserLocationState({ lat: userLat, lng: userLng })

                // Filtrar vehículos dentro del radio actual

                const withDistances = sourceVehicles
                    .filter((v: Vehicle) => v.latitude != null && v.longitude != null)
                    .map(vehicle => ({
                        ...vehicle,
                        distance: calcDist(userLat, userLng, vehicle.latitude!, vehicle.longitude!)
                    }))


                // 🌍 FRONTERA DIGITAL: Filtrar por país
                const inCountry = withDistances.filter((v: any) => {
                    const vCountry = v.country || 'MX'
                    return vCountry === currentCountry
                })

                // 2. Agrupar por "Anillos Concéntricos" (Tiers)
                // Usamos los mismos cortes que en SwipeClient para consistencia
                const tiers = [
                    { max: 12, items: [] as any[] },      // 0-12km (Local)
                    { max: 100, items: [] as any[] },     // 12-100km
                    { max: 250, items: [] as any[] },     // 100-250km
                    { max: 500, items: [] as any[] },     // 250-500km
                    { max: 1000, items: [] as any[] },    // 500-1000km
                    { max: 2500, items: [] as any[] },    // 1000-2500km
                    { max: 5000, items: [] as any[] },    // 2500-5000km
                    { max: 99999, items: [] as any[] }    // +5000km (Todo)
                ]

                inCountry.filter((v: any) => v.distance <= searchRadius).forEach((v: any) => {
                    const tier = tiers.find(t => v.distance <= t.max)
                    if (tier) tier.items.push(v)
                })

                // 3. El orden final respeta los tiers pero mantiene el random interno si no hay sort
                const shouldIndividualShuffle = !searchParams.sort || searchParams.sort === 'newest'

                const finalOrder = tiers.reduce((acc, tier) => {
                    const items = shouldIndividualShuffle ? shuffleArray(tier.items) : tier.items
                    return [...acc, ...items]
                }, [] as any[])

                setFilteredVehicles(finalOrder)

            } catch (error: any) {
                // Mejorar log de errores de Geolocalización
                const errorMessage = error?.message || 'Error desconocido'
                if (error?.code === 1) {
                    console.log('📍 Permiso de ubicación denegado. Mostrando todos los vehículos.')
                } else {
                    console.warn('⚠️ Fallo al filtrar por GPS:', errorMessage)
                }

                // Fallback: Mostrar todo si falla GPS
                setFilteredVehicles(randomizedVehicles.length > 0 ? randomizedVehicles : vehicles)
            } finally {
                setLoading(false)
            }
        }

        filterVehicles()
    }, [vehicles, randomizedVehicles, searchRadius, manualLocation, userCountry])


    const router = useRouter()
    const [searchText, setSearchText] = useState(searchParams.search || '')
    const [isSearching, setIsSearching] = useState(false)

    const handleSmartSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchText.trim()) return

        setIsSearching(true)
        try {
            // 🧠 Consultar a Especialistas (Backend)
            const res = await fetch('/api/ai/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchText, context: 'MARKET' })
            })

            const data = await res.json()
            const filters = data.filters || {}

            // 2. Construir params URL con la interpretación experta
            const params = new URLSearchParams()
            params.set('search', searchText) // Mantener texto original

            if (filters.category) params.set('category', filters.category)
            if (filters.subType) params.set('subType', filters.subType)
            if (filters.brand) params.set('brand', filters.brand)
            if (filters.model) params.set('model', filters.model)
            if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
            if (filters.minYear) params.set('minYear', filters.minYear.toString())
            if (filters.transmission) params.set('transmission', filters.transmission)
            if (filters.fuel) params.set('fuel', filters.fuel)

            router.push(`/market?${params.toString()}`)

        } catch (error) {
            console.error('Error en búsqueda especializada:', error)
            // Fallback: búsqueda simple por texto si falla
            router.push(`/market?search=${encodeURIComponent(searchText)}`)
        } finally {
            setIsSearching(false)
        }
    }

    // Expandir búsqueda (Loop circular)
    const handleExpandSearch = () => {
        setLoading(true)
        setTimeout(() => {
            setTierIndex(prev => (prev + 1) % RADIUS_TIERS.length)
            setVisibleCount(CARS_PER_PAGE)
            setLoading(false)
        }, 300)
    }

    const isNational = searchRadius > 5000

    const searchManualLocation = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!locationInput.trim()) return
        const result = await searchCity(locationInput)
        if (result) {
            setManualLocation(result)
            setTierIndex(0) // Reset radius logic to start local around new city
            setShowLocationModal(false)
        } else {
            alert('Ciudad no encontrada')
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    {/* Controles en una sola línea */}
                    <div className="flex flex-row gap-2 md:gap-4 items-center">
                        {/* Botón para mostrar/ocultar filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 md:px-6 py-3 bg-surface border border-surface-highlight rounded-xl text-text-primary font-medium hover:border-primary-700 transition flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>{showFilters ? t('market.hide_filters') : t('market.show_filters')}</span>
                        </button>

                        {/* Barra de búsqueda con IA */}
                        <form onSubmit={handleSmartSearch} className="flex-1 w-full relative group">
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
                                    placeholder={isSearching ? t('smart_search.placeholder_active') : t('market.search_placeholder') || t('smart_search.placeholder_default')}
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
                    </div>
                </header>

                {/* Área de Filtros (Full Width) */}
                {showFilters && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <MarketFilters
                            brands={brands}
                            vehicleTypes={vehicleTypes}
                            colors={colors}
                            currentFilters={searchParams}
                        />
                    </div>
                )}

                {/* Grid de Vehículos */}
                <div>
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-text-secondary">{t('market.searching')}</p>
                            </div>
                        </div>
                    )}

                    {/* Grid de resultados */}
                    {!loading && (
                        <>
                            {filteredVehicles.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
                                    {filteredVehicles.slice(0, visibleCount).map((vehicle) => (
                                        <div key={vehicle.id} className="bg-surface border border-surface-highlight rounded-2xl overflow-hidden hover:shadow-xl transition group">
                                            {/* Imagen y Badge */}
                                            <Link href={`/vehicle/${vehicle.id}`} className="block relative aspect-video bg-gray-800">
                                                {vehicle.images && vehicle.images[0] ? (
                                                    <img
                                                        src={vehicle.images[0]}
                                                        alt={vehicle.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-text-secondary opacity-20">
                                                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                                        </svg>
                                                    </div>
                                                )}

                                                <div className="absolute top-3 left-3 z-10">
                                                    <FavoriteButton
                                                        vehicleId={vehicle.id}
                                                        initialIsFavorited={vehicle.isFavorited}
                                                        size="sm"
                                                    />
                                                </div>

                                            </Link>

                                            <div className="p-3 md:p-4">
                                                <Link href={`/vehicle/${vehicle.id}`} className="block mb-1 group-hover:text-primary-400 transition">
                                                    <h3 className="font-bold text-sm md:text-lg text-text-primary line-clamp-1">
                                                        {vehicle.title}
                                                    </h3>
                                                </Link>

                                                <div className="flex items-center gap-2 text-[10px] md:text-xs text-text-secondary mt-0.5">
                                                    <span>{vehicle.year}</span>
                                                    <span>•</span>
                                                    <span>{formatNumber(vehicle.mileage || 0, locale)}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                                                    {vehicle.transmission && (
                                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-text-secondary bg-surface-highlight px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                                                            <span className="truncate">{vehicle.transmission}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-text-secondary bg-surface-highlight px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                                                        <span>{vehicle.city}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2 md:mt-4">
                                                    <p className="font-bold text-lg md:text-xl text-primary-400 mt-auto" suppressHydrationWarning>
                                                        {formatPrice(vehicle.price, vehicle.currency || 'MXN', locale)}
                                                    </p>
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        {/* Hidden on small mobile to save space, visible on hover or larger */}
                                                        <div className="hidden md:block">
                                                            <ShareButton
                                                                title={vehicle.title}
                                                                text={`¡Mira este ${vehicle.title} en CarMatch!`}
                                                                url={`https://carmatch.app/vehicle/${vehicle.id}`}
                                                                variant="minimal"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Action Card (Load More or Expand) */}
                                    {(visibleCount < filteredVehicles.length) ? (
                                        // Card: Ver más
                                        <button
                                            onClick={() => setVisibleCount(prev => prev + CARS_PER_PAGE)}
                                            className="bg-surface border border-surface-highlight hover:border-primary-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-surface-highlight/50 transition group min-h-[250px]"
                                        >
                                            <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            <span className="font-bold text-lg text-text-primary">Ver más vehículos</span>
                                            <span className="text-sm text-text-secondary mt-1">Cargar siguientes {CARS_PER_PAGE}</span>
                                        </button>
                                    ) : (
                                        // Card: Expandir
                                        (
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
                                                    {tierIndex === RADIUS_TIERS.length - 1 ? "Volver a empezar" : "Expandir búsqueda"}
                                                </span>
                                                <span className="text-sm text-primary-200 mt-1">
                                                    {tierIndex === RADIUS_TIERS.length - 1 ? "Reiniciar búsqueda desde tu zona" : "Busca el siguiente auto disponible"}
                                                </span>
                                            </button>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="mt-12 p-8 bg-surface-highlight/20 border border-surface-highlight rounded-2xl text-center md:flex md:items-center md:justify-between mb-8">
                                    <div className="mb-4 md:mb-0 text-left">
                                        <h3 className="text-xl font-bold text-text-primary">
                                            {searchRadius >= 5000 ? t('market.no_results') : t('market.cant_find_title')}
                                        </h3>
                                        <p className="text-text-secondary">
                                            {searchRadius >= 5000 ? t('market.try_adjusting') : t('market.cant_find_desc')}
                                        </p>
                                    </div>

                                    {/* Action Button for Empty List */}
                                    {searchRadius < 5000 ? (
                                        <button
                                            onClick={handleExpandSearch}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-700 text-text-primary rounded-xl hover:bg-primary-600 transition font-bold shadow-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {tierIndex === RADIUS_TIERS.length - 1 ? "Volver a empezar" : "Expandir búsqueda"}
                                        </button>
                                    ) : (
                                        <Link
                                            href="/publish"
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-surface border border-primary-700/50 text-primary-400 rounded-xl hover:bg-primary-700 hover:text-text-primary transition font-bold"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {t('market.publish_cta')}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* LOCATION MODAL */}
                {showLocationModal && (
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
                                Ingresa una ciudad para ver vehículos en esa zona (ej. "Guadalajara", "Miami").
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
        </div>
    )
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const lat1Rad = toRad(lat1)
    const lat2Rad = toRad(lat2)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(value: number) {
    return value * Math.PI / 180
}
