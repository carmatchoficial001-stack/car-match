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
import { Settings2, BatteryCharging, Truck } from 'lucide-react'
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
    const [newFeature, setNewFeature] = useState('')

    const addCustomFeature = () => {
        if (newFeature.trim() && !selectedFeatures.includes(newFeature.trim())) {
            setSelectedFeatures(prev => [...prev, newFeature.trim()])
            setNewFeature('')
        }
    }

    const removeFeature = (index: number) => {
        setSelectedFeatures(prev => prev.filter((_, i) => i !== index))
    }

    const updateFeature = (index: number, value: string) => {
        setSelectedFeatures(prev => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }

    // 🔒 Track which fields user has manually edited (to prevent AI from overwriting)
    const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set())

    // Validation for the new flow
    const canProceedFromStep1 = images.length > 0
    const canProceedFromStep2 = vehicleCategory !== '' && vehicleType !== '' && brand !== '' && model !== '' && year !== '' && price !== '' && parseFloat(price) > 0
    const canProceedFromStep3 = true // Mileage is now optional
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

            // 1. 🛡️ APLICAR DETALLES DE IA (Si la portada es válida)
            if (validation.details && (!validation.invalidIndices || !validation.invalidIndices.includes(0))) {
                applyAiDetails(validation.details, validation.category)
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

        // 🔒 RESPETO A LAS CORRECCIONES DEL USUARIO: Solo aplicar brand/model/year si el usuario NO los editó manualmente
        if (details.brand && !userEditedFields.has('brand')) {
            const taxCat = mapCategoryToTaxonomy(category)
            if (taxCat && BRANDS[taxCat]) {
                const match = findInList(details.brand, BRANDS[taxCat])
                if (match) setBrand(match)
            } else {
                setBrand(details.brand)
            }
        }

        // 🛡️ REGLA DE AUTORIDAD CARMATCH: Sobrescribir especificaciones técnicas SOLO si el usuario no las corrigió
        if (details.model && !userEditedFields.has('model')) setModel(details.model)
        if (details.year && !userEditedFields.has('year')) setYear(details.year.toString())
        if (details.color && !userEditedFields.has('color')) setColor(details.color)
        if (details.type && !userEditedFields.has('vehicleType')) setVehicleType(details.type)

        if (details.transmission && !userEditedFields.has('transmission')) {
            const match = findInList(details.transmission, TRANSMISSIONS)
            setTransmission(match)
        }
        if (details.fuel && !userEditedFields.has('fuel')) {
            const match = findInList(details.fuel, FUELS)
            setFuel(match)
        }

        if (details.engine && !userEditedFields.has('engine')) setEngine(details.engine)
        if (details.doors && !userEditedFields.has('doors')) setDoors(details.doors.toString())
        if (details.displacement && !userEditedFields.has('displacement')) setDisplacement(details.displacement.toString())
        if (details.cargoCapacity && !userEditedFields.has('cargoCapacity')) setCargoCapacity(details.cargoCapacity.toString())
        if (details.traction && !userEditedFields.has('traction')) setTraction(details.traction)
        if (details.passengers && !userEditedFields.has('passengers')) setPassengers(details.passengers.toString())
        if (details.aspiration && !userEditedFields.has('aspiration')) setAspiration(details.aspiration)
        if (details.cylinders && !userEditedFields.has('cylinders')) setCylinders(details.cylinders.toString())
        if (details.hp && !userEditedFields.has('hp')) setHp(details.hp.toString())
        if (details.torque && !userEditedFields.has('torque')) setTorque(details.torque)
        if (details.batteryCapacity && !userEditedFields.has('batteryCapacity')) setBatteryCapacity(details.batteryCapacity.toString())
        if (details.range && !userEditedFields.has('range')) setRange(details.range.toString())
        if (details.weight && !userEditedFields.has('weight')) setWeight(details.weight.toString())
        if (details.axles && !userEditedFields.has('axles')) setAxles(details.axles.toString())

        // 🚗 Keep respecting user input for variable/personal data
        if (!mileage && details.mileage && !userEditedFields.has('mileage')) setMileage(details.mileage.toString())
        if (!condition && details.condition && !userEditedFields.has('condition')) setCondition(details.condition)

        if (category) {
            const lowerCat = category.toLowerCase()
            if (lowerCat.includes('moto')) setVehicleCategory('motocicleta')
            else if (lowerCat.includes('comercial') || lowerCat.includes('camion')) setVehicleCategory('comercial')
            else if (lowerCat.includes('industrial') || lowerCat.includes('maquinaria')) setVehicleCategory('industrial')
            else if (lowerCat.includes('transporte') || lowerCat.includes('autobus') || lowerCat.includes('bus')) setVehicleCategory('transporte')
            else if (lowerCat.includes('especial') || lowerCat.includes('recreativo') || lowerCat.includes('golf')) setVehicleCategory('especial')
            else setVehicleCategory('automovil')
        }

        // 🧠 SMART FEATURES: Match AI features with UI suggestions
        const feats = details.features || []

        if (feats.length > 0) {
            // 1. Get official taxonomy for this category
            const taxCat = mapCategoryToTaxonomy(category) || 'Automóvil'
            const officialFeatures = getFeaturesByCategory(taxCat)

            const normalizedFeats = feats.map((f: string) => {
                const normF = f.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

                // Try to find a match in official features
                const match = officialFeatures.find(official => {
                    const normOfficial = official.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

                    // Direct match or inclusion
                    if (normOfficial === normF) return true
                    if (normOfficial.includes(normF) && normF.length > 3) return true // "Piel" in "Asientos de Piel"

                    // Synonyms Logic
                    if (normOfficial.includes('piel') && normF.includes('cuero')) return true
                    if (normOfficial.includes('quemacocos') && (normF.includes('techo') || normF.includes('solar') || normF.includes('sunroof'))) return true
                    if (normOfficial.includes('pantalla') && (normF.includes('tactil') || normF.includes('touch') || normF.includes('infotainment'))) return true
                    if (normOfficial.includes('reversa') && (normF.includes('trasera') || normF.includes('backup'))) return true
                    if (normOfficial.includes('niebla') && (normF.includes('niebla') || normF.includes('fog'))) return true
                    if (normOfficial.includes('rines') && (normF.includes('aleacion') || normF.includes('aluminio') || normF.includes('deportivos'))) return true
                    if (normOfficial.includes('vidrios') && (normF.includes('ventanas') || normF.includes('cristales') || normF.includes('electricos'))) return true
                    if (normOfficial.includes('aire') && (normF.includes('a/c') || normF.includes('clima'))) return true
                    if (normOfficial.includes('android') && (normF.includes('carplay') || normF.includes('apple'))) return true

                    return false
                })

                return match || f // Return the official name if matched, otherwise keep original
            })

            setSelectedFeatures(prev => {
                const newFeats = [...new Set([...prev, ...normalizedFeats])]
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
            // Mileage is now optional - removed validation
            if (!city) errors.push('Ciudad')
            // Removida la validación de stateLocation si el backend no la requiere estrictamente o si queremos que falle allá

            if (errors.length > 0) {
                setAiError(`Precaución: Faltan campos requeridos:\n${errors.join(', ')}`)
                setLoading(false)
                // Opcional: mover al paso que falta (ej: info básica)
                return
            }

            const deviceFP = await generateDeviceFingerprint()
            // 🧪 Helper para parsear números seguros
            const parseN = (val: string) => {
                if (!val) return null
                const clean = val.replace(/[^0-9.]/g, '')
                return isNaN(parseFloat(clean)) ? null : parseFloat(clean)
            }

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
                mileage: mileage ? parseInt(mileage.replace(/\D/g, '')) : null,
                mileageUnit,
                transmission: transmission || null,
                fuel: fuel || null,
                engine: engine || null,
                doors: doors ? parseInt(doors.replace(/\D/g, '')) : null,
                color: color || null,
                condition: condition || null,
                traction: traction || null,
                passengers: parseN(passengers),
                displacement: parseN(displacement),
                cargoCapacity: parseN(cargoCapacity),
                operatingHours: parseN(operatingHours),
                hp: parseN(hp),
                torque: torque || undefined,
                aspiration: aspiration || undefined,
                cylinders: parseN(cylinders),
                batteryCapacity: parseN(batteryCapacity),
                range: parseN(range),
                weight: parseN(weight),
                axles: parseN(axles),
            }

            if (deviceFP) {
                const fraudCheck = await fetch('/api/fraud/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceFingerprint: deviceFP,
                        images,
                        vehicleData,
                        gpsLocation: { latitude, longitude },
                        currentVehicleId: editId
                    })
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
        <div className="min-h-screen bg-background pb-safe">
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
                                Subiendo fotos...
                            </h3>

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
                                        onChange={(value) => {
                                            setBrand(value)
                                            setUserEditedFields(prev => new Set(prev).add('brand'))
                                        }}
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
                                        onChange={(value) => {
                                            setModel(value)
                                            setUserEditedFields(prev => new Set(prev).add('model'))
                                        }}
                                        options={modelNames}
                                        strict={false}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <SearchableSelect
                                        label={t('publish.labels.year')}
                                        value={year}
                                        onChange={(value) => {
                                            setYear(value)
                                            setUserEditedFields(prev => new Set(prev).add('year'))
                                        }}
                                        options={getYears().map(String)}
                                        strict={false}
                                    />
                                    <SearchableSelect
                                        label={t('publish.labels.color')}
                                        value={color}
                                        onChange={(value) => {
                                            setColor(value)
                                            setUserEditedFields(prev => new Set(prev).add('color'))
                                        }}
                                        options={COLORS}
                                        strict={true}
                                    />
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
                                                    value={price ? Number(price).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US') : ''}
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
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Kilometraje y Transmisión */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-text-primary font-bold">
                                            {t('publish.labels.mileage')} <span className="text-xs font-normal text-text-secondary">({t('common.optional')})</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={mileage ? Number(mileage).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US') : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const onlyNums = val.replace(/[^0-9]/g, '');
                                                    const sanitized = onlyNums.replace(/^0+(?=\d)/, '');
                                                    setMileage(sanitized);
                                                    setUserEditedFields(prev => new Set(prev).add('mileage'));
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
                                        onChange={(value) => {
                                            setTransmission(value)
                                            setUserEditedFields(prev => new Set(prev).add('transmission'))
                                        }}
                                        options={TRANSMISSIONS}
                                        strict={true}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SearchableSelect
                                        label={t('publish.labels.fuel')}
                                        value={fuel}
                                        onChange={(value) => {
                                            setFuel(value)
                                            setUserEditedFields(prev => new Set(prev).add('fuel'))
                                        }}
                                        options={FUELS}
                                        strict={true}
                                    />
                                    <SearchableSelect
                                        label={t('publish.labels.condition')}
                                        value={condition}
                                        onChange={(value) => {
                                            setCondition(value)
                                            setUserEditedFields(prev => new Set(prev).add('condition'))
                                        }}
                                        options={CONDITIONS}
                                        strict={true}
                                    />
                                    <SearchableSelect
                                        label={t('publish.labels.doors')}
                                        value={doors}
                                        onChange={(value) => {
                                            setDoors(value)
                                            setUserEditedFields(prev => new Set(prev).add('doors'))
                                        }}
                                        options={['2', '3', '4', '5', '6']}
                                        strict={true}
                                    />
                                </div>

                                {/* 🔬 Detalles Técnicos Avanzados (NUEVOS) */}
                                <div className="pt-6 border-t border-surface-highlight/50 space-y-4">
                                    <h4 className="text-sm font-bold text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                        <Settings2 size={16} />
                                        Motor y Potencia
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Cilindraje</label>
                                            <input
                                                type="text"
                                                value={displacement}
                                                onChange={(e) => {
                                                    setDisplacement(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('displacement'))
                                                }}
                                                placeholder="Ej: 2.5 (L) o 600 (cc)"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Potencia (HP)</label>
                                            <input
                                                type="text"
                                                value={hp}
                                                onChange={(e) => {
                                                    setHp(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('hp'))
                                                }}
                                                placeholder="Ej: 250"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Torque</label>
                                            <input
                                                type="text"
                                                value={torque}
                                                onChange={(e) => {
                                                    setTorque(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('torque'))
                                                }}
                                                placeholder="Ej: 300 lb-pie"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Cilindros</label>
                                            <input
                                                type="text"
                                                value={cylinders}
                                                onChange={(e) => {
                                                    setCylinders(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('cylinders'))
                                                }}
                                                placeholder="Ej: 4, 6, 8"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Tipo de Motor / Descripción</label>
                                            <input
                                                type="text"
                                                value={engine}
                                                onChange={(e) => {
                                                    setEngine(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('engine'))
                                                }}
                                                placeholder="Ej: 2.0L Turbo, V6 i-VTEC, Eléctrico Dual Motor"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <SearchableSelect
                                            label="Tracción"
                                            value={traction}
                                            onChange={(value) => {
                                                setTraction(value)
                                                setUserEditedFields(prev => new Set(prev).add('traction'))
                                            }}
                                            options={['FWD (Delantera)', 'RWD (Trasera)', 'AWD (Integral)', '4WD (4x4)', '2WD', '4x2', '6x4', '8x4']}
                                            strict={false}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <SearchableSelect
                                            label="Aspiración"
                                            value={aspiration}
                                            onChange={(value) => {
                                                setAspiration(value)
                                                setUserEditedFields(prev => new Set(prev).add('aspiration'))
                                            }}
                                            options={['Atmosférico', 'Turbo', 'Bi-Turbo', 'Supercargado', 'Aspirado Natural']}
                                            strict={false}
                                        />
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Nº Pasajeros</label>
                                            <input
                                                type="text"
                                                value={passengers}
                                                onChange={(e) => {
                                                    setPassengers(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('passengers'))
                                                }}
                                                placeholder="Ej: 5"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-text-secondary uppercase">Peso (kg)</label>
                                            <input
                                                type="text"
                                                value={weight}
                                                onChange={(e) => {
                                                    setWeight(e.target.value)
                                                    setUserEditedFields(prev => new Set(prev).add('weight'))
                                                }}
                                                placeholder="Ej: 1540"
                                                className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 🔌 Campo Eléctrico (Opcional) */}
                                {fuel?.toLowerCase().includes('electric') || fuel?.toLowerCase().includes('hibrid') || engine?.toLowerCase().includes('electri') ? (
                                    <div className="pt-6 border-t border-surface-highlight/50 space-y-4 animate-in slide-in-from-left-2 duration-300">
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                            <BatteryCharging size={16} />
                                            Detalles Eléctricos
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-text-secondary uppercase">Capacidad Batería (kWh)</label>
                                                <input
                                                    type="text"
                                                    value={batteryCapacity}
                                                    onChange={(e) => setBatteryCapacity(e.target.value)}
                                                    placeholder="Ej: 75"
                                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-text-secondary uppercase">Rango Eléctrico (km)</label>
                                                <input
                                                    type="text"
                                                    value={range}
                                                    onChange={(e) => setRange(e.target.value)}
                                                    placeholder="Ej: 450"
                                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* 🚚 Campos Específicos por Tipo (Carga / Industrial / Pesados) */}
                                {(vehicleCategory === 'comercial' || vehicleCategory === 'transporte' || vehicleCategory === 'industrial') && (
                                    <div className="pt-6 border-t border-surface-highlight/50 space-y-4 animate-in slide-in-from-left-2 duration-300">
                                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                            <Truck size={16} />
                                            Detalles de Carga y Pesados
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-text-secondary uppercase">Capacidad de Carga (kg)</label>
                                                <input
                                                    type="text"
                                                    value={cargoCapacity}
                                                    onChange={(e) => setCargoCapacity(e.target.value)}
                                                    placeholder="Ej: 3500"
                                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-text-secondary uppercase">Ejes</label>
                                                <input
                                                    type="text"
                                                    value={axles}
                                                    onChange={(e) => setAxles(e.target.value)}
                                                    placeholder="Ej: 2, 3, 4"
                                                    className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                                />
                                            </div>
                                            {vehicleCategory === 'industrial' && (
                                                <div className="space-y-1 col-span-2 md:col-span-1">
                                                    <label className="block text-xs font-medium text-text-secondary uppercase">Horas de Operación</label>
                                                    <input
                                                        type="text"
                                                        value={operatingHours}
                                                        onChange={(e) => setOperatingHours(e.target.value)}
                                                        placeholder="Ej: 1200"
                                                        className="w-full px-3 py-2 bg-background border border-surface-highlight rounded-lg text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Equipamiento y Características */}
                                <div className="pt-8 border-t border-surface-highlight">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">{t('publish.labels.features_title')}</h3>
                                    <p className="text-sm text-text-secondary mb-6">
                                        Revisa, edita o elimina lo que un asesor detectó automáticamente, o agrega nuevas características manuales.
                                    </p>

                                    {/* 1. Lista de Equipamiento Seleccionado (Editable) */}
                                    <div className="space-y-3 mb-8">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFeatures.length === 0 ? (
                                                <p className="text-sm text-text-secondary italic bg-surface-highlight/20 px-4 py-2 rounded-lg border border-dashed border-surface-highlight">
                                                    No hay equipamiento seleccionado. Usa las sugerencias o agrega uno nuevo.
                                                </p>
                                            ) : (
                                                selectedFeatures.map((feature, index) => (
                                                    <div
                                                        key={`selected-${index}`}
                                                        className="flex items-center bg-primary-700/10 border border-primary-700/30 rounded-xl px-3 py-1.5 gap-2 group hover:bg-primary-700/20 transition-all max-w-full"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={feature}
                                                            onChange={(e) => updateFeature(index, e.target.value)}
                                                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-primary p-0 min-w-[60px] max-w-[240px] flex-1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeature(index)}
                                                            className="text-text-secondary hover:text-red-400 p-0.5 rounded-md hover:bg-red-400/10 transition flex-shrink-0"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Agregar Característica Personalizada */}
                                    <div className="flex gap-2 max-w-md mb-8">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        addCustomFeature()
                                                    }
                                                }}
                                                placeholder={'Ej: Rines deportivos 20", GPS...'}
                                                className="w-full bg-surface-highlight border border-surface-highlight p-3 rounded-xl pr-10 text-sm focus:ring-1 focus:ring-primary-700 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addCustomFeature}
                                            disabled={!newFeature.trim()}
                                            className="bg-primary-700 hover:bg-primary-600 disabled:opacity-50 text-white font-bold px-4 rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="hidden sm:inline">Agregar</span>
                                        </button>
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
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Ubicación */}
                            <GPSCaptureStep onLocationChange={handleLocationChange} latitude={latitude} longitude={longitude} city={city} />

                            {/* Resumen Final para Revisión */}
                            <div className="pt-8 border-t border-surface-highlight">
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
                                        className="flex-1 px-6 py-3 bg-green-600 text-text-primary rounded-xl font-bold hover:bg-green-500 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                    >
                                        {loading ? t('publish.actions.publishing') : t('publish.actions.publish')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
            </div>
        </div>
        </div >
    )
}
