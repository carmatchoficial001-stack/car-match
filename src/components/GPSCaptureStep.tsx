// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿"use client"

import { useState, useEffect, useRef } from 'react'
import { getUserLocation, reverseGeocode } from '@/lib/geolocation'
import { useLanguage } from '@/contexts/LanguageContext'

interface Suggestion {
    latitude: number
    longitude: number
    address: string
    city: string
    state: string
    country: string
}

interface GPSCaptureStepProps {
    latitude: number | null
    longitude: number | null
    city: string
    onLocationChange: (lat: number, lng: number, city: string, state?: string, country?: string) => void
}

export default function GPSCaptureStep({
    latitude,
    longitude,
    city,
    onLocationChange
}: GPSCaptureStepProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Autocomplete states
    const [searchInput, setSearchInput] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const lastSelectedAddress = useRef<string>('')

    // Handle clicking outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Real-time search effectively debounced by user typing speed naturally or we can add a small timeout
    useEffect(() => {
        // Skip search if input is empty, too short, or matches the last selected address
        if (!searchInput || searchInput.length <= 2 || searchInput === lastSelectedAddress.current) {
            if (!searchInput || searchInput.length <= 2) {
                setSuggestions([])
                setShowSuggestions(false)
            }
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/geolocation?q=${encodeURIComponent(searchInput)}&limit=5`)
                if (res.ok) {
                    const data = await res.json()
                    setSuggestions(Array.isArray(data) ? data : [data])
                    setShowSuggestions(true)
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err)
            } finally {
                setIsSearching(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchInput])

    const handleSelectSuggestion = (s: Suggestion) => {
        lastSelectedAddress.current = s.address
        setSearchInput(s.address)
        onLocationChange(s.latitude, s.longitude, s.city, s.state, s.country)
        setShowSuggestions(false)
        setSuggestions([])
    }

    const detectLocation = async () => {
        setLoading(true)
        setError(null)

        try {
            // Obtener coordenadas GPS
            const coords = await getUserLocation()

            // Convertir a ciudad
            const locationData = await reverseGeocode(coords.latitude, coords.longitude)
            const detectedCity = locationData.city || t('publish.location.unknown')

            onLocationChange(coords.latitude, coords.longitude, detectedCity, locationData.state, locationData.country)
        } catch (err) {
            console.error('Error detectando ubicación:', err)
            setError(t('publish.location.error_gps'))
        } finally {
            setLoading(false)
        }
    }



    const hasLocation = latitude !== null && longitude !== null && city

    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">{t('publish.location.title')}</h2>
                <p className="text-text-secondary">
                    {t('publish.location.subtitle')}
                </p>
            </div>

            {/* Botón GPS */}
            <div className="bg-surface border border-surface-highlight rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-700/10 rounded-lg">
                        <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">{t('publish.location.auto_title')}</h3>
                        <p className="text-sm text-text-secondary mb-4">
                            {t('publish.location.auto_desc')}
                        </p>
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={loading}
                            className="px-6 py-3 bg-primary-700 text-text-primary rounded-lg hover:bg-primary-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('publish.location.detecting')}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    {t('publish.location.get_location')}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Ubicación detectada */}
                {hasLocation && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm text-green-400 font-medium">{t('publish.location.success')}</p>
                            <p className="text-sm text-text-secondary mt-1">📍 {city}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Separador */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-highlight"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 bg-background text-text-secondary text-sm">{t('publish.location.manual_or')}</span>
                </div>
            </div>

            {/* Buscador Autocomplete */}
            <div className="bg-surface border border-surface-highlight rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-2">{t('publish.location.search_title')}</h3>
                <p className="text-sm text-text-secondary mb-4">{t('publish.location.search_desc')}</p>

                <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => searchInput.length > 2 && setShowSuggestions(true)}
                            placeholder={t('publish.location.search_placeholder')}
                            className="w-full pl-11 pr-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:outline-none focus:border-primary-700 transition"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {isSearching ? (
                                <div className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-surface border border-surface-highlight rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full px-4 py-3 text-left hover:bg-surface-highlight transition flex items-start gap-3 border-b border-surface-highlight last:border-0"
                                >
                                    <span className="text-xl mt-0.5">📍</span>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{s.address}</p>
                                        <p className="text-xs text-text-secondary">{s.city}, {s.state}, {s.country}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
