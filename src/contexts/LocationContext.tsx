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
    const [manualLocation, setManualLocation] = useState<LocationData | null>(null)

    const fetchLocation = async () => {
        setLoading(true)
        setError(null)

        try {
            // 1. Intentar obtener GPS del navegador
            const coords = await getUserLocation()

            // 2. Convertir coordenadas a ciudad
            const locationData = await reverseGeocode(coords.latitude, coords.longitude)

            setLocation(locationData)
            setError(null)
        } catch (err) {
            console.warn('GPS no disponible (Timeout/Permiso), usando modo manual:', err)
            // Si falla, mostramos el error para que el usuario sepa qué pasó (Timeout, etc)
            setError(err instanceof Error ? err.message : 'Error desconocido de ubicación')

            // Sin fallback - el usuario debe seleccionar manualmente
            setLocation(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLocation()
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
                refreshLocation: fetchLocation,
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
