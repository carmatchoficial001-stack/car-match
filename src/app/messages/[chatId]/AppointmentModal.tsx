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
    loading: () => <div className="w-full h-[300px] bg-surface-highlight animate-pulse rounded-xl" />
})

export default function AppointmentModal({ onClose, onSubmit, chatId }: AppointmentModalProps) {
    const { t } = useLanguage()
    const [step, setStep] = useState(1)
    const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(true)

    // Form State
    const [date, setDate] = useState(initialAppointment?.date ? new Date(initialAppointment.date).toISOString().split('T')[0] : '')
    const [time, setTime] = useState(initialAppointment?.date ? new Date(initialAppointment.date).toTimeString().substring(0, 5) : '')
    const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null)
    const [customLocation, setCustomLocation] = useState(initialAppointment?.location || '')
    const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number } | null>(
        initialAppointment?.latitude && initialAppointment?.longitude
            ? { lat: initialAppointment.latitude, lng: initialAppointment.longitude }
            : null
    )
    const [mapLat, setMapLat] = useState<number | null>(initialAppointment?.latitude || null)
    const [mapLng, setMapLng] = useState<number | null>(initialAppointment?.longitude || null)
    const [isManualSelection, setIsManualSelection] = useState(!!initialAppointment?.latitude)

    useEffect(() => {
        setLoadingPlaces(true)
        fetch(`/api/chats/${chatId}/safe-places`)
            .then(res => res.json())
            .then(data => {
                setSafePlaces(data.suggestions || [])
                if (data.centerLocation) {
                    setViewCenter({ lat: data.centerLocation.latitude, lng: data.centerLocation.longitude })
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingPlaces(false))
    }, [chatId])

    const handleLocationSelect = (lat: number, lng: number) => {
        setMapLat(lat)
        setMapLng(lng)
        setIsManualSelection(true)
        setSelectedPlace(null)
        setCustomLocation("Ubicación seleccionada en mapa")
    }

    const handleSubmit = () => {
        if (!date || !time) return

        const locationName = selectedPlace ? selectedPlace.name : customLocation
        const locationAddress = selectedPlace ? selectedPlace.address : ''

        if (!locationName) return

        const dateTime = new Date(`${date}T${time}`)

        onSubmit({
            date: dateTime.toISOString(),
            location: locationName,
            address: locationAddress,
            latitude: isManualSelection ? mapLat : (selectedPlace?.latitude || 0),
            longitude: isManualSelection ? mapLng : (selectedPlace?.longitude || 0),
            monitoringActive: true // Activar monitoreo por defecto
        })
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-surface-highlight rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-surface-highlight flex justify-between items-center bg-surface-highlight/30 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-text-primary">
                        {initialAppointment ? '🔄 Editar Cita de Reunión' : t('appointment.modal_title')}
                    </h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
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

                    {/* Mapa y Selector de Lugar */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-text-secondary mb-2 uppercase flex items-center gap-2">
                            <span>📍</span> {t('appointment.location_label')}
                        </label>

                        {/* Mapa Interactivo */}
                        <div className="rounded-xl overflow-hidden border border-surface-highlight h-[300px] relative">
                            <MapBoxAddressPicker
                                latitude={isManualSelection ? mapLat : selectedPlace?.latitude || null}
                                longitude={isManualSelection ? mapLng : selectedPlace?.longitude || null}
                                onLocationSelect={handleLocationSelect}
                                viewCenter={viewCenter}
                                markerColor={isManualSelection ? "#3b82f6" : "#ef4444"}
                                markerEmoji={isManualSelection ? "📍" : selectedPlace?.icon || "🤝"}
                            />
                        </div>

                        {/* Sugerencias de Negocios y Puntos Seguros */}
                        <div className="space-y-3">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{t('appointment.safe_places_title') || 'Sugerencias de Seguridad'}</p>

                            {loadingPlaces ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {safePlaces.map(place => (
                                        <button
                                            key={place.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPlace(place);
                                                setCustomLocation('');
                                                setIsManualSelection(false);
                                                setViewCenter({ lat: place.latitude, lng: place.longitude });
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

                        {/* Lugar Personalizado */}
                        <div className="bg-surface-highlight/20 p-4 rounded-xl border border-surface-highlight">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="custom-loc-check"
                                    checked={isManualSelection || !!customLocation}
                                    onChange={() => {
                                        if (isManualSelection) {
                                            setIsManualSelection(false);
                                            setCustomLocation('');
                                        } else {
                                            setIsManualSelection(true);
                                        }
                                        setSelectedPlace(null);
                                    }}
                                    className="w-4 h-4 rounded border-surface-highlight text-primary-500 focus:ring-primary-500"
                                />
                                <label htmlFor="custom-loc-check" className="text-xs font-bold text-text-primary cursor-pointer">
                                    {t('appointment.custom_location_check')}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={customLocation}
                                onChange={e => {
                                    setCustomLocation(e.target.value);
                                    setSelectedPlace(null);
                                    if (!isManualSelection) setIsManualSelection(true);
                                }}
                                placeholder={t('appointment.custom_location_placeholder')}
                                className="w-full bg-background border border-surface-highlight rounded-lg p-3 text-text-primary text-sm focus:border-primary-500 outline-none shadow-inner"
                            />
                            <p className="text-[10px] text-text-secondary mt-2 italic">
                                💡 Puedes mover el marcador azul en el mapa para mayor precisión.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-surface-highlight bg-surface-highlight/30 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm font-medium transition"
                    >
                        {t('appointment.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!date || !time || (!selectedPlace && !customLocation)}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {initialAppointment ? 'Actualizar Cita' : t('appointment.submit')}
                    </button>
                </div>
            </div>
        </div>
    )
}
