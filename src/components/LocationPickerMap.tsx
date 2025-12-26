'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LocationPickerMapProps {
    latitude: number | null
    longitude: number | null
    viewCenter?: { lat: number; lng: number } | null
    onLocationSelect: (lat: number, lng: number) => void
}

export default function LocationPickerMap({ latitude, longitude, viewCenter, onLocationSelect }: LocationPickerMapProps) {
    const { t } = useLanguage()
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)

    // Initial Default: Monterrey (fallback)
    const DEFAULT_LAT = 25.6866
    const DEFAULT_LNG = -100.3161

    useEffect(() => {
        if (!mapContainer.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return
        mapboxgl.accessToken = token

        // Determine initial center
        const centerLat = latitude || viewCenter?.lat || DEFAULT_LAT
        const centerLng = longitude || viewCenter?.lng || DEFAULT_LNG

        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Use streets for better context
            center: [centerLng, centerLat],
            zoom: 14
        })

        newMap.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

        newMap.on('load', () => {
            if (newMap.getLayer('poi-label')) {
                newMap.setLayoutProperty('poi-label', 'visibility', 'none')
            }
        })

        // Click listener
        newMap.on('click', (e) => {
            onLocationSelect(e.lngLat.lat, e.lngLat.lng)
        })

        map.current = newMap

        return () => {
            newMap.remove()
        }
    }, []) // Run once on mount

    // Handle View Center updates (independent of marker)
    useEffect(() => {
        if (!map.current || !viewCenter) return

        // Only fly if we are far away? Or always?
        // Let's fly if user specifically requested a view change (via viewCenter prop)
        map.current.flyTo({
            center: [viewCenter.lng, viewCenter.lat],
            zoom: 14
        })
    }, [viewCenter])

    // Handle Marker Logic
    useEffect(() => {
        if (!map.current) return

        if (latitude && longitude) {
            // Update or create marker
            if (!marker.current) {
                const el = document.createElement('div')
                el.className = 'picker-marker-mapbox'
                el.innerHTML = `
                    <div style="color: #dc2626; font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                        📍
                    </div>
                `
                el.style.cursor = 'move'

                const newMarker = new mapboxgl.Marker({
                    element: el,
                    draggable: true
                })
                    .setLngLat([longitude, latitude])
                    .addTo(map.current)

                newMarker.on('dragend', () => {
                    const lngLat = newMarker.getLngLat()
                    onLocationSelect(lngLat.lat, lngLat.lng)
                })

                marker.current = newMarker
            } else {
                marker.current.setLngLat([longitude, latitude])
            }

            // Optional: recenter if marker is too far? 
            // Better not force it aggressively to avoid jumping while dragging, 
            // but for external ops it's fine.

        } else {
            // Remove marker if no location
            if (marker.current) {
                marker.current.remove()
                marker.current = null
            }
        }
    }, [latitude, longitude])

    return (
        <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-surface-highlight shadow-inner">
            <div ref={mapContainer} className="absolute inset-0 z-0" />
            <div className="absolute bottom-2 left-2 z-10 bg-white/90 px-2 py-1 rounded text-xs text-gray-600 shadow-sm pointer-events-none">
                Mapbox
            </div>
        </div>
    )
}
