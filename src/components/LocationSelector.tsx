"use client"

import { useLocation } from '@/contexts/LocationContext'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LocationSelectorProps {
    availableCities: string[]
    showRadiusControl?: boolean
}

/**
 * Componente de selección de ubicación
 * Muestra ubicación actual y permite cambio manual
 */
export default function LocationSelector({
    availableCities,
    showRadiusControl = false
}: LocationSelectorProps) {
    const { t } = useLanguage()
    const { location, loading, error, manualCity, setManualCity, refreshLocation } = useLocation()
    const [showCitySelector, setShowCitySelector] = useState(false)

    const currentCity = manualCity || location?.city || t('common.unknown_location')
    const isManual = manualCity !== null
    const isGPS = !isManual && location?.latitude !== 0

    return (
        <div className="bg-surface rounded-xl border border-surface-highlight p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Icono de ubicación */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isGPS ? 'bg-green-900/20' : 'bg-surface-highlight'
                        }`}>
                        <svg
                            className={`w-5 h-5 ${isGPS ? 'text-green-400' : 'text-text-secondary'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>

                    <div>
                        <p className="text-sm text-text-secondary">
                            {loading ? t('common.detecting_location') : isGPS ? t('common.gps_location') : isManual ? t('common.manual_location') : t('common.no_gps')}
                        </p>
                        <p className="font-bold text-text-primary">
                            {currentCity}
                        </p>
                        {error && !manualCity && (
                            <p className="text-xs text-red-400 mt-1">{error}</p>
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                    {/* Botón de actualizar GPS */}
                    {!isManual && (
                        <button
                            onClick={refreshLocation}
                            disabled={loading}
                            className="p-2 hover:bg-surface-highlight rounded-lg transition disabled:opacity-50"
                            title={t('common.refresh_gps')}
                        >
                            <svg
                                className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Botón de selección manual */}
                    <button
                        onClick={() => setShowCitySelector(!showCitySelector)}
                        className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-600 transition text-sm font-medium"
                    >
                        {t('common.change_city')}
                    </button>
                </div>
            </div>

            {/* Dropdown de selección de ciudad */}
            {showCitySelector && (
                <div className="mt-4 pt-4 border-t border-surface-highlight">
                    <p className="text-sm text-text-secondary mb-2">{t('common.select_city')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableCities.map((city) => (
                            <button
                                key={city}
                                onClick={() => {
                                    setManualCity(city)
                                    setShowCitySelector(false)
                                }}
                                className={`px-3 py-2 rounded-lg text-sm transition ${currentCity === city
                                    ? 'bg-primary-700 text-white font-medium'
                                    : 'bg-surface-highlight text-text-primary hover:bg-surface-highlight/80'
                                    }`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>

                    {/* Botón de volver a GPS */}
                    {isManual && (
                        <button
                            onClick={() => {
                                setManualCity(null)
                                setShowCitySelector(false)
                            }}
                            className="mt-3 w-full px-4 py-2 bg-surface-highlight text-text-primary rounded-lg hover:bg-surface transition text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('common.back_to_gps')}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

