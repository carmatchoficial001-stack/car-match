"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import GPSCaptureStep from '@/components/GPSCaptureStep'
import ImageUploadStep from '@/components/ImageUploadStep'
import { useLanguage } from '@/contexts/LanguageContext'
import { generateDeviceFingerprint } from '@/lib/fingerprint'
import PortalAnimation from '@/components/PortalAnimation'
import VehicleTypeSelector from '@/components/VehicleTypeSelector'
import SearchableSelect from '@/components/SearchableSelect'
import {
    VEHICLE_CATEGORIES,
    BRANDS,
    getYears,
    getFeaturesByCategory,
    TRANSMISSIONS,
    FUELS,
    COLORS,
    CONDITIONS,
    POPULAR_MODELS,
    VehicleCategory,
    CURRENCIES,
    COUNTRY_CURRENCY_MAP,
    COUNTRY_DISTANCE_UNIT_MAP,
    formatPrice,
    formatNumber
} from '@/lib/vehicleTaxonomy'
import { getUserLocation, reverseGeocode } from '@/lib/geolocation'
import { useModelNames } from '@/hooks/useVehicleData'

type FormStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export default function PublishClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const { t, locale } = useLanguage()
    const [currentStep, setCurrentStep] = useState<FormStep>(1)
    const [loading, setLoading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiConfidence, setAiConfidence] = useState(0)
    const [aiError, setAiError] = useState('')
    const [showPortal, setShowPortal] = useState(false)
    const [redirectUrl, setRedirectUrl] = useState('')

    // Helper for Step Names
    const getStepName = (step: number) => {
        switch (step) {
            case 1: return t('publish.steps.vehicle_type') || 'Tipo de Vehículo'
            case 2: return t('publish.steps.basic_info') || 'Información Básica'
            case 3: return t('publish.steps.images') || 'Imágenes'
            case 4: return t('publish.steps.technical_details') || 'Detalles Técnicos'
            case 5: return t('publish.steps.features') || 'Equipamiento'
            case 6: return t('publish.steps.location') || 'Ubicación'
            case 7: return t('publish.steps.review') || 'Revisión y Publicar'
            default: return ''
        }
    }

    // Step 1: Vehicle Category (New order)
    const [vehicleCategory, setVehicleCategory] = useState('')
    const [vehicleType, setVehicleType] = useState('')

    // Step 2: Images & AI
    const [images, setImages] = useState<string[]>([])

    // Step 3: Basic Info
    const [description, setDescription] = useState('')
    const [brand, setBrand] = useState('')
    const [model, setModel] = useState('')
    const [year, setYear] = useState('')
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState('MXN')

    // Step 4: Technical Details
    const [mileage, setMileage] = useState('')
    const [mileageUnit, setMileageUnit] = useState<'km' | 'mi'>('km')
    const [transmission, setTransmission] = useState('')
    const [fuel, setFuel] = useState('')
    const [engine, setEngine] = useState('')
    const [doors, setDoors] = useState('')
    const [color, setColor] = useState('')
    const [condition, setCondition] = useState('')
    const [traction, setTraction] = useState('')
    const [passengers, setPassengers] = useState('')

    // Specific fields
    const [displacement, setDisplacement] = useState('')
    const [cargoCapacity, setCargoCapacity] = useState('')
    const [operatingHours, setOperatingHours] = useState('')



    // Step 5: Location
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [city, setCity] = useState('')
    const [stateLocation, setStateLocation] = useState('')
    const [countryLocation, setCountryLocation] = useState('MX')

    // Step 6: Features
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

    // Validation for the new flow
    const canProceedFromStep1 = vehicleCategory && vehicleType
    const canProceedFromStep2 = brand && model && year && price
    const canProceedFromStep3 = images.length > 0
    const canProceedFromStep4 = true
    const canProceedFromStep5 = true // Features are optional
    const canProceedFromStep6 = latitude !== null && longitude !== null && city

    // 🤖 Dynamic vehicle data from database
    const modelNames = useModelNames(brand)

    // Validation State
    const [validImagesCache, setValidImagesCache] = useState<string[]>([])
    const [bestAiDetailsCache, setBestAiDetailsCache] = useState<any>(null)
    const [bestCategoryCache, setBestCategoryCache] = useState<string>('')
    const [invalidImageUrls, setInvalidImageUrls] = useState<Set<string>>(new Set())
    const [invalidReasons, setInvalidReasons] = useState<Record<string, string>>({})

    const handleImagesChange = (newImages: string[]) => {
        setImages(newImages)
        setAiError('')
    }

    const validateImagesAndProceed = async () => {
        if (images.length === 0) return
        setIsAnalyzing(true)
        setAiError('')
        setAiConfidence(50)

        // 🎯 Validamos TODAS las imágenes (Portada + Galería)
        try {
            const res = await fetch('/api/ai/validate-images-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: images, // Enviamos TODAS
                    type: 'VEHICLE',
                    context: { brand, model, year }
                })
            })

            if (!res.ok) throw new Error('Error en validación de imágenes')

            const validation = await res.json()
            setAiConfidence(100)

            // 1. 🚨 VALIDAR PORTADA (Index 0)
            // Si la portada es inválida o la validación global falló, bloqueamos.
            if (!validation.valid || validation.invalidIndices?.includes(0)) {
                // Si hay una razón específica de la IA, úsala. Si no, usa el mensaje por defecto.
                // Priorizamos validation.reason para el caso de "Mismatch de contexto"
                const reason = validation.reason || 'La foto de portada debe ser un vehículo real y coincidir con la marca.'

                setAiError(reason)
                setIsAnalyzing(false)
                setInvalidImageUrls(new Set([images[0]]))
                setInvalidReasons({ [images[0]]: reason }) // 🆕 Mapear URL -> Razón
                return
            }

            // 2. 🧹 FILTRAR GALERÍA (Index > 0)
            // Si hay fotos malas en la galería, las quitamos y avisamos
            let cleanImages = images
            const badGalleryIndices = (validation.invalidIndices || []).filter((i: number) => i > 0)

            if (badGalleryIndices.length > 0) {
                // Crear nuevo array solo con las válidas (y la portada que ya sabemos es válida)
                cleanImages = images.filter((_, idx) => !validation.invalidIndices.includes(idx))

                // Actualizar estado con las imágenes limpias
                setImages(cleanImages)
            }

            // Limpiar errores visuales
            setInvalidImageUrls(new Set())

            // Aplicar detalles si la IA detectó algo útil
            if (validation.valid && validation.details) {
                applyAiDetails(validation.details, validation.category)
            }

            setIsAnalyzing(false)
            handleNextStep()

        } catch (error) {
            console.error('Error en validación de imágenes:', error)
            setAiError('No pudimos verificar tus imágenes. Intenta de nuevo.')
            setIsAnalyzing(false)
        }
    }

    const confirmValidationProceed = () => {
        setImages(validImagesCache)
        if (bestAiDetailsCache) applyAiDetails(bestAiDetailsCache, bestCategoryCache)
        handleNextStep()
    }

    const cancelValidation = () => { }

    const applyAiDetails = (details: any, category: string) => {
        const findInList = (value: string, list: string[]) => {
            if (!value) return ''
            const normalized = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            return list.find(item =>
                item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized ||
                item.toLowerCase().includes(normalized) ||
                normalized.includes(item.toLowerCase())
            ) || value
        }

        const mapCategoryToTaxonomy = (aiCat: string): keyof typeof BRANDS | null => {
            const c = aiCat?.toLowerCase() || ''
            if (c.includes('moto')) return 'Motocicleta'
            if (c.includes('camion') || c.includes('comercial')) return 'Camión'
            if (c.includes('autobus') || c.includes('transporte')) return 'Autobús'
            if (c.includes('maquinaria') || c.includes('industrial')) return 'Maquinaria'
            if (c.includes('especial')) return 'Especial'
            return 'Automóvil'
        }

        if (details.brand) {
            const taxCat = mapCategoryToTaxonomy(category)
            if (taxCat && BRANDS[taxCat]) {
                const match = findInList(details.brand, BRANDS[taxCat])
                // ⚠️ CAMBIO SOLICITADO: Auto-corregir marca siempre (la foto manda)
                if (match) setBrand(match)
            } else {
                setBrand(details.brand)
            }
        }

        // ⚠️ Respetar Modelo y Año si el usuario ya los puso ("nomas la marca")
        if (!model && details.model) setModel(details.model)
        if (!year && details.year) setYear(details.year)
        if (!color && details.color) setColor(details.color)
        if (!vehicleType && details.type) setVehicleType(details.type)

        if (!transmission && details.transmission) {
            const match = findInList(details.transmission, TRANSMISSIONS)
            setTransmission(match)
        }
        if (!fuel && details.fuel) {
            const match = findInList(details.fuel, FUELS)
            setFuel(match)
        }

        if (!engine && details.engine) setEngine(details.engine)
        if (!doors && details.doors) setDoors(details.doors.toString())
        if (!mileage && details.mileage) setMileage(details.mileage.toString())
        if (!condition && details.condition) setCondition(details.condition)
        if (!displacement && details.displacement) setDisplacement(details.displacement.toString())
        if (!cargoCapacity && details.cargoCapacity) setCargoCapacity(details.cargoCapacity.toString())

        if (category) {
            const lowerCat = category.toLowerCase()
            if (lowerCat.includes('moto')) setVehicleCategory('motocicleta')
            else if (lowerCat.includes('comercial') || lowerCat.includes('camion')) setVehicleCategory('comercial')
            else if (lowerCat.includes('industrial') || lowerCat.includes('maquinaria')) setVehicleCategory('industrial')
            else if (lowerCat.includes('transporte') || lowerCat.includes('autobus') || lowerCat.includes('bus')) setVehicleCategory('transporte')
            else if (lowerCat.includes('especial') || lowerCat.includes('recreativo') || lowerCat.includes('golf')) setVehicleCategory('especial')
            else setVehicleCategory('automovil')
        }

        const feats = details.features || []
        if (feats.length > 0) {
            setSelectedFeatures(prev => {
                const newFeats = [...new Set([...prev, ...feats])]
                return newFeats
            })
        }

        if (!description) {
            // No generar descripción automática para no molestar al usuario tras mover los pasos
        }
    }

    const handleNextStep = () => {
        setCurrentStep(prev => {
            if (prev < 7) return (prev + 1) as FormStep
            return prev
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleNext = () => currentStep === 3 ? validateImagesAndProceed() : handleNextStep()
    const handleBack = () => {
        setCurrentStep(prev => {
            if (prev > 1) return (prev - 1) as FormStep
            return prev
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleLocationChange = (lat: number, lng: number, cityName: string, stateName?: string, countryName?: string) => {
        setLatitude(lat)
        setLongitude(lng)
        setCity(cityName)
        if (stateName) setStateLocation(stateName)
        if (countryName) setCountryLocation(countryName)
    }

    // 🌍 Auto-detect regional settings (currency, distance units) based on location
    useEffect(() => {
        const detectRegionalSettings = async () => {
            try {
                const coords = await getUserLocation()
                const loc = await reverseGeocode(coords.latitude, coords.longitude)

                if (loc.countryCode) {
                    const country = loc.countryCode.toUpperCase()

                    // Auto-detect currency
                    const detectedCurrency = COUNTRY_CURRENCY_MAP[country]
                    if (detectedCurrency) setCurrency(detectedCurrency)

                    // Auto-detect distance unit (km vs mi)
                    const detectedUnit = COUNTRY_DISTANCE_UNIT_MAP[country]
                    if (detectedUnit) setMileageUnit(detectedUnit)
                }
            } catch (err) {
                console.warn('No se pudo auto-detectar configuración regional:', err)
            }
        }
        detectRegionalSettings()
    }, [])

    // ✏️ Edit Mode: Load vehicle data
    useEffect(() => {
        if (editId) {
            const fetchVehicle = async () => {
                setLoading(true)
                try {
                    const res = await fetch(`/api/vehicles/${editId}`)
                    if (!res.ok) throw new Error('No se pudo cargar el vehículo')
                    const data = await res.json()
                    const v = data.vehicle

                    // Populate form
                    setVehicleCategory(v.vehicleType?.toLowerCase() || 'automovil')
                    setVehicleType(v.vehicleType || '')
                    setImages(v.images || [])
                    setDescription(v.description || '')
                    setBrand(v.brand || '')
                    setModel(v.model || '')
                    setYear(v.year?.toString() || '')
                    setPrice(v.price?.toString() || '')
                    setCurrency(v.currency || 'MXN')
                    setMileage(v.mileage?.toString() || '')
                    setMileageUnit(v.mileageUnit as 'km' | 'mi' || 'km')
                    setTransmission(v.transmission || '')
                    setFuel(v.fuel || '')
                    setEngine(v.engine || '')
                    setDoors(v.doors?.toString() || '')
                    setColor(v.color || '')
                    setCondition(v.condition || '')
                    setTraction(v.traction || '')
                    setPassengers(v.passengers?.toString() || '')
                    setDisplacement(v.displacement?.toString() || '')
                    setCargoCapacity(v.cargoCapacity?.toString() || '')
                    setOperatingHours(v.operatingHours?.toString() || '')
                    setLatitude(v.latitude)
                    setLongitude(v.longitude)
                    setCity(v.city)
                    setStateLocation(v.state || '')
                    setCountryLocation(v.country || 'MX')
                    setSelectedFeatures(v.features || [])

                } catch (err) {
                    console.error(err)
                    alert('Error cargando vehículo para editar')
                } finally {
                    setLoading(false)
                }
            }
            fetchVehicle()
        }
    }, [editId])

    const handlePublish = async () => {
        setLoading(true)
        setAiError('')

        // 🛡️ FILTRADO SILENCIOSO DE GALERÍA ANTES DE PUBLICAR
        // Analizamos todas las fotos para quitar las que no sean vehículos (sin avisar al usuario)
        let finalImages = [...images]
        try {
            const bulkRes = await fetch('/api/ai/validate-images-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images,
                    type: 'VEHICLE',
                    context: { brand, model, year }
                })
            })

            if (bulkRes.ok) {
                const bulkValidation = await bulkRes.json()
                if (bulkValidation.invalidIndices && bulkValidation.invalidIndices.length > 0) {
                    // Solo filtramos los índices > 0 (la galería). La portada (0) ya se validó antes.
                    finalImages = images.filter((_, idx) => !bulkValidation.invalidIndices.includes(idx) || idx === 0)
                    console.log(`🧹 Limpieza silenciosa: ${images.length - finalImages.length} fotos extras eliminadas por no ser válidas.`)
                }
            }
        } catch (err) {
            console.warn('Error en validación silenciosa, procediendo con fotos originales:', err)
        }

        try {
            // 🛡️ VALIDACIÓN ANTES DE ENVIAR
            const parsedYear = parseInt(year);
            if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 2) {
                alert("Por favor, ingresa un año válido.");
                setLoading(false);
                return;
            }

            if (!model || model === 'N/A' || model.trim() === '') {
                alert("Por favor, selecciona un modelo válido.");
                setLoading(false);
                return;
            }

            const deviceFP = await generateDeviceFingerprint()
            const vehicleData = {
                title: `${brand} ${model} ${year}`,
                description, brand, model,
                year: parsedYear,
                price: parseFloat(price) || 0,
                currency,
                city,
                state: stateLocation,
                country: countryLocation,
                latitude, longitude, images,
                vehicleType,
                features: selectedFeatures,
                mileage: mileage ? parseInt(mileage) : null,
                mileageUnit,
                transmission: transmission || null,
                fuel: fuel || null,
                engine: engine || null,
                doors: doors ? parseInt(doors) : null,
                color: color || null,
                condition: condition || null,
                traction: traction || null,
                passengers: passengers ? parseInt(passengers) : null,
                displacement: displacement ? parseInt(displacement) : null,
                cargoCapacity: cargoCapacity ? parseFloat(cargoCapacity) : null,
                operatingHours: operatingHours ? parseInt(operatingHours) : null,
            }

            if (deviceFP) {
                const fraudCheck = await fetch('/api/fraud/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceFingerprint: deviceFP, images, vehicleData, gpsLocation: { latitude, longitude } })
                })
                const fraudResult = await fraudCheck.json()

                // 🔥 NUEVO: Manejar caso de crédito requerido
                if (fraudResult.action === 'REQUIRE_CREDIT') {
                    setLoading(false)
                    const confirmCredit = confirm(
                        `${fraudResult.message}\n\n¿Deseas comprar créditos ahora para continuar?`
                    )
                    if (confirmCredit) {
                        router.push('/credits?reason=republication')
                    } else {
                        router.push('/profile')
                    }
                    return
                }

                // Redirigir si ya existe
                if (fraudResult.action === 'REDIRECT') {
                    setRedirectUrl(fraudResult.redirectTo)
                    setShowPortal(true)
                    setLoading(false)
                    setTimeout(() => router.push(fraudResult.redirectTo), 2000)
                    return
                }
            }

            const response = await fetch(editId ? `/api/vehicles/${editId}` : '/api/vehicles', {
                method: editId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...vehicleData, deviceFingerprint: deviceFP }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Error al publicar vehículo')
            }
            router.push('/profile?published=true')
        } catch (error) {
            console.error('Error:', error)
            alert(error instanceof Error ? error.message : 'Error al publicar.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <PortalAnimation show={showPortal} />

            <div className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div
                                    className={`flex flex-col items-center flex-1 ${step < currentStep ? 'cursor-pointer group' : ''}`}
                                    onClick={() => {
                                        if (step < currentStep) {
                                            setCurrentStep(step as FormStep)
                                        }
                                    }}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all relative
                                        ${step < currentStep ? 'bg-green-500 text-white group-hover:bg-green-600' : step === currentStep ? 'bg-primary-700 text-text-primary' : 'bg-surface border-2 border-surface-highlight text-text-secondary'}
                                    `}>
                                        {step < currentStep ? (
                                            <>
                                                <span className="group-hover:hidden">✓</span>
                                                <span className="hidden group-hover:block text-xs">Edit</span>
                                            </>
                                        ) : step}
                                    </div>
                                    <span className={`text-xs mt-2 hidden md:block ${step === currentStep ? 'text-primary-400' : 'text-text-secondary'}`}>{getStepName(step)}</span>
                                </div>
                                {step < 7 && <div className={`h-0.5 flex-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-surface-highlight'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface border border-surface-highlight rounded-2xl p-6 md:p-8 shadow-xl relative min-h-[400px]">
                    {isAnalyzing && (
                        <div className="absolute inset-0 z-40 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                            <h3 className="text-2xl font-bold text-text-primary animate-pulse">Verificando Seguridad...</h3>
                            <div className="w-64 h-2 bg-surface-highlight rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-green-500 transition-all" style={{ width: `${aiConfidence}%` }}></div>
                            </div>
                        </div>
                    )}

                    {aiError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h11l4 4V12z" />
                            </svg>
                            <p className="text-text-secondary">{aiError}</p>
                        </div>
                    )}

                    {/* Publication Tips - Only for Basic Info and Tech Details */}
                    {(currentStep === 3 || currentStep === 4) && (
                        <div className="mb-8 p-5 bg-primary-900/10 border border-primary-500/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3 text-primary-400">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="font-bold text-sm uppercase tracking-wider">Consejos para tu publicación</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>Sé honesto y detallado:</b> Menciona el estado real de la factura, tenencias y si el vehículo ha tenido incidentes o fallos mecánicos. Esto genera confianza.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>Punto de encuentro:</b> Te recomendamos acordar la revisión de documentos y del vehículo en un lugar público y seguro.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>Transparencia:</b> Una descripción clara sobre los mantenimientos realizados ayuda a vender más rápido.</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <VehicleTypeSelector
                            selectedCategory={vehicleCategory}
                            selectedSubtype={vehicleType}
                            onCategoryChange={setVehicleCategory}
                            onSubtypeChange={setVehicleType}
                        />
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableSelect
                                    label={t('publish.labels.brand')}
                                    value={brand}
                                    onChange={setBrand}
                                    strict={false}
                                    options={(() => {
                                        const cat = vehicleCategory.toLowerCase()
                                        let taxCat: VehicleCategory = 'Automóvil'

                                        if (cat.includes('moto')) taxCat = 'Motocicleta'
                                        else if (cat.includes('comercial') || cat.includes('camion')) taxCat = 'Camión'
                                        else if (cat.includes('industrial') || cat.includes('maquinaria')) taxCat = 'Maquinaria'
                                        else if (cat.includes('transporte') || cat.includes('autobus') || cat.includes('bus')) taxCat = 'Autobús'
                                        else if (cat.includes('especial')) taxCat = 'Especial'

                                        return BRANDS[taxCat] || BRANDS['Automóvil']
                                    })()}
                                />
                                <SearchableSelect
                                    label={t('publish.labels.model')}
                                    value={model}
                                    onChange={setModel}
                                    options={modelNames}
                                    strict={false}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SearchableSelect
                                    label={t('publish.labels.year')}
                                    value={year}
                                    onChange={setYear}
                                    options={getYears().map(String)}
                                    strict={false}
                                />
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="block text-text-primary font-medium">
                                        Moneda
                                    </label>
                                    <SearchableSelect
                                        value={currency}
                                        onChange={setCurrency}
                                        options={CURRENCIES.map(c => c.code)}
                                        // Custom display to show "USD - Dólar (US)"
                                        renderOption={(option) => {
                                            const c = CURRENCIES.find(curr => curr.code === option)
                                            return `${option} - ${c?.name || ''}`
                                        }}
                                    />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="block text-text-primary font-medium">
                                        {t('publish.labels.price')}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={price}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Permitir solo números
                                            const onlyNums = val.replace(/[^0-9]/g, '');
                                            // Eliminar ceros a la izquierda pero permitir "0" solo
                                            const sanitized = onlyNums.replace(/^0+(?=\d)/, '');
                                            setPrice(sanitized);
                                        }}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <ImageUploadStep
                                images={images}
                                onImagesChange={handleImagesChange}
                                invalidImageUrls={invalidImageUrls}
                                invalidReasons={invalidReasons}
                            />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-text-primary font-medium">
                                    {t('publish.labels.description')} <span className="text-xs font-normal text-text-secondary">({t('common.optional')})</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('publish.labels.description')}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg resize-none focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                />
                            </div>

                            <h3 className="text-xl font-bold text-text-primary mb-4">
                                {t('publish.steps.technical_details')} <span className="text-sm font-normal text-text-secondary">({t('common.optional')})</span>
                            </h3>
                            <div className="space-y-2">
                                <label className="block text-text-primary font-medium">
                                    {t('publish.labels.mileage')} <span className="text-xs font-normal text-text-secondary">({t('common.optional')})</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={mileage}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Permitir solo números
                                            const onlyNums = val.replace(/[^0-9]/g, '');
                                            // Eliminar ceros a la izquierda pero permitir "0" solo
                                            const sanitized = onlyNums.replace(/^0+(?=\d)/, '');
                                            setMileage(sanitized);
                                        }}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none pr-24 transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-surface-highlight p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setMileageUnit('km')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mileageUnit === 'km' ? 'bg-primary-700 text-white' : 'text-text-secondary hover:bg-surface'}`}
                                        >
                                            KM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMileageUnit('mi')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mileageUnit === 'mi' ? 'bg-primary-700 text-white' : 'text-text-secondary hover:bg-surface'}`}
                                        >
                                            MI
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableSelect
                                    label={t('publish.labels.transmission')}
                                    value={transmission}
                                    onChange={setTransmission}
                                    options={TRANSMISSIONS}
                                    strict={true}
                                />
                                <SearchableSelect
                                    label={t('publish.labels.fuel')}
                                    value={fuel}
                                    onChange={setFuel}
                                    options={FUELS}
                                    strict={true}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <label className="block text-text-primary font-medium">Tracción <span className="text-text-secondary text-xs font-normal">(4x4, AWD...)</span></label>
                                    <SearchableSelect
                                        value={traction}
                                        onChange={setTraction}
                                        // TODO: Import TRACTIONS
                                        options={['Delantera (FWD)', 'Trasera (RWD)', '4x4 (4WD)', 'Integral (AWD)', '6x4', '6x6', '8x4', '8x8']}
                                        strict={true}
                                    />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <label className="block text-text-primary font-medium">Pasajeros <span className="text-text-secondary text-xs font-normal">(Asientos)</span></label>
                                    <SearchableSelect
                                        value={passengers}
                                        onChange={setPassengers}
                                        options={['2', '4', '5', '7', '8', '12', '15', '40+']}
                                        strict={false}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SearchableSelect
                                    label={t('publish.labels.color')}
                                    value={color}
                                    onChange={setColor}
                                    options={COLORS}
                                    strict={true}
                                />
                                <SearchableSelect
                                    label={t('publish.labels.condition')}
                                    value={condition}
                                    onChange={setCondition}
                                    options={CONDITIONS}
                                    strict={true}
                                />
                                <SearchableSelect
                                    label={t('publish.labels.doors')}
                                    value={doors}
                                    onChange={setDoors}
                                    options={['2', '3', '4', '5', '6']}
                                    strict={true}
                                />
                            </div>

                            <div className="pt-4 border-t border-surface-highlight">
                                <h4 className="text-lg font-bold text-text-primary mb-4">Información de Motor y Carga</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-text-primary font-medium">Motor / Cilindrada <span className="text-text-secondary text-xs font-normal">(Opcional)</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={engine}
                                                onChange={(e) => setEngine(e.target.value)}
                                                placeholder="Ej: 2.0L Turbo, V6"
                                                className="flex-1 min-w-0 px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                            />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={displacement}
                                                onChange={(e) => setDisplacement(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="cc"
                                                className="w-20 px-3 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all text-center"
                                            />
                                        </div>
                                    </div>
                                    {(vehicleCategory.toLowerCase().includes('camion') || vehicleCategory.toLowerCase().includes('comercial')) && (
                                        <div className="space-y-2">
                                            <label className="block text-text-primary font-medium">Capacidad de Carga <span className="text-text-secondary text-xs font-normal">(Opcional)</span></label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={cargoCapacity}
                                                onChange={(e) => setCargoCapacity(e.target.value)}
                                                placeholder="Ej: 3.5 ton"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                    {(vehicleCategory.toLowerCase().includes('industrial') || vehicleCategory.toLowerCase().includes('maquinaria')) && (
                                        <div className="space-y-2">
                                            <label className="block text-text-primary font-medium">Horas de uso <span className="text-text-secondary text-xs font-normal">(Opcional)</span></label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={operatingHours}
                                                onChange={(e) => setOperatingHours(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="Ej: 1200 hrs"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">Equipamiento y Características</h2>
                                <p className="text-text-secondary">Selecciona el equipamiento destacado de tu {brand || 'vehículo'}.</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {getFeaturesByCategory(
                                    (() => {
                                        const c = vehicleCategory.toLowerCase()
                                        if (c.includes('moto')) return 'Motocicleta'
                                        if (c.includes('camion') || c.includes('comercial')) return 'Camión'
                                        if (c.includes('industrial') || c.includes('maquinaria')) return 'Maquinaria'
                                        if (c.includes('transporte') || c.includes('autobus') || c.includes('bus')) return 'Autobús'
                                        if (c.includes('especial')) return 'Especial'
                                        return 'Automóvil'
                                    })()
                                ).map(feature => {
                                    const isSelected = selectedFeatures.includes(feature)
                                    return (
                                        <button
                                            key={feature}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedFeatures(prev => prev.filter(f => f !== feature))
                                                } else {
                                                    setSelectedFeatures(prev => [...prev, feature])
                                                }
                                            }}
                                            className={`
                                                flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group
                                                ${isSelected
                                                    ? 'border-primary-700 bg-primary-700/10 shadow-lg shadow-primary-700/10'
                                                    : 'border-surface-highlight bg-background hover:border-primary-700/50'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-6 h-6 rounded flex items-center justify-center border-2 transition-colors
                                                ${isSelected ? 'bg-primary-700 border-primary-700' : 'border-surface-highlight group-hover:border-primary-700/50'}
                                            `}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-primary-400' : 'text-text-primary'}`}>{feature}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <GPSCaptureStep onLocationChange={handleLocationChange} latitude={latitude} longitude={longitude} city={city} />
                    )}

                    {currentStep === 7 && (
                        <div className="space-y-6">
                            {images.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-text-primary px-2">Fotos del Vehículo</h4>
                                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden border-2 border-surface-highlight snap-start">
                                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="p-6 bg-surface-highlight/20 border border-surface-highlight rounded-2xl">
                                <h3 className="text-xl font-bold text-text-primary">{brand} {model} {year}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-primary-700/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider">{vehicleType}</span>
                                    <span className="text-2xl font-bold text-primary-400">
                                        {formatPrice(parseFloat(price || '0'), currency, locale)}
                                    </span>
                                </div>
                                {mileage && <p suppressHydrationWarning><span className="text-text-secondary">{t('publish.labels.mileage')}:</span> {formatNumber(parseInt(mileage), locale)} {mileageUnit}</p>}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 mt-4 text-sm border-t border-surface-highlight/30 pt-4">
                                    {transmission && <p><span className="text-text-secondary">{t('publish.labels.transmission')}:</span> {transmission}</p>}
                                    {fuel && <p><span className="text-text-secondary">{t('publish.labels.fuel')}:</span> {fuel}</p>}
                                    {color && <p><span className="text-text-secondary">{t('publish.labels.color')}:</span> {color}</p>}
                                    {condition && <p><span className="text-text-secondary">{t('publish.labels.condition')}:</span> {condition}</p>}
                                    {doors && <p><span className="text-text-secondary">{t('publish.labels.doors')}:</span> {doors}</p>}
                                    {(engine || displacement) && <p><span className="text-text-secondary">Motor:</span> {engine}{displacement ? ` (${displacement}cc)` : ''}</p>}
                                    {cargoCapacity && <p><span className="text-text-secondary">Carga:</span> {cargoCapacity} ton</p>}
                                </div>
                                <p className="text-text-secondary mt-4 whitespace-pre-line">{description}</p>
                            </div>

                            {selectedFeatures.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-text-primary px-2">Equipamiento Seleccionado</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFeatures.map(f => (
                                            <span key={f} className="px-3 py-1.5 bg-surface-highlight border border-surface-highlight text-text-primary rounded-lg text-sm flex items-center gap-2">
                                                <span className="text-green-500 text-xs">●</span> {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 p-4 bg-primary-700/10 border border-primary-700/20 rounded-xl">
                                <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium text-text-primary">{city}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex gap-4">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3 bg-surface border border-surface-highlight text-text-primary rounded-xl font-medium hover:bg-surface-highlight transition-all"
                            >
                                {t('publish.actions.back')}
                            </button>
                        )}
                        {currentStep < 7 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={loading || isAnalyzing || !(() => {
                                    if (currentStep === 1) return canProceedFromStep1;
                                    if (currentStep === 2) return canProceedFromStep2;
                                    if (currentStep === 3) return canProceedFromStep3;
                                    if (currentStep === 4) return canProceedFromStep4;
                                    if (currentStep === 5) return canProceedFromStep5;
                                    if (currentStep === 6) return canProceedFromStep6;
                                    return true;
                                })()}
                                className="flex-1 px-6 py-3 bg-primary-700 text-text-primary rounded-xl font-bold hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                            >
                                {t('publish.actions.next')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-green-600 text-text-primary rounded-xl font-bold hover:bg-green-500 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                            >
                                {loading ? t('publish.actions.publishing') : t('publish.actions.publish')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
