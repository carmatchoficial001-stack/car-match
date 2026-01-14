'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    VEHICLE_CATEGORIES,
    BRANDS,
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
    userCity = ''
}: MarketFiltersAdvancedProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const availableYears = getYears()

    // Estados de filtros
    const [category, setCategory] = useState<VehicleCategory | ''>((currentFilters.category as VehicleCategory) || '')
    const [subType, setSubType] = useState(currentFilters.vehicleType || currentFilters.subType || '')
    const [brand, setBrand] = useState(currentFilters.brand || '')
    const [model, setModel] = useState(currentFilters.model || '')
    const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '')
    const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '')
    const [minYear, setMinYear] = useState(currentFilters.minYear || '')
    const [maxYear, setMaxYear] = useState(currentFilters.maxYear || '')
    const [color, setColor] = useState(currentFilters.color || '')
    const [condition, setCondition] = useState(currentFilters.condition || '')

    // Ubicación
    const [country, setCountry] = useState(currentFilters.country || userCountry)
    const [state, setState] = useState(currentFilters.state || userState)
    const [city, setCity] = useState(currentFilters.city || userCity)

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

    // 🧠 AI SEARCH STATE
    const [aiQuery, setAiQuery] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiExplanation, setAiExplanation] = useState('')

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return

        setIsAnalyzing(true)
        setAiExplanation('')

        try {
            const res = await fetch('/api/ai/analyze-vehicle-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery })
            })

            if (!res.ok) throw new Error('AI Search Failed')

            const data = await res.json()
            const { filters, explanation } = data

            if (filters) {
                if (filters.category) setCategory(filters.category as VehicleCategory)
                if (filters.brand) setBrand(filters.brand)
                if (filters.model) setModel(filters.model)
                if (filters.minPrice) setMinPrice(filters.minPrice.toString())
                if (filters.maxPrice) setMaxPrice(filters.maxPrice.toString())
                if (filters.minYear) setMinYear(filters.minYear.toString())
                if (filters.maxYear) setMaxYear(filters.maxYear.toString())
                if (filters.color) setColor(filters.color)

                if (filters.transmission) {
                    setTransmission(Array.isArray(filters.transmission) ? filters.transmission : [filters.transmission])
                }
                if (filters.fuel) {
                    setFuel(Array.isArray(filters.fuel) ? filters.fuel : [filters.fuel])
                }

                setAiExplanation(explanation || t('smart_search.explanation_success') || 'Okey!')

                // Animamos la apertura de filtros avanzados si la IA configuró algo de ahí
                if (filters.transmission || filters.fuel || filters.color) {
                    setShowAdvanced(true)
                }
            }
        } catch (error) {
            console.error('Error in AI Search:', error)
            setAiExplanation(t('smart_search.error') || 'Error')
        } finally {
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
        if (subType) params.set('vehicleType', subType)
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

    return (
        <div className="bg-surface border border-surface-highlight rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-text-primary">{t('market.filters.title')}</h2>
                <button onClick={clearFilters} className="text-sm text-primary-400 hover:underline">{t('market.filters.clear_all')}</button>
            </div>

            {/* 🧠 SMART SEARCH AI - REBRANDED TO ASESOR PERSONAL */}
            <div className="p-4 bg-gradient-to-br from-gray-900 to-primary-950/30 border border-primary-700/30 rounded-xl space-y-3 mb-4 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <svg className="w-32 h-32 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-bold text-primary-300 uppercase tracking-wider">
                            {t('smart_search.title')}
                        </label>
                    </div>
                    <div className="space-y-2">
                        <textarea
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder={t('smart_search.placeholder')}
                            className="w-full bg-black/40 border border-primary-900/50 rounded-xl p-3 text-base md:text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none h-24 shadow-inner"
                            disabled={isAnalyzing}
                        />
                        <button
                            onClick={handleAiSearch}
                            disabled={isAnalyzing || !aiQuery.trim()}
                            className="w-full py-4 md:py-3 bg-primary-700 hover:bg-primary-600 active:scale-95 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin text-primary-200" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{t('smart_search.consulting')}</span>
                                </>
                            ) : (
                                t('smart_search.ask_advisor')
                            )}
                        </button>
                        {aiExplanation && (
                            <div className="mt-2 bg-primary-900/20 border border-primary-500/10 rounded-lg p-3 animate-fade-in-up">
                                <p className="text-xs text-primary-200 italic">
                                    "{t('smart_search.understood', { explanation: aiExplanation })}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN FILTERS GRID */}
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
                        {category && VEHICLE_CATEGORIES[category]?.map(t => (
                            <option key={t} value={t}>{t(`taxonomy.subtypes.${t}`)}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Marca (Dinámica 'Global') */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.brand')}</label>
                    <input
                        list="brands-list"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder={t('market.filters.brand_placeholder')}
                        className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm"
                    />
                    <datalist id="brands-list">
                        {availableBrands.map(b => (
                            <option key={b} value={b} />
                        ))}
                    </datalist>
                </div>

                {/* 4. Modelo */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.model')}</label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder={t('market.filters.model_placeholder')}
                        className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary focus:border-primary-700 text-base md:text-sm"
                        list="models-list"
                    />
                    <datalist id="models-list">
                        {availableModels.map(m => (
                            <option key={m} value={m} />
                        ))}
                    </datalist>
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
                            placeholder={t('taxonomy.units.prices.placeholder_min', { fallback: '$0' })}
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
                            placeholder={t('taxonomy.units.prices.placeholder_max', { fallback: '$Max' })}
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

            {/* ADVANCED TOGGLE */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-4 md:py-2 bg-surface-highlight/50 hover:bg-surface-highlight text-text-primary rounded-xl transition text-sm font-bold flex items-center justify-center gap-2"
            >
                {showAdvanced ? t('market.filters.show_less') : t('market.filters.show_more')}
                <svg className={`w-4 h-4 transform transition ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* ADVANCED SECTION */}
            {showAdvanced && (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Common Selects Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.color')}</label>
                            <select
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary"
                            >
                                <option value="">Cualquiera</option>
                                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.condition')}</label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary"
                            >
                                <option value="">Cualquiera</option>
                                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('market.filters.traction')}</label>
                            <select
                                value={traction}
                                onChange={(e) => setTraction(e.target.value)}
                                className="w-full h-12 md:h-10 px-4 bg-background border border-surface-highlight rounded-xl text-text-primary"
                            >
                                <option value="">Cualquiera</option>
                                {TRACTIONS.map(t => <option key={t} value={t}>{t}</option>)}
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


                        {/* Pasajeros y Puertas */}
                        <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-surface-highlight pt-4 mt-2">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                                    {category === 'Maquinaria' ? 'Operadores' : t('market.filters.passengers')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={passengers}
                                    onChange={(e) => setPassengers(e.target.value)}
                                    placeholder="Ej. 5"
                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary"
                                />
                            </div>
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
                                    placeholder={category === 'Motocicleta' ? t('taxonomy.units.cc', { fallback: 'Ej. 1200' }) : category === 'Camión' ? t('taxonomy.units.hp', { fallback: 'Ej. 600' }) : t('taxonomy.units.l', { fallback: 'Ej. 5.0' })}
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
                                <option value="">Cualquiera</option>
                                <option value="2">2+</option>
                                <option value="4">4+</option>
                                <option value="5">5+</option>
                                <option value="7">7+</option>
                                <option value="8">8+</option>
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
                                placeholder={t('taxonomy.units.hours_placeholder', { fallback: 'Ej. 5000' })}
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

                    {/* Dynamic Features (Air Cond, GPS, etc) */}
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
                                        {t(`taxonomy.subtypes.${feat}`, { fallback: feat })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}



                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-6 border-t border-surface-highlight flex gap-3">
                <button
                    onClick={applyFilters}
                    className="flex-1 py-4 bg-primary-700 hover:bg-primary-600 text-white rounded-xl font-bold transition shadow-lg shadow-primary-900/20 active:scale-95"
                >
                    {t('market.filters.apply')}
                </button>
            </div>
        </div>
    )
}
