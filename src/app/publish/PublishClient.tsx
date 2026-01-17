"use client"

import { useState, useEffect, useRef } from 'react'
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

type FormStep = 1 | 2 | 3 | 4
type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD'

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
    const errorRef = useRef<HTMLDivElement>(null)

    // 🎯 Scroll to error automatically
    useEffect(() => {
        if (aiError && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [aiError])

    // Helper for Step Names
    const getStepName = (step: number) => {
        switch (step) {
            case 1: return t('publish.steps.images')
            case 2: return t('publish.steps.identity_price')
            case 3: return t('publish.steps.specs_features')
            case 4: return t('publish.steps.location_review')
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
    const [hp, setHp] = useState('')
    const [torque, setTorque] = useState('')
    const [aspiration, setAspiration] = useState('')
    const [cylinders, setCylinders] = useState('')
    const [batteryCapacity, setBatteryCapacity] = useState('')
    const [range, setRange] = useState('')
    const [weight, setWeight] = useState('')
    const [axles, setAxles] = useState('')
    const [status, setStatus] = useState<VehicleStatus>('ACTIVE')

    // Step 5: Location
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [city, setCity] = useState('')
    const [stateLocation, setStateLocation] = useState('')
    const [countryLocation, setCountryLocation] = useState('MX')

    // Step 6: Features
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

    // Validation for the new flow
    const canProceedFromStep1 = images.length > 0
    const canProceedFromStep2 = vehicleCategory !== '' && vehicleType !== '' && brand !== '' && model !== '' && year !== '' && price !== '' && parseFloat(price) > 0
    const canProceedFromStep3 = mileage !== '' && (parseInt(mileage) >= 0)
    const canProceedFromStep4 = latitude !== null && longitude !== null && city !== ''

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

            // 1. 🛡️ REGLA SOBERANA: Aplicar Brand/Model/Year de la portada SIEMPRE
            // incluso si el usuario ya escribió algo, el Asesor Real tiene la última palabra visual.
            if (validation.details && (!validation.invalidIndices || !validation.invalidIndices.includes(0))) {
                applyAiDetails(validation.details, validation.category, true) // Pass flag to force overwrite
            }

            // 2. 🚨 VALIDAR PORTADA (Index 0)
            // Solo bloqueamos si la PORTADA misma es basura o no es un vehículo.
            if (!validation.valid || validation.invalidIndices?.includes(0)) {
                const reason = validation.reason || 'La foto de portada debe ser un vehículo real.'
                setAiError(reason)
                setIsAnalyzing(false)
                setInvalidImageUrls(new Set([images[0]]))
                setInvalidReasons({ [images[0]]: reason })
                return
            }

            // 3. 🧹 FILTRAR GALERÍA (Index > 0)
            // Si hay fotos malas en la galería, las quitamos silenciosamente y continuamos.
            if (validation.invalidIndices && validation.invalidIndices.length > 0) {
                const cleanImages = images.filter((_, idx) => !validation.invalidIndices.includes(idx))
                console.log(`🧹 Limpieza mágica de galería: ${images.length - cleanImages.length} fotos eliminadas por no coincidir.`);
                setImages(cleanImages)
            }

            setInvalidImageUrls(new Set())
            setIsAnalyzing(false)
            handleNextStep() // Proceder al siguiente paso automáticamente si la portada es buena

        } catch (error: any) {
            console.error('Error en validación de imágenes:', error)
            setAiError(error.message || 'No pudimos verificar tus imágenes. Intenta de nuevo.')
            setIsAnalyzing(false)
        }
    }

    const confirmValidationProceed = () => {
        setImages(validImagesCache)
        if (bestAiDetailsCache) applyAiDetails(bestAiDetailsCache, bestCategoryCache)
        handleNextStep()
    }

    const cancelValidation = () => { }

    const applyAiDetails = (details: any, category: string, forceIdentityOverwrite: boolean = false) => {
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
                if (match) setBrand(match)
            } else {
                setBrand(details.brand)
            }
        }

        // 🛡️ REGLA DE AUTORIDAD CARMATCH: Sobrescribir especificaciones técnicas con la verdad de la IA
        if (details.model) setModel(details.model)
        if (details.year) setYear(details.year.toString())
        if (details.color) setColor(details.color)
        if (details.type) setVehicleType(details.type)

        if (details.transmission) {
            const match = findInList(details.transmission, TRANSMISSIONS)
            setTransmission(match)
        }
        if (details.fuel) {
            const match = findInList(details.fuel, FUELS)
            setFuel(match)
        }

        if (details.engine) setEngine(details.engine)
        if (details.doors) setDoors(details.doors.toString())
        if (details.displacement) setDisplacement(details.displacement.toString())
        if (details.cargoCapacity) setCargoCapacity(details.cargoCapacity.toString())
        if (details.traction) setTraction(details.traction)
        if (details.passengers) setPassengers(details.passengers.toString())
        if (details.aspiration) setAspiration(details.aspiration)
        if (details.cylinders) setCylinders(details.cylinders.toString())
        if (details.hp) setHp(details.hp.toString())
        if (details.torque) setTorque(details.torque)
        if (details.batteryCapacity) setBatteryCapacity(details.batteryCapacity.toString())
        if (details.range) setRange(details.range.toString())
        if (details.weight) setWeight(details.weight.toString())
        if (details.axles) setAxles(details.axles.toString())

        // 🚗 Keep respecting user input for variable/personal data
        if (!mileage && details.mileage) setMileage(details.mileage.toString())
        if (!condition && details.condition) setCondition(details.condition)

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

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [currentStep])

    const handleNextStep = () => {
        setCurrentStep(prev => {
            if (prev < 4) return (prev + 1) as FormStep
            return prev
        })
    }

    const handleNext = () => currentStep === 1 ? validateImagesAndProceed() : handleNextStep()
    const handleBack = () => {
        setCurrentStep(prev => {
            if (prev > 1) return (prev - 1) as FormStep
            return prev
        })
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
            const errors: string[] = []
            const parsedYear = parseInt(year)

            if (!brand || brand.trim() === '') errors.push('Marca')
            if (!model || model === 'N/A' || model.trim() === '') errors.push('Modelo')
            if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 2) errors.push('Año válido')
            if (!price || parseFloat(price) <= 0) errors.push('Precio')
            if (images.length === 0) errors.push('Al menos 1 imagen')
            if (!mileage) errors.push('Kilometraje')
            if (!city) errors.push('Ciudad')
            // Removida la validación de stateLocation si el backend no la requiere estrictamente o si queremos que falle allá

            if (errors.length > 0) {
                setAiError(`Precaución: Faltan campos requeridos:\n${errors.join(', ')}`)
                setLoading(false)
                // Opcional: mover al paso que falta (ej: info básica)
                return
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
                displacement: displacement || undefined,
                cargoCapacity: cargoCapacity || undefined,
                operatingHours: operatingHours || undefined,
                hp: hp || undefined,
                torque: torque || undefined,
                aspiration: aspiration || undefined,
                cylinders: cylinders || undefined,
                batteryCapacity: batteryCapacity || undefined,
                range: range || undefined,
                weight: weight || undefined,
                axles: axles || undefined,
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
                if (errorData.missingFields) {
                    throw new Error(`Faltan campos: ${errorData.missingFields.join(', ')}`)
                }
                throw new Error(errorData.error || 'Error al publicar vehículo')
            }
            router.push('/profile?published=true')
        } catch (error) {
            console.error('Error:', error)
            setAiError(error instanceof Error ? error.message : 'Error al publicar.')
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
                        {[1, 2, 3, 4].map((step) => (
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
                                {step < 4 && <div className={`h-0.5 flex-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-surface-highlight'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface border border-surface-highlight rounded-2xl p-6 md:p-8 shadow-xl relative min-h-[400px]">
                    {isAnalyzing && (
                        <div className="absolute inset-0 z-40 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                            <h3 className="text-2xl font-bold text-text-primary animate-pulse text-center px-6">
                                Analizando todas tus fotos (hasta 10)...
                            </h3>
                            <p className="text-primary-400 mt-2 text-sm font-bold uppercase tracking-widest">
                                Estableciendo Identidad Soberana
                            </p>
                            <div className="w-64 h-2 bg-surface-highlight rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-green-500 transition-all" style={{ width: `${aiConfidence}%` }}></div>
                            </div>
                        </div>
                    )}

                    {aiError && (
                        <div
                            ref={errorRef}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300"
                        >
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
                                <h4 className="font-bold text-sm uppercase tracking-wider">{t('publish.tips.title')}</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>{t('publish.tips.honest_title')}</b> {t('publish.tips.honest_desc')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>{t('publish.tips.safety_title')}</b> {t('publish.tips.safety_desc')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-500 mt-1">●</span>
                                    <span><b>{t('publish.tips.transparency_title')}</b> {t('publish.tips.transparency_desc')}</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <ImageUploadStep
                                images={images}
                                onImagesChange={handleImagesChange}
                                invalidImageUrls={invalidImageUrls}
                                invalidReasons={invalidReasons}
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Identificación del Vehículo */}
                            <div className="space-y-6">
                                <VehicleTypeSelector
                                    selectedCategory={vehicleCategory}
                                    selectedSubtype={vehicleType}
                                    onCategoryChange={setVehicleCategory}
                                    onSubtypeChange={setVehicleType}
                                />
                            </div>

                            {/* Marca, Modelo y Año */}
                            <div className="pt-8 border-t border-surface-highlight">
                                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary-700/20 text-primary-400 rounded-lg flex items-center justify-center text-sm">2</span>
                                    Marca y Modelo
                                </h3>
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
                                            else if (cat.includes('camion') || cat.includes('comercial')) taxCat = 'Camión'
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <SearchableSelect
                                        label={t('publish.labels.year')}
                                        value={year}
                                        onChange={setYear}
                                        options={getYears().map(String)}
                                        strict={false}
                                    />
                                    <SearchableSelect
                                        label={t('publish.labels.color')}
                                        value={color}
                                        onChange={setColor}
                                        options={COLORS}
                                        strict={true}
                                    />
                                </div>
                            </div>

                            {/* Precio */}
                            <div className="pt-8 border-t border-surface-highlight">
                                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary-700/20 text-primary-400 rounded-lg flex items-center justify-center text-sm">3</span>
                                    {t('publish.labels.price')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 col-span-1">
                                        <label className="block text-text-primary font-medium">
                                            {t('common.currency')}
                                        </label>
                                        <SearchableSelect
                                            value={currency}
                                            onChange={setCurrency}
                                            options={CURRENCIES.map(c => c.code)}
                                            renderOption={(option) => {
                                                const c = CURRENCIES.find(curr => curr.code === option)
                                                return `${option} - ${c?.name || ''}`
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="block text-text-primary font-medium">
                                            {t('publish.labels.price')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={price}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const onlyNums = val.replace(/[^0-9]/g, '');
                                                    const sanitized = onlyNums.replace(/^0+(?=\d)/, '');
                                                    setPrice(sanitized);
                                                }}
                                                placeholder="0"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg focus:ring-2 focus:ring-primary-700 outline-none transition-all pl-12 text-xl font-bold text-primary-400"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xl">$</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Kilometraje y Transmisión */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-text-primary font-bold">
                                            {t('publish.labels.mileage')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={mileage}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const onlyNums = val.replace(/[^0-9]/g, '');
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
                                                >KM</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMileageUnit('mi')}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mileageUnit === 'mi' ? 'bg-primary-700 text-white' : 'text-text-secondary hover:bg-surface'}`}
                                                >MI</button>
                                            </div>
                                        </div>
                                    </div>
                                    <SearchableSelect
                                        label={t('publish.labels.transmission')}
                                        value={transmission}
                                        onChange={setTransmission}
                                        options={TRANSMISSIONS}
                                        strict={true}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SearchableSelect label={t('publish.labels.fuel')} value={fuel} onChange={setFuel} options={FUELS} strict={true} />
                                    <SearchableSelect label={t('publish.labels.condition')} value={condition} onChange={setCondition} options={CONDITIONS} strict={true} />
                                    <SearchableSelect label={t('publish.labels.doors')} value={doors} onChange={setDoors} options={['2', '3', '4', '5', '6']} strict={true} />
                                </div>
                            </div>

                            {/* Equipamiento (Burbujas) */}
                            <div className="pt-8 border-t border-surface-highlight">
                                <h3 className="text-xl font-bold text-text-primary mb-4">{t('publish.labels.features_title')}</h3>
                                <div className="flex flex-wrap gap-2">
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
                                                    if (isSelected) setSelectedFeatures(prev => prev.filter(f => f !== feature))
                                                    else setSelectedFeatures(prev => [...prev, feature])
                                                }}
                                                className={`
                                                    px-4 py-2 rounded-full border-2 transition-all text-sm font-medium
                                                    ${isSelected ? 'border-primary-700 bg-primary-700 text-text-primary shadow-lg' : 'border-surface-highlight bg-surface text-text-secondary hover:border-primary-700/50'}
                                                `}
                                            >
                                                {t(`taxonomy.subtypes.${feature}`) || feature}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="pt-8 border-t border-surface-highlight">
                                <label className="block text-xl font-bold text-text-primary mb-4">
                                    {t('publish.labels.description')} <span className="text-xs font-normal text-text-secondary">({t('common.optional')})</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Comentarios adicionales, estado de llantas, mantenimiento, etc..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg resize-none focus:ring-2 focus:ring-primary-700 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Ubicación */}
                            <GPSCaptureStep onLocationChange={handleLocationChange} latitude={latitude} longitude={longitude} city={city} />

                            {/* Resumen Final para Revisión */}
                            <div className="pt-8 border-t border-surface-highlight">
                                <div className="p-6 bg-surface-highlight/20 border border-surface-highlight rounded-2xl relative overflow-hidden">
                                    {/* Sello de Calidad IA */}
                                    {aiConfidence === 100 && (
                                        <div className="absolute -top-1 -right-8 bg-green-500 text-white px-10 py-1 rotate-12 text-[10px] font-bold shadow-sm z-10 flex items-center gap-1">
                                            <span>✓</span> AI VERIFIED
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-6">
                                        {images[0] && (
                                            <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-primary-700/30">
                                                <img src={images[0]} alt="Portada" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">{brand} {model} {year}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-3xl font-black text-primary-400">
                                                    {formatPrice(parseFloat(price || '0'), currency, locale)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold uppercase text-text-secondary">
                                                <div className="flex items-center gap-2">📍 {city}</div>
                                                <div className="flex items-center gap-2">🛣️ {mileage} {mileageUnit}</div>
                                                <div className="flex items-center gap-2">⚙️ {transmission}</div>
                                                <div className="flex items-center gap-2">⛽ {fuel}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alertas de Validación */}
                            {(!brand || !model || !year || !price || images.length === 0 || !city) && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                                    <p className="text-red-500 font-bold text-sm">⚠️ {t('publish.validation.review_required')}</p>
                                    <ul className="text-xs text-red-400 space-y-1">
                                        {!brand && <li>• {t('publish.validation.missing_brand')}</li>}
                                        {!model && <li>• {t('publish.validation.missing_model')}</li>}
                                        {!year && <li>• {t('publish.validation.missing_year')}</li>}
                                        {(!price || parseFloat(price) <= 0) && <li>• {t('publish.validation.invalid_price')}</li>}
                                        {images.length === 0 && <li>• {t('publish.validation.missing_images')}</li>}
                                        {!city && <li>• {t('publish.validation.missing_city')}</li>}
                                    </ul>
                                </div>
                            )}
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
                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={loading || isAnalyzing || !(() => {
                                    if (currentStep === 1) return canProceedFromStep1;
                                    if (currentStep === 2) return canProceedFromStep2;
                                    if (currentStep === 3) return canProceedFromStep3;
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
                                disabled={loading || !canProceedFromStep4}
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
