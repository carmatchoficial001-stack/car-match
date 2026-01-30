"use client"

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import { getUserLocation } from '@/lib/geolocation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORY_COLORS, CATEGORY_EMOJIS, SERVICES_BY_CATEGORY, BUSINESS_CATEGORIES } from '@/lib/businessCategories'
import { generateDeviceFingerprint } from '@/lib/fingerprint'
import ConfirmationModal from '@/components/ConfirmationModal'
import { AlertTriangle, Clock, MapPin, Phone, Globe, Trash2, Edit, AlertCircle, Plus, Sparkles, ChevronRight, X, Image as ImageIcon, Briefcase, Info, CheckCircle, Pause, CreditCard, Play, ShieldCheck } from 'lucide-react'
import CategoryIcon from '@/components/CategoryIcon'

// Modified: MapBox Component replacement
const MapBoxAddressPicker = dynamic(() => import('@/components/MapBoxAddressPicker'), {
    ssr: false,
    loading: () => <div className="w-full h-[300px] bg-surface-highlight animate-pulse rounded-xl" />
})

import GlobalAddressSearch from '@/components/GlobalAddressSearch'
import PhoneInput from '@/components/PhoneInput' // [NEW]

interface Business {
    id: string
    name: string
    category: string
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    city: string
    images: string[]
    // New fields for types
    phone?: string
    additionalPhones?: string[]
    whatsapp?: string
    telegram?: string
    website?: string
    facebook?: string
    instagram?: string
    tiktok?: string
    expiresAt?: string
}

