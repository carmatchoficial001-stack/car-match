'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface SafePlace {
    id: number
    name: string
    address: string
    distance: number
    icon: string
}

interface AppointmentModalProps {
    onClose: () => void
    onSubmit: (data: any) => void
    chatId: string
}

export default function AppointmentModal({ onClose, onSubmit, chatId }: AppointmentModalProps) {
    const { t } = useLanguage()
    const [step, setStep] = useState(1)
    const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(true)

    // Form State
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null)
    const [customLocation, setCustomLocation] = useState('')

    useEffect(() => {
        fetch(`/api/chats/${chatId}/safe-places`)
            .then(res => res.json())
            .then(data => setSafePlaces(data.suggestions || []))
            .catch(err => console.error(err))
            .finally(() => setLoadingPlaces(false))
    }, [chatId])

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
            latitude: 0, // TODO: Añadir coords reales si estan disponibles
            longitude: 0
        })
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface border border-surface-highlight rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-surface-highlight flex justify-between items-center bg-surface-highlight/30 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-text-primary">{t('appointment.modal_title')}</h3>
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

                    {/* Selector de Lugar */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">{t('appointment.location_label')}</label>

                        {loadingPlaces ? (
                            <div className="text-center py-4 text-text-secondary text-sm">{t('appointment.loading_places')}</div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {safePlaces.map(place => (
                                    <div
                                        key={place.id}
                                        onClick={() => { setSelectedPlace(place); setCustomLocation('') }}
                                        className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${selectedPlace?.id === place.id
                                            ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500'
                                            : 'bg-background border-surface-highlight hover:border-primary-500/50'
                                            }`}
                                    >
                                        <div className="text-2xl">{place.icon}</div>
                                        <div className="flex-1">
                                            <div className="font-bold text-text-primary text-sm">{place.name}</div>
                                            <div className="text-xs text-text-secondary">{place.address} • {place.distance}km</div>
                                        </div>
                                        {selectedPlace?.id === place.id && (
                                            <div className="text-primary-500">✓</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-surface-highlight">
                            <label className="text-sm text-text-secondary flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={!selectedPlace && !!customLocation}
                                    onChange={() => setSelectedPlace(null)}
                                    className="accent-primary-500"
                                />
                                {t('appointment.custom_location_check')}
                            </label>
                            <input
                                type="text"
                                value={customLocation}
                                onChange={e => { setCustomLocation(e.target.value); setSelectedPlace(null) }}
                                placeholder={t('appointment.custom_location_placeholder')}
                                className="w-full bg-background border border-surface-highlight rounded-lg p-2.5 text-text-primary text-sm focus:border-primary-500 outline-none disabled:opacity-50"
                                disabled={selectedPlace !== null}
                            />
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
                        {t('appointment.submit')}
                    </button>
                </div>
            </div>
        </div>
    )
}
