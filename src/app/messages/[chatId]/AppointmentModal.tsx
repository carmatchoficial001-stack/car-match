'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface SafePlace {
    id: string | number
    name: string
    address: string
    distance: number
    icon: string
    latitude: number
    longitude: number
    isOfficialBusiness?: boolean
}

interface AppointmentModalProps {
    onClose: () => void
    onSubmit: (data: any) => void
    chatId: string
    initialAppointment?: any
}

import dynamic from 'next/dynamic'

const MapBoxAddressPicker = dynamic(() => import('@/components/MapBoxAddressPicker'), {
    ssr: false,
    loading: () => <div className="w-full h-[250px] bg-surface-highlight animate-pulse rounded-xl" />
})

export default function AppointmentModal({ onClose, onSubmit, chatId, initialAppointment }: AppointmentModalProps) {
    const { t } = useLanguage()
    const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(false)
    const [showSafePlaces, setShowSafePlaces] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [date, setDate] = useState(initialAppointment?.date ? new Date(initialAppointment.date).toISOString().split('T')[0] : '')
    const [time, setTime] = useState(initialAppointment?.date ? new Date(initialAppointment.date).toTimeString().substring(0, 5) : '')
    const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null)
    const [customLocation, setCustomLocation] = useState(initialAppointment?.location || '')
    const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number } | null>(null)
    const [customLat, setCustomLat] = useState<number | null>(initialAppointment?.latitude || null)
    const [customLng, setCustomLng] = useState<number | null>(initialAppointment?.longitude || null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Obtener ubicación inicial del usuario
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                const loc = { lat: latitude, lng: longitude }
                setUserLocation(loc)

                if (!viewCenter) {
                    setViewCenter(loc)
                    if (!customLat) setCustomLat(latitude)
                    if (!customLng) setCustomLng(longitude)
                }

                // Cargar lugares seguros al inicio para tenerlos listos para el autocompletado
                fetchSafePlaces(loc)
            },
            () => {
                if (!viewCenter) {
                    setViewCenter({ lat: 23.634501, lng: -102.552784 })
                }
                fetchSafePlaces()
            }
        )
    }, [])

    // Efecto de autocompletado inteligente
    useEffect(() => {
        const timer = setTimeout(() => {
            if (customLocation.length > 2 && isInputFocused) {
                searchAutocomplete()
            } else {
                setAutocompleteSuggestions([])
                setShowSuggestions(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [customLocation, isInputFocused])

    const fetchSafePlaces = async (coords?: { lat: number, lng: number }) => {
        setLoadingPlaces(true)
        let queryParams = ''

        if (coords) {
            queryParams = `?lat=${coords.lat}&lon=${coords.lng}`
        } else if (userLocation) {
            queryParams = `?lat=${userLocation.lat}&lon=${userLocation.lng}`
        }

        try {
            const res = await fetch(`/api/chats/${chatId}/safe-places${queryParams}`)
            const data = await res.json()
            setSafePlaces(data.suggestions || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingPlaces(false)
        }
    }

    const searchAutocomplete = async () => {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return

        try {
            const query = encodeURIComponent(customLocation)
            const proximityLng = userLocation?.lng || customLng || -102.552784
            const proximityLat = userLocation?.lat || customLat || 23.634501

            // 1. Obtener sugerencias de Mapbox
            const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=mx&language=es&limit=5&proximity=${proximityLng},${proximityLat}`
            const res = await fetch(mapboxUrl)
            const data = await res.json()

            const mapboxResults = (data.features || []).map((f: any) => ({
                id: f.id,
                name: f.text,
                address: f.place_name,
                latitude: f.center[1],
                longitude: f.center[0],
                type: 'address',
                icon: '📍'
            }))

            // 2. Filtrar lugares seguros locales que coincidan
            const term = customLocation.toLowerCase()
            const filteredSafe = safePlaces.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.address.toLowerCase().includes(term)
            ).map(p => ({ ...p, type: 'safe_point' }))

            // Combinar ambos, priorizando los puntos seguros
            setAutocompleteSuggestions([...filteredSafe, ...mapboxResults])
            setShowSuggestions(true)
        } catch (error) {
            console.error("Error in autocomplete:", error)
        }
    }

    const handleUseSafePlaces = () => {
        if (safePlaces.length === 0) {
            fetchSafePlaces()
        }
        setShowSafePlaces(true)
    }

    const handleCustomLocationSelect = (lat: number, lng: number) => {
        setCustomLat(lat)
        setCustomLng(lng)
    }

    const searchLocation = async () => {
        if (!customLocation.trim()) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return

        try {
            const query = encodeURIComponent(customLocation)

            // Usar coordenadas actuales como bias de proximidad
            // Si tenemos userLocation (detectado al inicio), lo usamos. 
            // Si no, usamos customLng/Lat si existen, o fallback al centro de México
            const proximityLng = userLocation?.lng || customLng || -102.552784
            const proximityLat = userLocation?.lat || customLat || 23.634501

            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=mx&language=es&limit=1&proximity=${proximityLng},${proximityLat}`)
            const data = await res.json()

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center
                setCustomLat(lat)
                setCustomLng(lng)
                setViewCenter({ lat, lng })
                setSelectedPlace(null) // Ensure we are in custom mode
            }
        } catch (error) {
            console.error("Error searching location:", error)
        }
    }

    const handleSubmit = () => {
        if (!date || !time) {
            alert('Por favor selecciona fecha y hora.')
            return
        }

        const locationName = selectedPlace ? selectedPlace.name : customLocation
        const locationAddress = selectedPlace ? selectedPlace.address : ''

        if (!locationName) {
            alert('Por favor selecciona o escribe un lugar de encuentro.')
            return
        }

        setIsSubmitting(true)
        try {
            const dateTime = new Date(`${date}T${time}`)

            if (isNaN(dateTime.getTime())) {
                alert('Fecha o hora no válidas.')
                setIsSubmitting(false)
                return
            }

            onSubmit({
                date: dateTime.toISOString(),
                location: locationName,
                address: locationAddress,
                latitude: selectedPlace ? selectedPlace.latitude : customLat || 0,
                longitude: selectedPlace ? selectedPlace.longitude : customLng || 0,
                monitoringActive: true
            })
        } catch (error) {
            console.error('Error in handleSubmit:', error)
            alert('Error al procesar los datos.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-surface-highlight rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-surface-highlight flex justify-between items-center bg-surface-highlight/30 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-text-primary">
                        {initialAppointment ? '🔄 Editar Reunión Segura' : t('appointment.modal_title')}
                    </h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">&times;</button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">{t('appointment.date_label')}</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-background border border-surface-highlight rounded-lg p-2.5 text-text-primary focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase">{t('appointment.time_label')}</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full bg-background border border-surface-highlight rounded-lg p-2.5 text-text-primary focus:border-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Lugar Personalizado */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-text-secondary mb-2 uppercase flex items-center gap-2">
                            <span>📍</span> {t('appointment.location_label') || 'LUGAR DE ENCUENTRO'}
                        </label>

                        <div className="bg-surface-highlight/20 p-4 rounded-xl border border-surface-highlight space-y-3">
                            <label className="block text-sm font-semibold text-text-primary">
                                Poner lugar personalizado
                            </label>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={customLocation}
                                        onChange={e => {
                                            setCustomLocation(e.target.value);
                                            setSelectedPlace(null);
                                        }}
                                        onFocus={() => {
                                            setIsInputFocused(true);
                                            if (autocompleteSuggestions.length > 0) setShowSuggestions(true);
                                        }}
                                        onBlur={() => {
                                            // Delay para permitir click en sugerencia
                                            setTimeout(() => {
                                                setIsInputFocused(false);
                                                setShowSuggestions(false);
                                            }, 200);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                                        placeholder="Ej. Plaza Principal, Calle Reforma..."
                                        className="w-full bg-background border border-surface-highlight rounded-lg p-3 pr-10 text-text-primary text-sm focus:border-primary-500 outline-none shadow-inner"
                                    />
                                    {customLocation && (
                                        <button
                                            onClick={() => {
                                                setCustomLocation('');
                                                setAutocompleteSuggestions([]);
                                                setShowSuggestions(false);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                        >
                                            &times;
                                        </button>
                                    )}

                                    {/* Dropdown de Sugerencias Inteligentes */}
                                    {showSuggestions && autocompleteSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-surface border border-surface-highlight rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                            {autocompleteSuggestions.map((s, idx) => (
                                                <button
                                                    key={`${s.type}-${s.id || idx}`}
                                                    onClick={() => {
                                                        setCustomLocation(s.name || s.address);
                                                        setCustomLat(s.latitude);
                                                        setCustomLng(s.longitude);
                                                        setViewCenter({ lat: s.latitude, lng: s.longitude });
                                                        setSelectedPlace(s.type === 'safe_point' ? s : null);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="w-full p-3 text-left hover:bg-surface-highlight/50 flex items-start gap-3 border-b border-surface-highlight last:border-0 transition-colors"
                                                >
                                                    <span className="text-xl">{s.icon || '📍'}</span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-text-primary truncate">{s.name}</span>
                                                            {s.type === 'safe_point' && (
                                                                <span className="text-[9px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full font-bold">PUNTO SEGURO</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-text-secondary truncate">{s.address}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={searchLocation}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition shadow-md flex items-center justify-center"
                                    title="Buscar en mapa"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mapa para confirmar ubicación personalizada */}
                            {customLocation && !selectedPlace && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-text-secondary font-semibold">
                                            📍 Confirma la ubicación en el mapa
                                        </p>
                                        <span className="text-[10px] text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                                            Modo Manual
                                        </span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-surface-highlight h-[250px] relative shadow-inner">
                                        <MapBoxAddressPicker
                                            latitude={customLat}
                                            longitude={customLng}
                                            onLocationSelect={handleCustomLocationSelect}
                                            viewCenter={viewCenter}
                                            markerColor="#3b82f6"
                                            markerEmoji="📍"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary italic flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Presiona Enter o el botón buscar para encontrar la dirección, luego ajusta el pin azul.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Botón para usar puntos seguros */}
                        <button
                            type="button"
                            onClick={handleUseSafePlaces}
                            className={`w-full p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl text-primary-400 font-bold hover:bg-primary-500/20 transition flex items-center justify-center gap-2 ${isInputFocused ? 'hidden' : ''}`}
                        >
                            <span className="text-xl">🛡️</span>
                            <span>Usar un punto seguro de CarMatch</span>
                        </button>
                    </div>

                    {/* Mapa y puntos seguros - Solo se muestra cuando se hace clic */}
                    {showSafePlaces && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Mapa Interactivo de punto seguro seleccionado */}
                            {selectedPlace && (
                                <div className="space-y-2">
                                    <p className="text-xs text-text-secondary font-semibold">
                                        🗺️ Ubicación del punto seguro
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-primary-500 h-[250px] relative">
                                        <MapBoxAddressPicker
                                            latitude={selectedPlace.latitude}
                                            longitude={selectedPlace.longitude}
                                            onLocationSelect={() => { }}
                                            viewCenter={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
                                            markerColor="#ef4444"
                                            markerEmoji={selectedPlace.icon || "🤝"}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Lista de puntos seguros */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">
                                        🛡️ PUNTOS SEGUROS VERIFICADOS
                                    </p>
                                    <button
                                        onClick={() => setShowSafePlaces(false)}
                                        className="text-xs text-text-secondary hover:text-text-primary"
                                    >
                                        Ocultar
                                    </button>
                                </div>

                                {loadingPlaces ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                        {safePlaces.map(place => (
                                            <button
                                                key={place.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPlace(place);
                                                    setCustomLocation('');
                                                }}
                                                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${selectedPlace?.id === place.id
                                                    ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500'
                                                    : 'bg-background border-surface-highlight hover:border-primary-500/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mt-1">{place.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-primary text-sm truncate">{place.name}</span>
                                                        {place.isOfficialBusiness && (
                                                            <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full font-bold">VERIFICADO</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-text-secondary truncate">{place.address}</div>
                                                    <div className="text-[10px] text-primary-400 font-bold mt-1 flex items-center gap-1">
                                                        <span>🗺️</span> {place.distance} km de distancia
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t border-surface-highlight bg-surface-highlight/30 rounded-b-2xl flex justify-end gap-3 ${isInputFocused ? 'hidden' : ''}`}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm font-medium transition"
                    >
                        {t('appointment.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!date || !time || (!selectedPlace && !customLocation) || isSubmitting}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            initialAppointment ? 'Actualizar Reunión Segura' : t('appointment.submit')
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
