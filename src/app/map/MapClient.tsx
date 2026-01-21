"use client"

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { BUSINESS_CATEGORIES as CATEGORIES } from '@/lib/businessCategories'
import { useLocation } from '@/contexts/LocationContext'
import { Star, Sparkles, MapPin } from 'lucide-react'

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

    const isGuest = !user

    // Listen for custom event from MapBoxStoreLocator
    useEffect(() => {
        const handleOpenModal = (e: CustomEvent<string>) => {
            const businessId = e.detail
            const business = businesses.find(b => b.id === businessId)
            if (business) {
                setSelectedBusiness(business)
                setActiveBusinessId(businessId)
                // Registrar vista real / apertura de tarjeta
                fetch(`/api/businesses/${businessId}/view`, { method: 'POST' }).catch(() => { })

                // Centrar en scroll la lista si es mobile o desktop sidebar
                const cardElement = document.getElementById(`business-card-${businessId}`);
                if (cardElement) {
                    cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        window.addEventListener('open-business-modal' as any, handleOpenModal as any)

        return () => {
            window.removeEventListener('open-business-modal' as any, handleOpenModal as any)
        }
    }, [businesses])

    const handleSmartSearch = async () => {
        if (!searchQuery.trim()) return

        setIsAnalyzing(true)
        setSearchSuccess(false)
        setHasSearched(false)

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.warn('⚠️ IA Smart Search no disponible:', errorData.error || response.statusText)
                throw new Error('FALLBACK_MODE')
            }

            const data = await response.json()

            if (data.categories && data.categories.length > 0) {
                setSelectedCategories(data.categories)
                setSearchSuccess(true)
            } else {
                setSelectedCategories([])
            }
        } catch (error: any) {
            // Solently handle all errors to enforce fallback
            if (error.message !== 'FALLBACK_MODE') {
                console.warn('⚠️ Error de conexión con IA, usando búsqueda local:', error.message)
            }
            // Fallback a búsqueda básica mejorada
            const query = searchQuery.toLowerCase()
            const detectedCats: string[] = []

            // Detectar si menciona "carro", "auto", "vehículo" → excluir motos
            const isCarRelated = /\b(carro|auto|automovil|vehiculo|sedan|suv|pick.*up|camioneta)\b/i.test(searchQuery)
            const isMotorcycleRelated = /\b(moto|motocicleta|scooter|cuatrimoto)\b/i.test(searchQuery)

            CATEGORIES.forEach(cat => {
                // Excluir motos si habla de carros
                if (isCarRelated && cat.id === 'MOTOS') return
                // Excluir categorías de carros si habla de motos
                if (isMotorcycleRelated && !['MOTOS', 'LLANTAS', 'GRUAS'].includes(cat.id)) return

                if (cat.keywords.some(k => {
                    // Fix: Evitar que 'moto' haga match con 'motor'
                    if (k === 'moto') {
                        return new RegExp(`\\b${k}\\b`, 'i').test(query)
                    }
                    return query.includes(k)
                })) {
                    detectedCats.push(cat.id)
                }
            })

            setSelectedCategories(detectedCats)
            if (detectedCats.length > 0) {
                setSearchSuccess(true)
            }
        } finally {
            setIsAnalyzing(false)
            setHasSearched(true)
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
        let result = businesses;
        if (selectedCategories.length > 0) {
            result = result.filter(b => selectedCategories.includes(b.category));
        }

        // Sorting: If user has location, sort by distance? Or just boosted first.
        // For now, let's keep it simple.
        return result;
    }, [businesses, selectedCategories])

    // 🔒 Si está cargando la ubicación, mostrar pantalla de carga
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
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
                <Header />
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
        <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen bg-background overflow-hidden pb-safe">
            <Header />

            <div className="flex-1 relative flex overflow-hidden">

                {/* 📱 Mobile Toggle Button (Over Map) */}
                <button
                    onClick={() => setShowSidebar(true)}
                    className="md:hidden absolute top-4 left-4 z-10 px-6 py-2.5 bg-primary-700 text-white rounded-full shadow-2xl font-black uppercase tracking-widest border-2 border-primary-500/50 flex items-center gap-2 active:scale-95 transition-all"
                >
                    <Star size={18} fill="currentColor" />
                    {t('map_store.view_list')}
                </button>

                {/* 🗂️ Sidebar (Desktop & Mobile Drawer) - GOOGLE STYLE RESULTS LIST */}
                <div className={`
                    fixed inset-0 z-[500] md:static flex-shrink-0 transition-all duration-300
                    ${showSidebar ? 'bg-black/60 backdrop-blur-sm' : 'pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100'}
                `}>
                    <div className={`
                        h-full w-full md:w-[420px] bg-surface border-r border-surface-highlight flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-out
                        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>

                        {/* Mobile Header / Top Header */}
                        <div className="p-4 border-b border-surface-highlight flex justify-between items-center bg-surface/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="font-black text-xl text-text-primary tracking-tight">MapStore</h2>
                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">{filteredBusinesses.length} {t('map_store.results_found')}</p>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-surface-highlight text-text-secondary">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface/50">
                            {/* 🧠 Smart Search Section */}
                            <div className="p-4 space-y-4">
                                {/* ➕ Add Business Button (Small) */}
                                <a
                                    href="/my-businesses?action=new"
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-primary-900/40 transition-all active:scale-[0.98] border border-white/10"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Registrar Negocio
                                </a>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <textarea
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setSearchSuccess(false)
                                                setHasSearched(false)
                                            }}
                                            placeholder={t('map_store.smart_search_placeholder')}
                                            className="w-full bg-background border border-surface-highlight rounded-2xl p-4 pr-12 text-base md:text-sm text-text-primary focus:border-primary-600 focus:outline-none resize-none h-24 shadow-inner transition-colors"
                                            disabled={isAnalyzing}
                                        />
                                        <button
                                            onClick={handleSmartSearch}
                                            disabled={isAnalyzing || !searchQuery.trim()}
                                            className="absolute right-3 bottom-3 p-2 bg-primary-700 text-white rounded-xl shadow-lg hover:bg-primary-600 transition disabled:opacity-30"
                                        >
                                            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={20} />}
                                        </button>
                                    </div>

                                    {searchSuccess && (
                                        <div className="flex flex-wrap gap-1 px-1">
                                            {selectedCategories.map(cat => (
                                                <span key={cat} className="text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">{cat}</span>
                                            ))}
                                            <button onClick={() => setSelectedCategories([])} className="text-[10px] text-red-400 font-bold ml-auto px-1">Limpiar</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 py-2 bg-surface-highlight/10 flex overflow-x-auto gap-2 scrollbar-hide border-y border-surface-highlight">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategories.includes(cat.id)
                                            ? 'bg-primary-700 text-white border-primary-500 shadow-glow-sm'
                                            : 'bg-surface border-surface-highlight text-text-secondary hover:border-text-secondary'
                                            }`}
                                    >
                                        {cat.icon} {t(`map_store.categories.${cat.id}`) || cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* 📋 Results List */}
                            <div className="flex-1">
                                {filteredBusinesses.length > 0 ? (
                                    filteredBusinesses.map(bus => (
                                        <div key={bus.id} id={`business-card-${bus.id}`}>
                                            <BusinessListCard
                                                business={bus}
                                                isActive={activeBusinessId === bus.id}
                                                onClick={() => {
                                                    setActiveBusinessId(bus.id)
                                                    // Trigger map zoom/center via global event or ref
                                                    window.dispatchEvent(new CustomEvent('map-focus-business', { detail: { lat: bus.latitude, lng: bus.longitude, id: bus.id } }))
                                                }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-20 h-20 bg-surface-highlight rounded-full flex items-center justify-center mx-auto opacity-50">
                                            <MapPin size={40} className="text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary">No hay resultados aquí</p>
                                            <p className="text-sm text-text-secondary">Intenta cambiar el área del mapa o ajustar los filtros.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Backdrop click to close on mobile */}
                    <div className="md:hidden absolute inset-0 -z-10 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>
                </div>

                {/* 🗺️ MAP */}
                <div className="flex-1 w-full h-full relative z-0">
                    <MapBoxStoreLocator
                        businesses={filteredBusinesses}
                        categoryColors={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.color }), {})}
                        categoryEmojis={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.icon }), {})}
                        initialLocation={location ? { latitude: location.latitude, longitude: location.longitude } : undefined}
                    />
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
