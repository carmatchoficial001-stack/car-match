"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { BUSINESS_CATEGORIES as CATEGORIES } from '@/lib/businessCategories'
import { useLocation } from '@/contexts/LocationContext'
import { Star, Sparkles, MapPin, Settings2, Plus } from 'lucide-react'

const MapBoxStoreLocator = dynamic(() => import('@/components/MapBoxStoreLocator'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white/20 uppercase tracking-widest font-black">Cargando Mapa...</div>
})

const BusinessDetailsModal = dynamic(() => import('@/components/BusinessDetailsModal'), { ssr: false })
const BusinessListCard = dynamic(() => import('@/components/BusinessListCard'), { ssr: false })


interface MapClientProps {
    businesses: any[]
    user: any
}

async function searchCity(query: string) {
    try {
        const res = await fetch(`/api/geolocation?q=${encodeURIComponent(query)}`)
        if (!res.ok) return null
        const data = await res.json()
        if (data.latitude && data.longitude) {
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                city: data.city || query, // Fallback al query si no hay ciudad
                country: data.country || ''
            }
        }
        return null
    } catch (error) {
        console.error('Error in searchCity:', error)
        return null
    }
}

export default function MapClient({ businesses, user }: MapClientProps) {
    const { t } = useLanguage()
    // 🔥 USANDO CONTEXTO GLOBAL
    const { location, loading, error, refreshLocation, setManualLocation } = useLocation()
    const searchParams = useSearchParams()
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSidebar, setShowSidebar] = useState(false) // Mobile toggle
    const [mapKey, setMapKey] = useState(() => Math.random()) // Force map remount
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [cityInput, setCityInput] = useState('')
    const [stateInput, setStateInput] = useState('')
    const [countryInput, setCountryInput] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false) // Loading para IA

    const [searchSuccess, setSearchSuccess] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null)
    const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null)
    const [dynamicBusinesses, setDynamicBusinesses] = useState<any[]>(businesses)
    const [isLoadingBounds, setIsLoadingBounds] = useState(false)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)
    const lastBounds = useRef<string>('')

    const isGuest = !user

    // Listen for custom event from MapBoxStoreLocator
    useEffect(() => {
        const handleOpenModal = (e: CustomEvent<string>) => {
            const businessId = e.detail
            const business = dynamicBusinesses.find(b => b.id === businessId)
            if (business) {
                setSelectedBusiness(business)
                setActiveBusinessId(businessId)
                // Registrar vista real / apertura de tarjeta
                fetch(`/api/businesses/${businessId}/view`, { method: 'POST' }).catch(() => { })
            }
        }

        window.addEventListener('open-business-modal' as any, handleOpenModal as any)

        return () => {
            window.removeEventListener('open-business-modal' as any, handleOpenModal as any)
        }
    }, [dynamicBusinesses])

    // 🗺️ Dynamic Bounds Fetch
    const handleBoundsChange = (bounds: any) => {
        const boundsKey = JSON.stringify(bounds)
        if (boundsKey === lastBounds.current) return
        lastBounds.current = boundsKey

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        debounceTimer.current = setTimeout(async () => {
            setIsLoadingBounds(true)
            try {
                const params = new URLSearchParams({
                    minLat: bounds.minLat.toString(),
                    maxLat: bounds.maxLat.toString(),
                    minLng: bounds.minLng.toString(),
                    maxLng: bounds.maxLng.toString(),
                    category: selectedCategories.length === 1 ? selectedCategories[0] : 'all'
                })

                const res = await fetch(`/api/businesses/bounds?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    // Merge with existing to avoid flickering, or replace to satisfy "only what is seen"
                    // Additive is usually better for mobile UX so items don't disappear from list while panning slightly
                    setDynamicBusinesses(prev => {
                        const existingIds = new Set(prev.map(b => b.id))
                        const newOnes = data.businesses.filter((b: any) => !existingIds.has(b.id))
                        return [...prev, ...newOnes].slice(-1000) // Keep a reasonable pool
                    })
                }
            } catch (err) {
                console.error("Bounds fetch error:", err)
            } finally {
                setIsLoadingBounds(false)
            }
        }, 800)
    }

    const handleSmartSearch = async () => {
        if (!searchQuery.trim()) return

        setIsAnalyzing(true)
        setSearchSuccess(false)
        setHasSearched(false)
        setSelectedCategories([]) // 🔥 RESET MAP IMMEDIATELY ON NEW SEARCH
        let successFound = false

        try {
            const response = await fetch('/api/ai/analyze-problem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    categories: CATEGORIES.map(cat => ({
                        id: cat.id,
                        label: cat.label,
                        keywords: cat.keywords
                    }))
                })
            })

            if (!response.ok) throw new Error('FALLBACK_MODE')

            const data = await response.json()

            if (data.categories && data.categories.length > 0) {
                // 🔥 CLEAR PREVIOUS MANUAL FILTERS
                setSelectedCategories(data.categories)
                setSearchSuccess(true)
                successFound = true
            } else {
                setSelectedCategories([])
            }
        } catch (error: any) {
            // Fallback a búsqueda básica mejorada
            const query = searchQuery.toLowerCase()
            const detectedCats: string[] = []

            const isCarRelated = /\b(carro|auto|automovil|vehiculo|sedan|suv|pick.*up|camioneta)\b/i.test(searchQuery)
            const isMotorcycleRelated = /\b(moto|motocicleta|scooter|cuatrimoto)\b/i.test(searchQuery)

            CATEGORIES.forEach(cat => {
                if (isCarRelated && cat.id === 'MOTOS') return
                if (isMotorcycleRelated && !['MOTOS', 'LLANTAS', 'GRUAS'].includes(cat.id)) return

                if (cat.keywords.some(k => {
                    const normalizedK = k.toLowerCase()
                    if (normalizedK === 'moto') return new RegExp(`\\b${normalizedK}\\b`, 'i').test(query)

                    // 🧠 FLEXIBLE MATCHING: If the query contains any significant word from the keyword
                    // e.g., "llantas" matches "Venta de Llantas"
                    const kWords = normalizedK.split(' ').filter(w => w.length > 3)
                    return kWords.some(word => query.includes(word)) || query.includes(normalizedK)
                })) {
                    detectedCats.push(cat.id)
                }
            })

            setSelectedCategories(detectedCats)
            if (detectedCats.length > 0) {
                setSearchSuccess(true)
                successFound = true
            }
        } finally {
            setIsAnalyzing(false)
            setHasSearched(true)

            // 🪄 AUTO-CLOSE SIDEBAR IF SUCCESSFUL (Using local variable to avoid stale state)
            if (successFound) {
                setTimeout(() => {
                    setShowSidebar(false)
                }, 1500)
            }
        }
    }



    // 🔗 URL Params Handler: Check for shared links logic (Category + Lat/Lng + Highlight)
    useEffect(() => {
        // Only run once when loaded
        if (!searchParams) return

        const catParam = searchParams.get('category')
        const latParam = searchParams.get('lat')
        const lngParam = searchParams.get('lng')
        const highlightParam = searchParams.get('id') // Added handling for 'id' directly

        if (catParam) {
            setSelectedCategories([catParam])
        }

        if (highlightParam) {
            const business = businesses.find(b => b.id === highlightParam)
            if (business) {
                setSelectedBusiness(business)
                setActiveBusinessId(highlightParam)
                setManualLocation({
                    latitude: Number(business.latitude),
                    longitude: Number(business.longitude),
                    city: business.city || '',
                    country: ''
                })
                // Trigger view
                fetch(`/api/businesses/${highlightParam}/view`, { method: 'POST' }).catch(() => { })
            }
        } else if (latParam && lngParam) {
            const lat = parseFloat(latParam)
            const lng = parseFloat(lngParam)
            if (!isNaN(lat) && !isNaN(lng)) {
                // Update manual location to focus map there immediately
                setManualLocation({
                    latitude: lat,
                    longitude: lng,
                    city: t('market.shared_location'),
                    country: ''
                })
            }
        }
    }, [searchParams, setManualLocation])

    // 🔍 Búsqueda Inteligente con Análisis Especializado
    const searchManualLocation = async (e?: React.FormEvent) => {
        e?.preventDefault()

        // Concatenar para búsqueda exacta
        const queryParts = [cityInput, stateInput, countryInput].filter(p => p.trim())
        if (queryParts.length === 0) return

        const fullQuery = queryParts.join(', ')

        try {
            const result = await searchCity(fullQuery)
            if (result) {
                setManualLocation(result)
                setShowLocationModal(false)
                // Limpiar campos
                setCityInput('')
                setStateInput('')
                setCountryInput('')
            } else {
                alert(t('map_store.location_not_found'))
            }
        } catch (error) {
            console.error('Error buscando ciudad:', error)
            alert(t('map_store.location_search_error'))
        }
    }

    // Toggle Category
    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        )
    }

    // Filter Logic
    const filteredBusinesses = useMemo(() => {
        let result = dynamicBusinesses;
        if (selectedCategories.length > 0) {
            result = result.filter(b => selectedCategories.includes(b.category));
        }

        // Sorting: If user has location, sort by distance? Or just boosted first.
        // For now, let's keep it simple.
        return result;
    }, [dynamicBusinesses, selectedCategories])

    // 🔒 Si está cargando la ubicación, mostrar pantalla de carga
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-primary-700 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">
                            {t('map_store.loading_location')}
                        </h2>
                        <p className="text-text-secondary">
                            {t('map_store.location_permission_msg')}
                        </p>
                        <div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
                            <div className="h-full bg-primary-700 rounded-full animate-pulse w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 🚫 Si hay error de ubicación, mostrar pantalla de solicitud
    if (error || !location) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">
                            {t('map_store.location_required')}
                        </h2>
                        <p className="text-text-secondary">
                            {t('map_store.location_access_msg')}
                        </p>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <p className="text-sm text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={refreshLocation}
                                className="w-full px-6 py-3 bg-primary-700 hover:bg-primary-600 text-white rounded-lg font-medium transition flex items-center gap-2 justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t('map_store.allow_gps')}
                            </button>

                            <button
                                onClick={() => setShowLocationModal(true)}
                                className="w-full px-6 py-3 bg-surface border border-surface-highlight hover:border-primary-700 text-text-primary rounded-lg font-medium transition flex items-center gap-2 justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('map_store.manual_location')}
                            </button>
                        </div>

                        <div className="bg-surface-highlight rounded-lg p-4 space-y-2">
                            <h3 className="font-semibold text-text-primary text-sm">{t('map_store.how_to_activate')}</h3>
                            <ol className="text-xs text-text-secondary text-left space-y-1 list-decimal list-inside">
                                <li>{t('map_store.step_1')}</li>
                                <li>{t('map_store.step_2')}</li>
                                <li>{t('map_store.step_3')}</li>
                            </ol>
                            <p className="text-xs text-text-secondary italic pt-2 border-t border-surface-highlight mt-2">
                                {t('map_store.manual_tip')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }



    return (
        <div className="flex flex-col h-full bg-background overflow-hidden pb-safe">

            <div className="flex-1 relative flex overflow-hidden">

                {/* 🗺️ MAP (FULL SCREEN) */}
                <div className="absolute inset-0 z-0">
                    <MapBoxStoreLocator
                        businesses={filteredBusinesses}
                        categoryColors={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.color }), {})}
                        categoryEmojis={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.icon }), {})}
                        initialLocation={location ? { latitude: location.latitude, longitude: location.longitude } : undefined}
                        onBoundsChange={handleBoundsChange}
                        highlightCategories={searchSuccess ? selectedCategories : []}
                    />
                </div>


                {/* 📱 BOTÓN MOSTRAR FILTROS (FLOTANTE) */}
                {!showSidebar && (
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="absolute top-6 left-6 z-30 px-8 py-4 bg-primary-700 text-white rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.5)] font-black uppercase tracking-[0.15em] border-2 border-primary-500/50 flex items-center gap-3 active:scale-95 hover:bg-primary-600 transition-all animate-in fade-in slide-in-from-left-4 duration-500"
                    >
                        <Settings2 size={24} />
                        {t('map_store.show_filters')}
                    </button>
                )}

                {/* 🗂️ PANEL DE FILTROS (OVERLAY PANAL) */}
                <div className={`
                    absolute inset-0 z-40 flex items-end md:items-start justify-start transition-all duration-500
                    ${showSidebar ? 'visible' : 'invisible'}
                `}>
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity duration-500 ${showSidebar ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setShowSidebar(false)}
                    />

                    {/* Filter Panel (SIDEBAR STYLE) */}
                    <div className={`
                        relative h-full w-full md:w-[450px] bg-surface/90 backdrop-blur-2xl border-r border-surface-highlight shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-500 ease-out transform
                        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                    `}>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-20">
                            {/* 1. REGISTRAR NEGOCIO Y CERRAR */}
                            <div className="flex gap-2">
                                <a
                                    href="/my-businesses?action=new"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-primary-600/20 transition-all active:scale-[0.97] border border-white/10"
                                >
                                    <Plus size={16} strokeWidth={4} />
                                    Registrar Negocio
                                </a>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-highlight text-text-primary hover:bg-red-500/20 hover:text-red-500 transition-all border border-surface-highlight"
                                >
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            {/* 2. PREGUNTAR AL EXPERTO (SMART SEARCH) */}
                            <div className="bg-surface-highlight/20 rounded-2xl p-4 border border-surface-highlight/50">
                                <div className="space-y-3">
                                    <textarea
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setSearchSuccess(false)
                                            setHasSearched(false)
                                        }}
                                        placeholder={t('map_store.smart_search_placeholder')}
                                        className="w-full bg-background/40 border border-surface-highlight rounded-xl p-3 text-xs text-text-primary focus:border-primary-600 focus:outline-none resize-none h-20 transition-all"
                                        disabled={isAnalyzing}
                                    />
                                    <button
                                        onClick={handleSmartSearch}
                                        disabled={isAnalyzing || !searchQuery.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg shadow-md hover:bg-primary-600 transition-all disabled:opacity-30 text-[10px] font-black uppercase tracking-wider"
                                    >
                                        {isAnalyzing ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                Preguntar al experto
                                            </>
                                        )}
                                    </button>

                                    {searchSuccess && !isAnalyzing && (
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl animate-in fade-in zoom-in duration-300">
                                            <p className="text-[10px] text-green-400 font-bold text-center leading-relaxed">
                                                Ya te seleccioné los negocios indicados, <br />
                                                dale click en <span className="text-white underline">VER EN EL MAPA</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. LISTA DE FILTROS */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                    {(() => {
                                        const publicIds = ['caseta', 'hospital', 'policia', 'aeropuerto', 'estacion_tren'];

                                        // Helper to sort by translated name
                                        const sortByLabel = (a: any, b: any) => {
                                            const labelA = t(`map_store.categories.${a.id}`) || a.label;
                                            const labelB = t(`map_store.categories.${b.id}`) || b.label;
                                            return labelA.localeCompare(labelB);
                                        };

                                        const commercial = CATEGORIES.filter(c => !publicIds.includes(c.id)).sort(sortByLabel);
                                        const publicServices = CATEGORIES.filter(c => publicIds.includes(c.id)).sort(sortByLabel);

                                        const renderCategory = (cat: any) => {
                                            const isSelected = selectedCategories.includes(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`
                                                        w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 group
                                                        ${isSelected
                                                            ? 'bg-primary-700/20 border-primary-600 text-white shadow-glow-sm scale-[1.01]'
                                                            : 'bg-surface/30 border-surface-highlight/30 hover:border-surface-highlight hover:bg-surface/50'
                                                        }
                                                    `}
                                                    style={{
                                                        borderColor: isSelected ? cat.color : undefined,
                                                    }}
                                                >
                                                    <span className={`text-xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                        {cat.icon}
                                                    </span>
                                                    <div className="flex-1 text-left">
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                            {t(`map_store.categories.${cat.id}`) || cat.label}
                                                        </span>
                                                    </div>
                                                    {isSelected ? (
                                                        <div
                                                            className="w-4 h-4 rounded-full shadow-glow-sm"
                                                            style={{ backgroundColor: cat.color }}
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border border-surface-highlight opacity-30" />
                                                    )}
                                                </button>
                                            );
                                        };

                                        return (
                                            <>
                                                {/* Commercial Categories */}
                                                {commercial.map(renderCategory)}

                                                {/* Divider */}
                                                <div className="pt-4 pb-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-[1px] flex-1 bg-surface-highlight/30"></div>
                                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                                            Servicios Públicos
                                                        </span>
                                                        <div className="h-[1px] flex-1 bg-surface-highlight/30"></div>
                                                    </div>
                                                </div>

                                                {/* Public Services */}
                                                {publicServices.map(renderCategory)}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Footer de Aplicar */}
                        <div className="p-4 bg-surface-highlight/20 border-t border-surface-highlight">
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="w-full py-4 bg-primary-700 text-white rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary-600 active:scale-95 transition-all"
                            >
                                Ver en el Mapa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌍 MODAL DE UBICACIÓN MANUAL */}
            {showLocationModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-4">
                    <div className="bg-surface border border-surface-highlight rounded-xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setShowLocationModal(false)}
                            className="absolute top-4 right-4 text-text-secondary hover:text-white"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-text-primary mb-4">{t('map_store.modal_title')}</h3>
                        <p className="text-text-secondary text-sm mb-6">
                            {t('map_store.modal_desc')}
                        </p>

                        <form onSubmit={searchManualLocation} className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">{t('map_store.country_label')}</label>
                                    <input
                                        type="text"
                                        value={countryInput}
                                        onChange={(e) => setCountryInput(e.target.value)}
                                        placeholder={t('map_store.country_placeholder')}
                                        className="w-full px-4 py-2.5 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">{t('map_store.state_label')}</label>
                                    <input
                                        type="text"
                                        value={stateInput}
                                        onChange={(e) => setStateInput(e.target.value)}
                                        placeholder={t('map_store.state_placeholder')}
                                        className="w-full px-4 py-2.5 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">{t('map_store.city_label')}</label>
                                    <input
                                        type="text"
                                        value={cityInput}
                                        onChange={(e) => setCityInput(e.target.value)}
                                        placeholder={t('map_store.city_placeholder')}
                                        className="w-full px-4 py-2.5 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-500 outline-none text-sm"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLocationModal(false)
                                        setCityInput('')
                                        setStateInput('')
                                        setCountryInput('')
                                    }}
                                    className="flex-1 px-4 py-3 bg-surface-highlight text-text-primary rounded-lg font-medium hover:bg-surface-highlight/80"
                                >
                                    {t('map_store.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700"
                                >
                                    {t('map_store.search')}
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 p-3 bg-surface-highlight/30 rounded-lg">
                            <p className="text-xs text-text-secondary">
                                {t('map_store.global_search_tip')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 🏬 MODAL DE DETALLES DEL NEGOCIO (NEW) */}
            {selectedBusiness && (
                <BusinessDetailsModal
                    business={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                    categoryColor={CATEGORIES.find(c => c.id === selectedBusiness.category)?.color}
                    categoryEmoji={CATEGORIES.find(c => c.id === selectedBusiness.category)?.icon}
                />
            )}
        </div>
    )
}
