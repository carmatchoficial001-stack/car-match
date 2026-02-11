'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    VEHICLE_CATEGORIES,
    BRANDS,
    POPULAR_MODELS,
    TRANSMISSIONS,
    FUELS,
    TRACTIONS,
    CONDITIONS,
    COLORS,
    getYears,
    getFeaturesByCategory,
    VehicleCategory
} from '@/lib/vehicleTaxonomy'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocation } from '@/contexts/LocationContext'
import { searchCities, LocationData } from '@/lib/geolocation'
import { MapPin, Search, Loader2, ChevronDown, X } from 'lucide-react'

interface MarketFiltersAdvancedProps {
    currentFilters: any
    userCountry?: string
    userState?: string
    userCity?: string
    // Legacy props kept for compatibility but ignored in favor of global taxonomy
    brands?: string[]
    vehicleTypes?: string[]
    colors?: string[]
}

export default function MarketFiltersAdvanced({
    currentFilters,
    userCountry = 'México',
    userState = '',
    userCity = '',
    onClose
}: MarketFiltersAdvancedProps & { onClose?: () => void }) {
    const { t } = useLanguage()
    const { setManualLocation, manualLocation, location } = useLocation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const availableYears = getYears()

    // 🧠 DECOUPLING LOGIC:
    // If we are in "AI Advisor Mode" (indicated by ?ai_mode=true in URL),
    // we do NOT want to overwrite the manual filter dropdowns with the AI results.
    // We want the manual UI to remain clean so the user can switch back to manual filtering easily.
    const isAiMode = currentFilters.ai_mode === 'true'

    // Estados de filtros (Solo inicializar desde URL si NO estamos en modo AI)
    const [category, setCategory] = useState<VehicleCategory | ''>(!isAiMode ? (currentFilters.category as VehicleCategory) || '' : '')
    const [subType, setSubType] = useState(!isAiMode ? (currentFilters.vehicleType || currentFilters.subType || '') : '')
    const [brand, setBrand] = useState(!isAiMode ? (currentFilters.brand || '') : '')
    const [model, setModel] = useState(!isAiMode ? (currentFilters.model || '') : '')
    const [minPrice, setMinPrice] = useState(!isAiMode ? (currentFilters.minPrice || '') : '')
    const [maxPrice, setMaxPrice] = useState(!isAiMode ? (currentFilters.maxPrice || '') : '')
    const [minYear, setMinYear] = useState(!isAiMode ? (currentFilters.minYear || '') : '')
    const [maxYear, setMaxYear] = useState(!isAiMode ? (currentFilters.maxYear || '') : '')
    const [color, setColor] = useState(!isAiMode ? (currentFilters.color || '') : '')
    const [condition, setCondition] = useState(!isAiMode ? (currentFilters.condition || '') : '')

    // Ubicación (Siempre sincronizar porque es global)
    const [country, setCountry] = useState(currentFilters.country || userCountry)
    const [state, setState] = useState(currentFilters.state || userState)
    const [city, setCity] = useState(currentFilters.city || userCity)

    // 📍 Location Search State
    // ⚠️ CRITICAL: DO NOT MODIFY. SEARCH RADIUS LOGIC IS PRODUCTION CRITICAL.
    // PREFERENCIA: 1. Filtro actual URL -> 2. Prop usuario -> 3. Manual (Contexto) -> 4. GPS (Contexto)
    const [locationInput, setLocationInput] = useState(
        currentFilters.city ||
        userCity ||
        manualLocation?.city ||
        location?.city ||
        ''
    )
    const [isSearchingLocation, setIsSearchingLocation] = useState(false)
    const [locationCandidates, setLocationCandidates] = useState<LocationData[]>([])
    const [showCandidates, setShowCandidates] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)

    const handleLocationSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!locationInput.trim() || isSearchingLocation) return

        setIsSearchingLocation(true)
        setLocationError(null)
        setShowCandidates(false)
        setLocationCandidates([])

        try {
            const results = await searchCities(locationInput)
            if (results && results.length > 0) {
                if (results.length === 1) {
                    selectLocation(results[0])
                } else {
                    setLocationCandidates(results)
                    setShowCandidates(true)
                }
            } else {
                setLocationError('No encontramos esa ciudad.')
            }
        } catch (error) {
            setLocationError('Error al buscar.')
        } finally {
            setIsSearchingLocation(false)
        }
    }

    const selectLocation = (loc: LocationData) => {
        setCountry(loc.country)
        setState(loc.state)
        setCity(loc.city)
        setLocationInput(`${loc.city}, ${loc.state}`)

        // Update Global Context
        setManualLocation(loc)

        setShowCandidates(false)
        setLocationCandidates([])
    }

    // Técnicos
    const [transmission, setTransmission] = useState<string[]>(currentFilters.transmission ? currentFilters.transmission.split(',') : [])
    const [fuel, setFuel] = useState<string[]>(currentFilters.fuel ? currentFilters.fuel.split(',') : [])
    const [traction, setTraction] = useState(currentFilters.traction || '')
    const [minMileage, setMinMileage] = useState(currentFilters.minMileage || '')
    const [maxMileage, setMaxMileage] = useState(currentFilters.maxMileage || '')
    const [doors, setDoors] = useState(currentFilters.doors || '')

    // Específicos
    const [passengers, setPassengers] = useState(currentFilters.passengers || '')
    const [hours, setHours] = useState(currentFilters.hours || '')
    const [minEngine, setMinEngine] = useState(currentFilters.minEngine || '')
    const [maxEngine, setMaxEngine] = useState(currentFilters.maxEngine || '')

    // Extras
    const [features, setFeatures] = useState<string[]>(currentFilters.features ? currentFilters.features.split(',') : [])

    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showManualFilters, setShowManualFilters] = useState(false) // 🔽 Estado para colapsar filtros manuales

    // 🧠 AI SEARCH STATE
    const [aiQuery, setAiQuery] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiExplanation, setAiExplanation] = useState('')

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return

        setIsAnalyzing(true)


        try {
            const res = await fetch('/api/ai/analyze-vehicle-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('AI Server Error:', errorData)
                throw new Error(errorData.details || errorData.error || 'AI Search Failed')
            }

            const data = await res.json()
            const filters = data // Now flat with explanation included
            const { explanation } = filters

            if (filters) {
                // 🚀 DIRECT EXECUTION: Construct URL based on AI filters
                const params = new URLSearchParams()

                // Preserve location if set
                if (country) params.set('country', country)
                if (state) params.set('state', state)
                if (city) params.set('city', city)

                // ⚓ PRIMARY ANCHOR: Preserve user query for fallback OR search
                params.set('search', aiQuery)
                params.set('ai_mode', 'true') // 🧠 SIGNAL: This is an AI search, do not mess with manual UI

                // Add AI filters
                if (filters.category) params.set('category', filters.category)
                if (filters.brand) params.set('brand', filters.brand)
                if (filters.model) params.set('model', filters.model)
                if (filters.vehicleType) params.set('vehicleType', filters.vehicleType)
                if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
                if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
                if (filters.minYear) params.set('minYear', filters.minYear.toString())
                if (filters.maxYear) params.set('maxYear', filters.maxYear.toString())
                if (filters.color) params.set('color', filters.color)
                if (filters.passengers) params.set('passengers', filters.passengers.toString())
                if (filters.cylinders) params.set('cylinders', filters.cylinders.toString())
                if (filters.features && Array.isArray(filters.features)) {
                    params.set('features', filters.features.join(','))
                }

                if (filters.transmission) {
                    const trans = Array.isArray(filters.transmission) ? filters.transmission.join(',') : filters.transmission
                    params.set('transmission', trans)
                }

                if (filters.fuel) {
                    const f = Array.isArray(filters.fuel) ? filters.fuel.join(',') : filters.fuel
                    params.set('fuel', f)
                }

                if (filters.traction) params.set('traction', filters.traction)
                if (filters.doors) params.set('doors', filters.doors.toString())




                // Execute Search with FORCE RELOAD to guarantee results appear
                // Using window.location.href ensures clean state and server re-fetch
                window.location.href = `/market?${params.toString()}`

                // 🚀 CLOSE MODAL AFTER NAVIGATION START
                if (onClose) onClose()
                // Silencio: Fallback a búsqueda de texto si no hay filtros estructurados
                window.location.href = `/market?search=${encodeURIComponent(aiQuery)}`
            }
        } catch (error: any) {
            console.error('Error in AI Search:', error)
            // Silencio: Fallback a búsqueda de texto normal sin asustar al usuario ni interrumpir el flujo
            window.location.href = `/market?search=${encodeURIComponent(aiQuery)}`
        }
        finally {
            setIsAnalyzing(false)
        }
    }

    // Reset subtype and brand when category changes
    useEffect(() => {
        if (category && !VEHICLE_CATEGORIES[category]?.includes(subType)) {
            setSubType('')
        }
        if (category && BRANDS[category] && !BRANDS[category].includes(brand)) {
            setBrand('')
        }
        // Auto-expand advanced filters for special categories to show intelligence
        if (['Motocicleta', 'Maquinaria', 'Camión', 'Especial'].includes(category)) {
            setShowAdvanced(true)
        }
    }, [category])

    const handleToggleArray = (value: string, array: string[], setter: (arr: string[]) => void) => {
        if (array.includes(value)) {
            setter(array.filter(v => v !== value))
        } else {
            setter([...array, value])
        }
    }

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Limpiar para sobreescribir
        const keys = [
            'category', 'subType', 'brand', 'model', 'minPrice', 'maxPrice',
            'minYear', 'maxYear', 'color', 'condition', 'country', 'state', 'city',
            'transmission', 'fuel', 'traction', 'minMileage', 'maxMileage', 'doors',
            'passengers', 'hours', 'features'
        ]
        keys.forEach(k => params.delete(k))

        if (category) params.set('category', category)
        if (subType) params.set('vehicleType', subType) // Standardized key
        if (brand) params.set('brand', brand)
        if (model) params.set('model', model)
        if (minPrice) params.set('minPrice', minPrice)
        if (maxPrice) params.set('maxPrice', maxPrice)
        if (minYear) params.set('minYear', minYear)
        if (maxYear) params.set('maxYear', maxYear)
        if (color) params.set('color', color)
        if (condition) params.set('condition', condition)

        if (country) params.set('country', country)
        if (state) params.set('state', state)
        if (city) params.set('city', city)

        if (transmission.length) params.set('transmission', transmission.join(','))
        if (fuel.length) params.set('fuel', fuel.join(','))
        if (features.length) params.set('features', features.join(','))

        if (traction) params.set('traction', traction)
        if (minMileage) params.set('minMileage', minMileage)
        if (maxMileage) params.set('maxMileage', maxMileage)
        if (doors) params.set('doors', doors)
        if (passengers) params.set('passengers', passengers)
        if (hours) params.set('hours', hours)
        if (minEngine) params.set('minDisplacement', minEngine)
        if (maxEngine) params.set('maxDisplacement', maxEngine)


        router.push(`/market?${params.toString()}`)
        if (onClose) onClose()
    }

    const clearFilters = () => {
        setCategory('')
        setSubType('')
        setBrand('')
        setModel('')
        setMinPrice('')
        setMaxPrice('')
        setMinYear('')
        setMaxYear('')
        setColor('')
        setCondition('')
        setCountry(userCountry)
        setState(userState)
        setCity(userCity)
        setLocationInput(userCity || location?.city || '')
        setManualLocation(null)
        setTransmission([])
        setFuel([])
        setTraction('')
        setMinMileage('')
        setMaxMileage('')
        setDoors('')
        setPassengers('')
        setHours('')
        setMinEngine('')
        setMaxEngine('')
        setFeatures([])
        router.push('/market')
    }

    // Dynamic Data State
    const [dynamicBrands, setDynamicBrands] = useState<Record<string, string[]>>(BRANDS)
    const [dynamicAllBrands, setDynamicAllBrands] = useState<string[]>([])
    const [availableModels, setAvailableModels] = useState<string[]>([])

    useEffect(() => {
        // Fetch dynamic taxonomy (DB + Static)
        const fetchTaxonomy = async () => {
            try {
                const res = await fetch('/api/taxonomy')
                if (res.ok) {
                    const data = await res.json()
                    setDynamicBrands(data.brands)
                    setDynamicAllBrands(data.allBrands)
                    setAvailableModels(data.models)
                }
            } catch (error) {
                console.error('Failed to load dynamic taxonomy:', error)
            }
        }
        fetchTaxonomy()
    }, [])

    // Dynamic Options based on Category/State
    const categoryFeatures = category ? getFeaturesByCategory(category) : []

    // Choose specific category list OR flatten all if no category selected
    const availableBrands = category
        ? dynamicBrands[category] || []
        : dynamicAllBrands.length > 0 ? dynamicAllBrands : Array.from(new Set(Object.values(dynamicBrands).flat())).sort()

    // 🧠 Filter Models based on Brand
    const filteredModels = brand && POPULAR_MODELS[brand]
        ? POPULAR_MODELS[brand]
        : (availableModels.length > 0 ? availableModels : [])

    return (
        <div className="bg-surface border border-surface-highlight rounded-xl p-6 space-y-6 shadow-sm relative">
            {/* 🚪 Close Button */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95"
                    aria-label="Cerrar filtros"
                >
                    <X size={20} />
                </button>
            )}

            <div className="flex items-center justify-between mb-2 pr-8">
                <h2 className="text-lg font-bold text-text-primary">{t('market.filters.title')}</h2>
                <button type="button" onClick={clearFilters} className="text-sm text-primary-400 hover:underline">{t('market.filters.clear_all')}</button>
            </div>

            {/* 1. 📍 BARRA DE UBICACIÓN (Prioridad #1) */}
            <div className="relative mb-6">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-primary-500" />
                    Ubicación de Búsqueda ({t('common.city')})
                </label>
                <div className="relative group z-30">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500">
                        <MapPin size={18} />
                    </div>
                    <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => {
                            setLocationInput(e.target.value)
                            setShowCandidates(false)
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch(e)}
                        placeholder="Ciudad o Código Postal..."
                        className="w-full h-12 pl-10 pr-12 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-500 transition-colors shadow-sm"
                    />
                    <button
                        onClick={handleLocationSearch}
                        disabled={isSearchingLocation}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-lg transition"
                    >
                        {isSearchingLocation ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>

                    {/* Candidates Dropdown */}
                    {showCandidates && locationCandidates.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-primary-500/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50">
                            <div className="px-3 py-2 bg-primary-900/20 border-b border-primary-500/10">
                                <p className="text-xs font-bold text-primary-300">¿A cuál te refieres?</p>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {locationCandidates.map((loc, index) => (
                                    <button
                                        key={index}
                                        onClick={() => selectLocation(loc)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                                    >
                                        <MapPin size={16} className="text-text-secondary shrink-0" />
                                        <div>
                                            <p className="font-bold text-sm text-text-primary">{loc.city}</p>
                                            <p className="text-xs text-text-secondary">{loc.state}, {loc.country}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {locationError && <p className="text-xs text-red-400 mt-1 absolute">{locationError}</p>}
                </div>
            </div>

            {/* 2. 🧠 ASESOR INTELIGENTE (Prioridad #2) */}
            <div className="bg-surface/90 backdrop-blur-sm rounded-xl p-4 md:p-6 relative z-10">
                {/* Header removed to save space as per user request */}

                <div className="space-y-3">
                    <div className="relative">
                        <textarea
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder={t('smart_search.placeholder') || "¿Qué vehículo me recomiendas para..."}
                            className="w-full bg-black/50 border border-primary-500/30 rounded-xl p-4 text-base text-white placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all resize-none h-28 shadow-inner"
                            disabled={isAnalyzing}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAiSearch();
                                }
                            }}
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 hidden md:block">
                            Enter para enviar
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAiSearch}
                        disabled={isAnalyzing || !aiQuery.trim()}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/30 active:scale-[0.98]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={18} className="animate-spin text-white" />
                                <span>{t('smart_search.consulting') || 'Analizando...'}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('smart_search.ask_advisor') || 'Preguntar al Asesor'}</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>


            {/* 3. 🔽 FILTROS MANUALES (Ocultos por defecto) */}
            <button
                onClick={() => setShowManualFilters(!showManualFilters)}
                className="w-full py-3 px-4 bg-surface-highlight/30 hover:bg-surface-highlight/50 border border-surface-highlight rounded-xl flex items-center justify-between text-text-primary transition-all group mb-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-highlight rounded-lg text-text-secondary group-hover:text-primary-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wide">
                        {showManualFilters ? t('market.hide_filters') || 'Ocultar Filtros Manuales' : 'FILTROS MANUALES'}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showManualFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* CONTENEDOR COLAPSABLE DE FILTROS MANUALES */}
            <div className={`space-y-6 overflow-hidden transition-all duration-500 ${showManualFilters ? 'max-h-[3000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>

                {/* A. CATEGORÍA Y FILTROS BÁSICOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Categoría Principal */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.category')}</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                            className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm"
                        >
                            <option value="">{t('common.all')}</option>
                            {Object.keys(VEHICLE_CATEGORIES).map(cat => (
                                <option key={cat} value={cat}>{t(`taxonomy.categories.${cat}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Subtipo (Dinámico) */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.style')}</label>
                        <select
                            value={subType}
                            onChange={(e) => setSubType(e.target.value)}
                            disabled={!category}
                            className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 disabled:opacity-50 text-base md:text-sm"
                        >
                            <option value="">{t('common.all')}</option>
                            {category && VEHICLE_CATEGORIES[category]?.map(subtype => (
                                <option key={subtype} value={subtype}>{t(`taxonomy.subtypes.${subtype}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Marca (Autocompletado) */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.brand')}</label>
                        <AutocompleteDropdown
                            value={brand}
                            onChange={setBrand}
                            options={availableBrands}
                            placeholder={t('market.filters.brand_placeholder')}
                            emptyMessage="No encontramos esa marca"
                        />
                    </div>

                    {/* 4. Modelo (Autocompletado) */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.model')}</label>
                        <AutocompleteDropdown
                            value={model}
                            onChange={setModel}
                            options={filteredModels}
                            placeholder={brand ? t('market.filters.model_placeholder') : "Selecciona una marca primero"}
                            emptyMessage={brand ? "No listado (escríbelo manual)" : "Selecciona marca..."}
                            onManualInput={setModel}
                        />
                    </div>

                    {/* 5. Precio Rango */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.price_min')}</label>
                            <input
                                type="number"
                                min="0"
                                onKeyDown={(e) => ['-', 'e', '+'].includes(e.key) && e.preventDefault()}
                                value={minPrice}
                                onChange={(e) => setMinPrice(Math.max(0, parseFloat(e.target.value)).toString())}
                                placeholder={t('taxonomy.units.prices.placeholder_min')}
                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-700"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Max</label>
                            <input
                                type="number"
                                min="0"
                                onKeyDown={(e) => ['-', 'e', '+'].includes(e.key) && e.preventDefault()}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Math.max(0, parseFloat(e.target.value)).toString())}
                                placeholder={t('taxonomy.units.prices.placeholder_max')}
                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-700"
                            />
                        </div>
                    </div>

                    {/* 6. Año Rango */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.year_min')}</label>
                            <select
                                value={minYear}
                                onChange={(e) => setMinYear(e.target.value)}
                                className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm"
                            >
                                <option value="">Todos</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Max</label>
                            <select
                                value={maxYear}
                                onChange={(e) => setMaxYear(e.target.value)}
                                className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm"
                            >
                                <option value="">Todos</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* B. TOGGLE FILTROS AVANZADOS (Integrado) */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-2 bg-surface-highlight/20 hover:bg-surface-highlight/40 text-text-secondary hover:text-text-primary rounded-lg transition text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-dashed border-surface-highlight/50"
                >
                    {showAdvanced ? t('market.filters.show_less') || 'Menos filtros' : t('market.filters.show_more') || 'Más Filtros Avanzados (Color, Transmisión, Motor...)'}
                    <svg className={`w-4 h-4 transform transition ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* C. SECCIÓN FILTROS AVANZADOS */}
                {showAdvanced && (
                    <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Common Selects Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.color')}</label>
                                <select
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary"
                                >
                                    <option value="">{t('common.any')}</option>
                                    {COLORS.map(c => <option key={c} value={c}>{t(`taxonomy.colors.${c}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.condition')}</label>
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary"
                                >
                                    <option value="">{t('common.any')}</option>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{t(`taxonomy.condition.${c}`)}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{category === 'Maquinaria' ? t('common.hours') : t('common.km') + ' ' + t('common.max')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    onKeyDown={(e) => ['-', 'e', '+'].includes(e.key) && e.preventDefault()}
                                    value={maxMileage}
                                    onChange={(e) => setMaxMileage(Math.max(0, parseFloat(e.target.value)).toString())}
                                    placeholder="Ej. 50000"
                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary"
                                />
                            </div>


                            {/* Pasajeros y Puertas (Solo Puertas, Pasajeros está más abajo como Select) */}
                            <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-surface-highlight pt-4 mt-2">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.doors')}</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="5"
                                        value={doors}
                                        onChange={(e) => setDoors(e.target.value)}
                                        placeholder="Ej. 4"
                                        disabled={category === 'Motocicleta' || category === 'Maquinaria'}
                                        className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Motor / Potencia Dinámico */}
                            <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-4 border-t border-surface-highlight pt-4 mt-2">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                                        {category === 'Motocicleta' ? t('market.filters.displacement') + ' ' + t('common.min') + ' (cc)' :
                                            category === 'Camión' || category === 'Maquinaria' ? t('market.filters.power') + ' ' + t('common.min') + ' (HP)' :
                                                t('market.filters.displacement') + ' ' + t('common.min') + ' (L)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={minEngine}
                                        onChange={(e) => setMinEngine(e.target.value)}
                                        placeholder={category === 'Motocicleta' ? 'Ej. 250' : category === 'Camión' ? 'Ej. 300' : 'Ej. 1.6'}
                                        className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                                        {category === 'Motocicleta' ? t('market.filters.displacement') + ' ' + t('common.max') + ' (cc)' :
                                            category === 'Camión' || category === 'Maquinaria' ? t('market.filters.power') + ' ' + t('common.max') + ' (HP)' :
                                                t('market.filters.displacement') + ' ' + t('common.max') + ' (L)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={maxEngine}
                                        onChange={(e) => setMaxEngine(e.target.value)}
                                        placeholder={category === 'Motocicleta' ? t('taxonomy.units.cc') : category === 'Camión' ? t('taxonomy.units.hp') : t('taxonomy.units.l')}
                                        className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transmisión Chips */}
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('market.filters.transmission')}</label>
                            <div className="flex flex-wrap gap-3">
                                {TRANSMISSIONS.map(trans => (
                                    <button
                                        key={trans}
                                        onClick={() => handleToggleArray(trans, transmission, setTransmission)}
                                        className={`px-5 py-3 md:px-3 md:py-1 text-sm md:text-xs rounded-full border transition font-medium ${transmission.includes(trans)
                                            ? 'bg-primary-700 text-text-primary border-primary-700'
                                            : 'bg-background text-text-secondary border-surface-highlight'
                                            }`}
                                    >
                                        {t(`taxonomy.transmission.${trans}`)}
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Tracción y Pasajeros */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('market.filters.traction')}</label>
                                <select
                                    value={traction}
                                    onChange={(e) => setTraction(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary text-sm"
                                >
                                    <option value="">{t('common.any')}</option>
                                    <option value="Delantera (FWD)">{t('taxonomy.traction.Delantera (FWD)')}</option>
                                    <option value="Trasera (RWD)">{t('taxonomy.traction.Trasera (RWD)')}</option>
                                    <option value="4x4 (4WD)">{t('taxonomy.traction.4x4 (4WD)')}</option>
                                    <option value="Integral (AWD)">{t('taxonomy.traction.Integral (AWD)')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('market.filters.passengers') + ' ' + t('common.min')}</label>
                                <select
                                    value={passengers}
                                    onChange={(e) => setPassengers(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary text-sm"
                                >
                                    <option value="">{t('common.any')}</option>
                                    <option value="2">2+</option>
                                    <option value="4">4+</option>
                                    <option value="5">5+</option>
                                    <option value="7">7+</option>
                                    <option value="12">12+</option>
                                </select>
                            </div>
                        </div>

                        {/* Horas (Maquinaria/Barcos) */}
                        {(category === 'Maquinaria' || category === 'Especial') && (
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('common.hours') + ' ' + t('common.max')}</label>
                                <input
                                    type="number"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder={t('taxonomy.units.hours_placeholder')}
                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary"
                                />
                            </div>
                        )}

                        {/* Combustible Chips */}
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('market.filters.fuel')}</label>
                            <div className="flex flex-wrap gap-3">
                                {FUELS.map(fuelVal => (
                                    <button
                                        key={fuelVal}
                                        onClick={() => handleToggleArray(fuelVal, fuel, setFuel)}
                                        className={`px-5 py-3 md:px-3 md:py-1 text-sm md:text-xs rounded-full border transition font-medium ${fuel.includes(fuelVal)
                                            ? 'bg-primary-700 text-text-primary border-primary-700'
                                            : 'bg-background text-text-secondary border-surface-highlight'
                                            }`}
                                    >
                                        {t(`taxonomy.fuel.${fuelVal}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Features */}
                        {categoryFeatures.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('market.filters.equipment')}</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {categoryFeatures.map(feat => (
                                        <button
                                            key={feat}
                                            onClick={() => handleToggleArray(feat, features, setFeatures)}
                                            className={`flex items-center gap-3 px-4 py-4 md:py-2 text-sm md:text-xs rounded-xl border text-left transition ${features.includes(feat)
                                                ? 'bg-primary-700/20 border-primary-700 text-text-primary font-bold'
                                                : 'bg-background border-surface-highlight text-text-secondary'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 md:w-2 md:h-2 rounded-full ${features.includes(feat) ? 'bg-primary-500' : 'bg-surface-highlight'}`} />
                                            {t(`taxonomy.subtypes.${feat}`) || feat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* BOTÓN APLICAR FILTROS MANUALES - INTEGRADO AQUÍ DENTRO */}
                <div className="pt-4 border-t border-surface-highlight flex justify-end">
                    <button
                        onClick={applyFilters}
                        className="w-full md:w-auto px-8 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-gray-100 transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>{t('market.filters.apply')}</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>



            </div>
        </div >
    )
}

// 🧠 Reusable Autocomplete Component
interface AutocompleteDropdownProps {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    disabled?: boolean
    emptyMessage?: string
    onManualInput?: (value: string) => void
}

function AutocompleteDropdown({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    emptyMessage = "No se encontraron resultados",
    onManualInput
}: AutocompleteDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Sync search term with value only when closed or explicit set
    useEffect(() => {
        if (!isOpen) setSearchTerm(value)
    }, [value, isOpen])

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="relative group">
            <div className="relative">
                <input
                    type="text"
                    value={isOpen ? searchTerm : value}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsOpen(true)
                        if (onManualInput) onManualInput(e.target.value)
                    }}
                    onFocus={() => {
                        setSearchTerm(value) // Reset search to current value on focus? Or empty? Better current.
                        setIsOpen(true)
                    }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay for click
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full h-12 md:h-10 px-4 pr-10 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm truncate"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    {isOpen ? <Search size={16} /> : <ChevronDown size={16} />}
                </div>
                {value && !isOpen && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange('')
                            setSearchTerm('')
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-surface border border-surface-highlight rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt)
                                    setIsOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-surface-highlight text-text-primary text-sm border-b border-surface-highlight/50 last:border-0"
                            >
                                {opt}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-text-secondary text-sm text-center italic">
                            {emptyMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