export default function MyBusinessesClient() {
    const searchParams = useSearchParams() // Hook
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)

    // Form states
    const [formLoading, setFormLoading] = useState(false)
    const [images, setImages] = useState<string[]>([])
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [gpsError, setGpsError] = useState<string | null>(null)
    const [gpsLoading, setGpsLoading] = useState(false)
    const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null)
    const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number } | null>(null)

    // Address Search State
    const [searchingAddress, setSearchingAddress] = useState(false)

    // Structured Address Fields
    const [street, setStreet] = useState('')
    const [streetNumber, setStreetNumber] = useState('')
    const [colony, setColony] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')

    // Services State
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [currentCategory, setCurrentCategory] = useState<string>('')

    // [NEW] Contact Fields State
    const [phone, setPhone] = useState('')
    const [additionalPhones, setAdditionalPhones] = useState<string[]>([])
    const [whatsapp, setWhatsapp] = useState('')
    const [telegram, setTelegram] = useState('')
    const [website, setWebsite] = useState('')
    const [facebook, setFacebook] = useState('')
    const [instagram, setInstagram] = useState('')
    const [tiktok, setTiktok] = useState('')
    const [hours, setHours] = useState('')

    // [NEW] Business Attributes
    const [is24Hours, setIs24Hours] = useState(false)
    const [hasEmergencyService, setHasEmergencyService] = useState(false)
    const [hasHomeService, setHasHomeService] = useState(false)
    const [isSafeMeetingPoint, setIsSafeMeetingPoint] = useState(false)

    // [NEW] Modals State
    const [showNoCreditsModal, setShowNoCreditsModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)

    // [NEW] Delete Modal State
    const [businessToDelete, setBusinessToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const { t } = useLanguage()
    const router = useRouter()

    const fetchBusinesses = async () => {
        try {
            const res = await fetch('/api/businesses')
            if (res.ok) {
                const data = await res.json()
                setBusinesses(data.businesses || [])
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Failed to fetch businesses:', errorData.error)
                // Only alert if it's a specific known error or for debugging
                // alert(`Debug: ${errorData.error || 'Error al cargar negocios'}`)
            }
        } catch (error) {
            console.error('Error fetching businesses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBusinesses()

        // Auto-open form if action=new
        if (searchParams.get('action') === 'new') {
            setShowForm(true)
        }
    }, [searchParams])

    // NOTA: La geolocalización inicial ahora la maneja MapBoxAddressPicker directamente
    // Este useEffect se eliminó porque estaba bloqueando la detección automática de ubicación
    // en el componente del mapa. MapBoxAddressPicker ahora obtiene la ubicación por sí mismo.
    /*
    useEffect(() => {
        if (!editingBusinessId && !latitude) {
            getUserLocation()
                .then(coords => {
                    setViewCenter({ lat: coords.latitude, lng: coords.longitude })
                })
                .catch(() => {
                    // Fail silently
                })
        }
    }, [editingBusinessId, latitude])
    */

    const detectLocation = async () => {
        setGpsLoading(true)
        setGpsError(null)
        try {
            const coords = await getUserLocation()
            setLatitude(coords.latitude)
            setLongitude(coords.longitude)
            setViewCenter({ lat: coords.latitude, lng: coords.longitude })

            // Auto-fill address fields from coordinates
            const res = await fetch(`/api/geolocation?lat=${coords.latitude}&lng=${coords.longitude}`)
            if (res.ok) {
                const data = await res.json()
                setStreet(data.street || '')
                setStreetNumber(data.streetNumber || '')
                setColony(data.colony || '')
                setCity(data.city || '')
                setState(data.state || '')
            }

        } catch (error) {
            console.error('Error GPS:', error)
            setGpsError('No se pudo detectar ubicación. Intenta de nuevo.')
        } finally {
            setGpsLoading(false)
        }
    }

    // Auto-detectar ubicación GPS cuando se abre el formulario de crear negocio
    useEffect(() => {
        if (showForm && !editingBusinessId && !latitude) {
            console.log('🌍 Auto-detectando ubicación GPS para nuevo negocio...')
            detectLocation()
        }
    }, [showForm, editingBusinessId])

    // Services are now imported from @/lib/businessCategories

    // Handle pin movement from MapBox component
    const handleLocationSelect = async (lat: number, lng: number) => {
        setLatitude(lat)
        setLongitude(lng)

        // Reverse Geocode to fill address fields automatically (required since inputs are hidden)
        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            if (!token) return

            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi`)
            const data = await res.json()

            if (data.features && data.features.length > 0) {
                const feature = data.features[0]
                const context = feature.context || []

                // Parse Mapbox context
                const cityCtx = context.find((c: any) => c.id.includes('place'))
                const stateCtx = context.find((c: any) => c.id.includes('region'))
                // postcodes are sometimes in context

                // Basic parsing
                setStreet(feature.text || '')
                setStreetNumber(feature.address || '')
                setCity(cityCtx?.text || '')
                setState(stateCtx?.text || '')
                // Colony is harder to get reliably from Mapbox free context, leaving empty or user can rely on search
            }
        } catch (err) {
            console.error('Error reverse geocoding:', err)
        }
    }

    const handleAddressSearch = async () => {
        // Build query from structured fields
        const components = [street, streetNumber, colony, city, state].filter(Boolean)
        const finalQuery = components.join(', ')

        if (!finalQuery.trim()) return

        setSearchingAddress(true)
        try {
            const queryParams = new URLSearchParams({ q: finalQuery })
            if (viewCenter) {
                queryParams.append('biasLat', viewCenter.lat.toString())
                queryParams.append('biasLng', viewCenter.lng.toString())
            }

            const res = await fetch(`/api/geolocation?${queryParams.toString()}`)
            if (res.ok) {
                const data = await res.json()

                if (data.latitude && data.longitude) {
                    setLatitude(data.latitude)
                    setLongitude(data.longitude)
                    setViewCenter({ lat: data.latitude, lng: data.longitude })

                    if (data.street) setStreet(data.street)
                    if (data.city) setCity(data.city)
                } else {
                    alert('No encontramos esa ubicación. Intenta ser más específico.')
                }
            }
        } catch (error) {
            console.error('Error searching address::', error)
        } finally {
            setSearchingAddress(false)
        }
    }

    const handleEdit = (business: Business) => {
        setEditingBusinessId(business.id)
        setImages(business.images)
        const b = business as any
        setLatitude(b.latitude)
        setLongitude(b.longitude)

        setStreet(b.address || '')
        setStreetNumber('')
        setColony('')
        setCity(b.city || '')
        setState('')

        if (b.latitude && b.longitude) {
            setViewCenter({ lat: b.latitude, lng: b.longitude })
        }

        if (b.latitude && b.longitude) {
            setViewCenter({ lat: b.latitude, lng: b.longitude })
        }

        setSelectedServices(b.services || [])
        setCurrentCategory(b.category)

        // Load new fields
        setPhone(b.phone || '')
        setAdditionalPhones(b.additionalPhones || [])
        setWhatsapp(b.whatsapp || '')
        setTelegram(b.telegram || '')
        setWebsite(b.website || '')
        setFacebook(b.facebook || '')
        setInstagram(b.instagram || '')
        setTiktok(b.tiktok || '')
        setHours(b.hours || '')

        // Load Attributes
        setIs24Hours(b.is24Hours || false)
        setHasEmergencyService(b.hasEmergencyService || false)
        setHasHomeService(b.hasHomeService || false)
        setIsSafeMeetingPoint(b.isSafeMeetingPoint || false)

        setShowForm(true)
    }

    const resetForm = () => {
        setEditingBusinessId(null)
        setImages([])
        setLatitude(null)
        setLongitude(null)

        setStreet('')
        setStreetNumber('')
        setColony('')
        setCity('')
        setState('')

        setSelectedServices([])
        setCurrentCategory('')

        // Reset new fields
        setPhone('')
        setAdditionalPhones([])
        setWhatsapp('')
        setTelegram('')
        setWebsite('')
        setFacebook('')
        setInstagram('')
        setTiktok('')
        setHours('')

        // Reset Attributes
        setIs24Hours(false)
        setHasEmergencyService(false)
        setHasHomeService(false)
        setIsSafeMeetingPoint(false)

        // 🚀 LIMPIEZA TOTAL:
        // 1. Cerrar formulario
        setShowForm(false)
        // 2. Limpiar URL para evitar que se reabra por ?action=new
        router.replace('/my-businesses')
    }

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentCategory(e.target.value)
        setSelectedServices([])
    }

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formElement = e.currentTarget
        setFormLoading(true)

        try {
            // Validar imágenes con el Equipo de Seguridad antes de crear el negocio
            if (images.length > 0) {
                for (const img of images) {
                    try {
                        const res = await fetch('/api/ai/validate-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: img, type: 'BUSINESS' })
                        })
                        const validation = await res.json()

                        if (!validation.valid) {
                            alert(`⚠️ La imagen no cumple con la política de contenido: ${validation.reason}`)
                            setFormLoading(false)
                            return
                        }
                    } catch (e) {
                        console.error('Error validando imagen:', e)
                        // Si hay error técnico en la validación, permitir continuar
                    }
                }
            }

            // Concatenate Address
            const fullAddress = `${street} ${streetNumber}, ${colony}, ${city}, ${state}`.replace(/, ,/g, ',').trim()

            // 🛡️ CAPTURAR HUELLA DIGITAL
            const fingerprintData = await generateDeviceFingerprint()
            const fingerprint = {
                deviceHash: fingerprintData?.visitorId || 'unknown'
            }

            const formData = new FormData(formElement)
            const businessData = {
                id: editingBusinessId,
                name: formData.get('name'),
                description: formData.get('description'),
                category: formData.get('category'),
                phone, // State
                additionalPhones,
                whatsapp,
                telegram,
                website,
                facebook,
                instagram,
                tiktok,
                address: fullAddress, // Send the concatenated string
                street,
                streetNumber,
                colony,
                city,
                state,
                latitude,
                longitude,
                images,
                services: selectedServices,
                // Sent attributes
                is24Hours,
                hasEmergencyService,
                hasHomeService,
                isSafeMeetingPoint,
                hours,
                fingerprint // 🛡️ Enviar huella
            }


            const method = editingBusinessId ? 'PATCH' : 'POST'
            const res = await fetch('/api/businesses', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(businessData)
            })

            if (res.ok) {
                fetchBusinesses()
                resetForm()
            } else {
                const data = await res.json()
                alert(data.error || 'Error al guardar negocio')
            }
        } catch (error) {
            console.error('Error saving business:', error)
            alert('Error de conexión al guardar negocio')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = (id: string) => {
        setBusinessToDelete(id)
    }

    const confirmDelete = async () => {
        if (!businessToDelete) return
        setIsDeleting(true)

        try {
            const res = await fetch(`/api/businesses?id=${businessToDelete}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                fetchBusinesses()
                setBusinessToDelete(null)
            } else {
                alert('Error al eliminar negocio')
            }
        } catch (error) {
            console.error('Error deleting business:', error)
            alert('Error al eliminar negocio')
        } finally {
            setIsDeleting(false)
        }
    }

    const toggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

        try {
            const res = await fetch('/api/businesses/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })

            const data = await res.json()

            if (res.status === 402) {
                setShowNoCreditsModal(true)
                return
            }

            if (res.ok) {
                fetchBusinesses()
                if (data.creditsRemaining !== undefined) {
                    setCreditsRemaining(data.creditsRemaining)
                    setShowSuccessModal(true)
                }
            } else {
                alert(data.error || 'Error al cambiar estado')
            }
        } catch (error) {
            console.error('Error toggling status:', error)
            alert('Error al cambiar estado')
        }
    }

    const getBusinessValue = (field: keyof Business) => {
        if (!editingBusinessId) return ''
        const business = businesses.find(b => b.id === editingBusinessId)
        return business ? (business as any)[field] || '' : ''
    }

    return (
        <div className="min-h-screen bg-background" >
            <div className="container mx-auto px-4 pt-8 pb-24 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">{t('business.title')}</h1>
                        <p className="text-text-secondary">{t('business.subtitle')}</p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => {
                                resetForm()
                                setShowForm(true)
                            }}
                            className="px-6 py-3 bg-primary-700 text-text-primary rounded-lg hover:bg-primary-600 transition font-medium shadow-lg shadow-primary-900/20"
                        >
                            {t('business.new_business')}
                        </button>
                    )}
                </div>

                {showForm ? (
                    <div className="bg-surface rounded-2xl shadow-xl p-8 border border-surface-highlight mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-text-primary">
                                {editingBusinessId ? t('business.edit_business') : t('business.register_business')}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                {t('business.cancel')}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6" key={editingBusinessId || 'new'}>
                            {/* Location Map Section */}
                            <div className="space-y-4">


                                {/* Category Selection (Define el color) */}
                                <div className="bg-surface-highlight/30 p-4 rounded-xl border border-primary-700/20 mb-4">
                                    <label className="block text-sm font-bold text-primary-500 mb-2">
                                        1. Primero selecciona el Tipo de Negocio
                                    </label>
                                    <select
                                        name="category"
                                        defaultValue={getBusinessValue('category')}
                                        required
                                        onChange={handleCategoryChange}
                                        className="w-full px-4 py-3 bg-background border-2 border-primary-700/50 rounded-lg text-text-primary focus:border-primary-700 outline-none font-medium text-sm md:text-base max-h-60"
                                    >
                                        <option value="">Selecciona una categoría...</option>
                                        {/* Dynamic category list from taxonomy - Sorted Alphabetically by Translation */}
                                        {[...BUSINESS_CATEGORIES]
                                            .filter(cat => !cat.isPublic)
                                            .sort((a, b) => (t(`map_store.categories.${a.id}`) || a.label).localeCompare(t(`map_store.categories.${b.id}`) || b.label))
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {t(`map_store.categories.${cat.id}`) || cat.label}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs text-text-secondary hidden md:flex items-center gap-2">
                                        <span>💡</span>
                                        Usa <strong>"Mi Ubicación"</strong> o busca la ciudad/calle. <span className="text-primary-400">El mapa es lo más preciso.</span>
                                    </p>

                                    {/* Global Search Bar */}
                                    <div className="md:col-span-6 mb-4">
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            🔍 Buscar Ubicación Exacta
                                        </label>
                                        <GlobalAddressSearch
                                            proximity={viewCenter}
                                            onSelect={(data) => {
                                                setLatitude(data.latitude)
                                                setLongitude(data.longitude)
                                                setStreet(data.street)
                                                setStreetNumber(data.streetNumber)
                                                setColony(data.colony)
                                                setCity(data.city)
                                                setState(data.state)

                                                // Move map to new location
                                                setViewCenter({ lat: data.latitude, lng: data.longitude })
                                            }}
                                        />
                                    </div>

                                    {/* Address Summary */}
                                    <div className="md:col-span-6 bg-surface-highlight/30 p-3 rounded-lg border border-surface-highlight flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider mb-1">Dirección Detectada (Automática)</p>
                                            <p className="text-text-primary text-sm font-medium">
                                                {street} {streetNumber}, {colony}, {city}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={detectLocation}
                                            disabled={gpsLoading}
                                            className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 bg-surface px-3 py-2 rounded-lg border border-primary-900/30"
                                        >
                                            {gpsLoading ? '⏳' : '📍 Actualizar con mi GPS'}
                                        </button>
                                    </div>
                                </div>

                                {/* Map Visualization */}
                                <div className="rounded-xl overflow-hidden border border-surface-highlight shadow-sm">
                                    <MapBoxAddressPicker
                                        latitude={latitude}
                                        longitude={longitude}
                                        viewCenter={viewCenter}
                                        onLocationSelect={handleLocationSelect}
                                        markerColor={CATEGORY_COLORS[currentCategory] || '#ef4444'}
                                        markerEmoji={CATEGORY_EMOJIS[currentCategory] || '🔧'}
                                    />
                                </div>
                            </div>

                            {/* Rest of the form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">{t('business.name_label')}</label>
                                    <input
                                        name="name"
                                        defaultValue={getBusinessValue('name')}
                                        required
                                        autoComplete="off"
                                        data-lpignore="true"
                                        className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-700 outline-none"
                                        placeholder={t('business.name_placeholder')}
                                    />
                                </div>
                                <div>
                                    {/* Category was moved to top */}
                                </div>
                                {/* CONTACT INFO SECTION */}
                                <div className="md:col-span-2 space-y-6 bg-surface-highlight/10 p-4 rounded-xl border border-surface-highlight">
                                    <h3 className="text-lg font-bold text-text-primary border-b border-surface-highlight pb-2">
                                        📞 Contacto y Redes
                                    </h3>

                                    {/* Main Phone */}
                                    <div>
                                        <PhoneInput
                                            label="Teléfono Principal"
                                            value={phone}
                                            onChange={setPhone}
                                            required
                                            name="phone"
                                        />
                                    </div>

                                    {/* Additional Phones */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-text-primary">Teléfonos Adicionales (Opcional)</label>
                                        <div className="space-y-2">
                                            {additionalPhones.map((p, idx) => (
                                                <div key={idx} className="flex gap-2 animate-fade-in">
                                                    <div className="flex-1">
                                                        <PhoneInput
                                                            value={p}
                                                            onChange={(val) => {
                                                                const newPhones = [...additionalPhones];
                                                                newPhones[idx] = val;
                                                                setAdditionalPhones(newPhones);
                                                            }}
                                                            placeholder={`Teléfono ${idx + 2}`}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdditionalPhones(prev => prev.filter((_, i) => i !== idx))}
                                                        className="px-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            {additionalPhones.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAdditionalPhones(prev => [...prev, ''])}
                                                    className="w-full py-2 border-2 border-dashed border-surface-highlight rounded-lg text-text-secondary text-sm hover:border-primary-700/50 hover:text-primary-400 transition flex items-center justify-center gap-2"
                                                >
                                                    + Agregar otro teléfono
                                                </button>
                                            )}
                                        </div>
                                    </div>


                                    {/* WhatsApp & Telegram */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <PhoneInput
                                                label="WhatsApp (Opcional)"
                                                value={whatsapp}
                                                onChange={setWhatsapp}
                                                placeholder="Para mensajería..."
                                                name="whatsapp"
                                            />
                                        </div>
                                        <div>
                                            <PhoneInput
                                                label="Telegram (Opcional)"
                                                value={telegram}
                                                onChange={setTelegram}
                                                placeholder="Para mensajería..."
                                                name="telegram"
                                            />
                                        </div>
                                    </div>

                                    {/* Social Media & Web */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">🌐 Sitio Web (Opcional)</label>
                                            <input
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg outline-none focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">📘 Facebook (Opcional)</label>
                                            <input
                                                value={facebook}
                                                onChange={(e) => setFacebook(e.target.value)}
                                                placeholder="Link a perfil/página"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg outline-none focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">📷 Instagram (Opcional)</label>
                                            <input
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                placeholder="@usuario o link"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg outline-none focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">🎵 TikTok (Opcional)</label>
                                            <input
                                                value={tiktok}
                                                onChange={(e) => setTiktok(e.target.value)}
                                                placeholder="@usuario"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg outline-none focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">⏰ Horario de Atención (Opcional)</label>
                                            <input
                                                value={hours}
                                                onChange={(e) => setHours(e.target.value)}
                                                placeholder="L-V 9am-6pm, Sáb 10am-2pm"
                                                className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg outline-none focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-2">{t('business.description_label')} (Opcional)</label>
                                    <textarea
                                        name="description"
                                        defaultValue={getBusinessValue('description' as any)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-700 outline-none"
                                        placeholder={t('business.description_placeholder')}
                                    />
                                </div>

                                {/* Atributos Especiales Checkboxes */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="bg-primary-900/10 p-5 rounded-2xl border border-primary-500/20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck size={18} className="text-primary-400" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-primary-400">Punto de Encuentro Seguro</h4>
                                        </div>

                                        <label className="flex items-start gap-4 p-4 bg-background/40 hover:bg-background/60 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary-500/30 group">
                                            <div className="pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSafeMeetingPoint}
                                                    onChange={(e) => setIsSafeMeetingPoint(e.target.checked)}
                                                    className="w-5 h-5 rounded border-surface-highlight text-primary-600 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-black text-text-primary uppercase tracking-tight">Ofrecer mi local como punto seguro</span>
                                                    <Sparkles size={14} className="text-primary-500 animate-pulse" />
                                                </div>
                                                <p className="text-xs text-text-secondary leading-relaxed">
                                                    Permite que compradores y vendedores usen tu negocio como punto de reunión verificado.
                                                    <span className="text-primary-400/80 ml-1 font-medium">Esto aumenta la visibilidad de tu local y atrae potenciales clientes.</span>
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${is24Hours ? 'bg-blue-500/10 border-blue-500/30' : 'bg-surface border-surface-highlight hover:border-blue-500/40'}`}>
                                            <input
                                                type="checkbox"
                                                checked={is24Hours}
                                                onChange={(e) => setIs24Hours(e.target.checked)}
                                                className="w-5 h-5 rounded border-surface-highlight text-blue-600 focus:ring-blue-500 bg-background"
                                            />
                                            <div className={`p-2 rounded-lg ${is24Hours ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-text-secondary opacity-50'}`}>
                                                <Clock size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <span className={`text-xs font-bold uppercase tracking-tight ${is24Hours ? 'text-blue-400' : 'text-text-secondary'}`}>Servicio 24 Horas</span>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${hasEmergencyService ? 'bg-red-500/10 border-red-500/30' : 'bg-surface border-surface-highlight hover:border-red-500/40'}`}>
                                            <input
                                                type="checkbox"
                                                checked={hasEmergencyService}
                                                onChange={(e) => setHasEmergencyService(e.target.checked)}
                                                className="w-5 h-5 rounded border-surface-highlight text-red-600 focus:ring-red-500 bg-background"
                                            />
                                            <div className={`p-2 rounded-lg ${hasEmergencyService ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-text-secondary opacity-50'}`}>
                                                <AlertCircle size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <span className={`text-xs font-bold uppercase tracking-tight ${hasEmergencyService ? 'text-red-400' : 'text-text-secondary'}`}>Emergencia</span>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${hasHomeService ? 'bg-green-500/10 border-green-500/30' : 'bg-surface border-surface-highlight hover:border-green-500/40'}`}>
                                            <input
                                                type="checkbox"
                                                checked={hasHomeService}
                                                onChange={(e) => setHasHomeService(e.target.checked)}
                                                className="w-5 h-5 rounded border-surface-highlight text-green-600 focus:ring-green-500 bg-background"
                                            />
                                            <div className={`p-2 rounded-lg ${hasHomeService ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-secondary opacity-50'}`}>
                                                <Briefcase size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <span className={`text-xs font-bold uppercase tracking-tight ${hasHomeService ? 'text-green-400' : 'text-text-secondary'}`}>A domicilio</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-3">{t('business.services_label')} (Opcional)</label>

                                    {!currentCategory ? (
                                        <p className="text-sm text-text-secondary italic">{t('business.select_category_helper')}</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Array.from(new Set([...(SERVICES_BY_CATEGORY[currentCategory] || []), ...selectedServices])).map(service => (
                                                <label key={service} className={`flex items-center gap-2 p-3 bg-background border rounded-lg cursor-pointer transition ${selectedServices.includes(service) ? 'border-primary-700 bg-primary-700/10' : 'border-surface-highlight hover:border-primary-700/50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedServices.includes(service)}
                                                        onChange={() => toggleService(service)}
                                                        className="w-4 h-4 rounded border-surface-highlight text-primary-700 focus:ring-primary-700"
                                                    />
                                                    <span className="text-sm text-text-primary">{service}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Custom Service Input */}
                                    <div className="mt-4 pt-4 border-t border-surface-highlight/30">
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            ✨ ¿Ofreces otro servicio? (Agrégalo aquí)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="custom-service-input"
                                                className="flex-1 px-4 py-2 bg-background border border-surface-highlight rounded-lg text-text-primary text-sm focus:border-primary-500 outline-none"
                                                placeholder="Ej. Restauración de Volantes..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const input = e.currentTarget as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !selectedServices.includes(val)) {
                                                            setSelectedServices([...selectedServices, val]);
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('custom-service-input') as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val && !selectedServices.includes(val)) {
                                                        setSelectedServices([...selectedServices, val]);
                                                        input.value = '';
                                                    }
                                                }}
                                                className="px-4 py-2 bg-surface-highlight hover:bg-surface-highlight/80 text-primary-400 font-bold rounded-lg border border-primary-900/30"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="border-t border-surface-highlight pt-6">
                                <ImageUpload
                                    images={images}
                                    onImagesChange={(newImages) => {
                                        // Solo actualizar las imágenes sin validar
                                        // La validación se hará al enviar el formulario
                                        setImages(newImages)
                                    }}
                                    maxImages={1}
                                    label="Foto de Portada (Opcional)"
                                    required={false}
                                    imageType="business" // 🛡️ Moderación de negocio activada
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-surface-highlight text-text-primary rounded-lg hover:bg-surface transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading || !latitude}
                                    className="px-6 py-3 bg-primary-700 text-text-primary rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formLoading ? 'Guardando...' : (editingBusinessId ? 'Actualizar Negocio' : 'Crear Negocio')}
                                </button>
                            </div>
                        </form>
                    </div >
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <p className="text-text-secondary">{t('business.loading')}</p>
                        ) : businesses.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-surface rounded-2xl border border-surface-highlight">
                                <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🏢</span>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">{t('business.no_businesses')}</h3>
                                <p className="text-text-secondary mb-6">{t('business.register_first')}</p>
                                <button
                                    onClick={() => {
                                        resetForm()
                                        setShowForm(true)
                                    }}
                                    className="px-6 py-3 bg-primary-700 text-text-primary rounded-lg hover:bg-primary-600 transition"
                                >
                                    {t('business.register_first_btn')}
                                </button>
                            </div>
                        ) : (
                            businesses.map(business => (
                                <div key={business.id} className={`rounded-xl border overflow-hidden transition group ${business.status === 'ACTIVE'
                                    ? 'bg-surface border-surface-highlight hover:border-primary-700/50'
                                    : 'bg-surface/50 border-surface-highlight/50 opacity-60'
                                    }`}>
                                    <div className="aspect-video bg-surface-highlight relative overflow-hidden">
                                        {business.images[0] ? (
                                            <>
                                                <div
                                                    className={`absolute inset-0 bg-cover bg-center blur-md opacity-50 ${business.status !== 'ACTIVE' ? 'grayscale' : ''}`}
                                                    style={{ backgroundImage: `url(${business.images[0]})` }}
                                                />
                                                <img
                                                    src={business.images[0]}
                                                    alt={business.name}
                                                    className={`relative w-full h-full object-contain z-10 ${business.status !== 'ACTIVE' ? 'grayscale' : ''}`}
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                                Sin foto
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            {business.status === 'ACTIVE' ? <CheckCircle size={14} /> : <Pause size={14} />}
                                            {business.status === 'ACTIVE' ? t('business.status_active') : t('business.status_inactive')}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-text-primary text-lg mb-1">{business.name}</h3>
                                        <p className="text-sm text-text-secondary mb-3 capitalize">{business.category}</p>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <MapPin size={14} className="text-primary-500" />
                                            <span>{business.city}</span>
                                        </div>
                                        {business.expiresAt && (
                                            <div className="mt-2 text-xs font-medium text-text-secondary bg-surface-highlight/30 px-2 py-1 rounded inline-block">
                                                📅 Vence: {new Date(business.expiresAt).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-4 pb-4 pt-0 flex gap-2">
                                        <button
                                            onClick={() => toggleStatus(business.id, business.status)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 ${business.status === 'ACTIVE'
                                                ? 'bg-amber-900/20 text-amber-500 hover:bg-amber-900/30 border border-amber-500/20'
                                                : (business.expiresAt && new Date(business.expiresAt) < new Date()) || !business.expiresAt
                                                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-900/20'
                                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20'
                                                }`}
                                        >
                                            {business.status === 'ACTIVE' ? (
                                                <><Pause size={16} className="mr-1" /> {t('business.deactivate')}</>
                                            ) : (
                                                (business.expiresAt && new Date(business.expiresAt) < new Date()) || !business.expiresAt ? (
                                                    <><CreditCard size={16} className="mr-1" /> Activar con 1 Crédito</>
                                                ) : (
                                                    <><Play size={16} className="mr-1" /> {t('business.activate')}</>
                                                )
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(business)}
                                            className="flex-1 py-2 bg-surface-highlight text-text-primary rounded-lg text-sm hover:bg-surface transition"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(business.id)}
                                            className="px-3 py-2 bg-red-900/20 text-red-400 rounded-lg text-sm hover:bg-red-900/30 transition flex items-center justify-center"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
                }
            </div >

            {/* Modal de Sin Créditos */}
            < ConfirmationModal
                isOpen={showNoCreditsModal}
                onClose={() => setShowNoCreditsModal(false)}
                title="¡Ups! Necesitas Créditos"
                message="Tu primer negocio es gratis, pero para activar más necesitas créditos. ¡Impulsa tu negocio en CarMatch y llega a miles de clientes!"
                variant="credit"
                confirmLabel="Comprar Créditos"
                onConfirm={() => router.push('/credits')}
            />

            {/* Modal de Éxito */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="¡Negocio Activo!"
                message={creditsRemaining !== null
                    ? `Tu negocio ya está visible para todos. Te quedan ${creditsRemaining} créditos disponibles.`
                    : "Tu negocio ya está visible para todos en el mapa y la red."
                }
                variant="success"
                confirmLabel="Excelente"
                showCancel={false}
                onConfirm={() => setShowSuccessModal(false)}
            />

            {/* Modal de Confirmación de Eliminación */}
            <ConfirmationModal
                isOpen={!!businessToDelete}
                onClose={() => setBusinessToDelete(null)}
                title="¿Eliminar Negocio?"
                message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este negocio permanentemente?"
                variant="danger"
                confirmLabel="Eliminar Definitivamente"
                cancelLabel="Cancelar"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />
        </div >
    )
}
