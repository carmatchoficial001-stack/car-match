"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getUserLocation, reverseGeocode, LocationData } from '@/lib/geolocation'

interface LocationContextType {
    location: LocationData | null
    loading: boolean
    error: string | null
    manualLocation: LocationData | null
    setManualLocation: (data: LocationData | null) => void
    refreshLocation: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

/**
 * Provider de ubicación GPS en tiempo real
 * Implementa fallback: GPS → Manual
 */
export function LocationProvider({
    children
}: {
    children: React.ReactNode
}) {
    const [location, setLocation] = useState<LocationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [manualLocation, setManualLocationState] = useState<LocationData | null>(null)

    // Persistencia: Guardar ubicación manual
    const setManualLocation = (data: LocationData | null) => {
        setManualLocationState(data)
        if (data) setError(null) // 🔥 Limpiar error si el usuario selecciona una ubicación válida
        if (typeof window !== 'undefined') {
            if (data) localStorage.setItem('carmatch_manual_location', JSON.stringify(data))
            else localStorage.removeItem('carmatch_manual_location')
        }
    }

    const fetchLocation = async (isManualRefresh = false) => {
        setLoading(true)
        setError(null)

        try {
            // 1. Intentar obtener GPS del navegador
            const coords = await getUserLocation()

            // 2. Convertir coordenadas a ciudad
            const locationData = await reverseGeocode(coords.latitude, coords.longitude)

            setLocation(locationData)

            // Si el usuario pidió detectar manualmente, limpiamos la selección manual previa
            // para que la ubicación real tome precedencia
            if (isManualRefresh && locationData) {
                setManualLocation(null)
            }

            // Cache para rapidez en siguiente sesión
            if (typeof window !== 'undefined') {
                localStorage.setItem('carmatch_last_detected_location', JSON.stringify(locationData))
            }
            setError(null)
        } catch (err) {
            console.warn('GPS no disponible:', err)
            setError(err instanceof Error ? err.message : 'Error de ubicación')

            // Si no hay GPS y no hay manual, mantenemos el error para el Gate
            setLocation(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Cargar persistencia antes de buscar nueva
        if (typeof window !== 'undefined') {
            const savedManual = localStorage.getItem('carmatch_manual_location')
            const savedDetected = localStorage.getItem('carmatch_last_detected_location')

            if (savedManual) {
                try {
                    const parsed = JSON.parse(savedManual)
                    setManualLocationState(parsed)
                } catch (e) {
                    console.error('Error parsing manual location', e)
                }
            } else if (savedDetected) {
                try {
                    const parsed = JSON.parse(savedDetected)
                    setLocation(parsed)
                } catch (e) {
                    console.error('Error parsing detected location', e)
                }
            }
        }
        fetchLocation(false)
    }, [])

    // Si el usuario selecciona manualmente una ciudad, usar esa
    const effectiveLocation = manualLocation || location

    return (
        <LocationContext.Provider
            value={{
                location: effectiveLocation,
                loading,
                error,
                manualLocation,
                setManualLocation,
                refreshLocation: () => fetchLocation(true),
            }}
        >
            {children}
        </LocationContext.Provider>
    )
}

/**
 * Hook para acceder al contexto de ubicación
 */
export function useLocation() {
    const context = useContext(LocationContext)
    if (context === undefined) {
        throw new Error('useLocation debe usarse dentro de LocationProvider')
    }
    return context
}
