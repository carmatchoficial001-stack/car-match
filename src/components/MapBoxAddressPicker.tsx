"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapBoxAddressPickerProps {
    latitude: number | null
    longitude: number | null
    onLocationSelect: (lat: number, lng: number) => void
    viewCenter?: { lat: number, lng: number } | null
    markerColor?: string
    markerEmoji?: string
    showMarker?: boolean
}

export default function MapBoxAddressPicker({
    latitude,
    longitude,
    onLocationSelect,
    viewCenter,
    markerColor = '#ef4444',
    markerEmoji = '🔧',
    showMarker = true
}: MapBoxAddressPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Fallback temporal: Monterrey (mientras se obtiene ubicación del usuario)
    const DEFAULT_LAT = 25.6866
    const DEFAULT_LNG = -100.3161

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) {
            console.error('Mapbox token missing')
            setMapLoaded(true) // Prevent eternal loading
            return
        }
        mapboxgl.accessToken = token

        // 📍 OBTENER UBICACIÓN DEL USUARIO PRIMERO (si no hay coordenadas específicas)
        if (!latitude && !longitude && navigator.geolocation) {
            console.log("🌍 Obteniendo ubicación del usuario para inicializar mapa...")
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    // Una vez obtenida la ubicación, actualizar viewCenter
                    const userLat = pos.coords.latitude
                    const userLng = pos.coords.longitude
                    console.log("✅ Ubicación obtenida:", userLat, userLng)

                    // Inicializar mapa con ubicación real del usuario
                    initializeMap(userLng, userLat)
                },
                (err) => {
                    console.warn("⚠️ No se pudo obtener ubicación GPS, usando fallback:", err)
                    // Si falla, usar Monterrey como fallback
                    initializeMap(DEFAULT_LNG, DEFAULT_LAT)
                },
                { enableHighAccuracy: true, timeout: 5000 }
            )
        } else {
            // Si ya hay coordenadas, usar esas
            const centerLat = latitude || viewCenter?.lat || DEFAULT_LAT
            const centerLng = longitude || viewCenter?.lng || DEFAULT_LNG
            initializeMap(centerLng, centerLat)
        }

        function initializeMap(lng: number, lat: number) {
            console.log("🗺️ Inicializando mapa en:", lat, lng)

            const newMap = new mapboxgl.Map({
                container: mapContainer.current!,
                style: 'mapbox://styles/mapbox/outdoors-v12',
                center: [lng, lat],
                zoom: 15,
                pitch: 0,
            })

            newMap.addControl(new mapboxgl.NavigationControl(), 'top-right')

            const geolocateControl = new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
                showUserLocation: false, // 🚫 Hide blue dot (User request)
                showAccuracyCircle: false
            })

            geolocateControl.on('geolocate', (e: any) => {
                const { latitude, longitude } = e.coords
                onLocationSelect(latitude, longitude)
            })

            newMap.addControl(geolocateControl, 'top-right')

            // Events
            newMap.on('load', () => {
                console.log("✅ Mapa cargado correctamente")

                // 🧹 Clean Map: Hide POIs
                const layers = newMap.getStyle().layers
                if (layers) {
                    layers.forEach((layer) => {
                        if (layer.id.includes('poi-label')) {
                            newMap.setLayoutProperty(layer.id, 'visibility', 'none')
                        }
                    })
                }

                setMapLoaded(true)
                newMap.resize()
            })

            // Safety net: Force loaded state after 1.5 seconds
            setTimeout(() => {
                setMapLoaded(true)
                if (map.current) {
                    map.current.resize()
                }
            }, 1500)

            newMap.on('click', (e) => {
                onLocationSelect(e.lngLat.lat, e.lngLat.lng)
            })

            map.current = newMap

            // Resize observer
            const resizeObserver = new ResizeObserver(() => {
                if (map.current) {
                    map.current.resize()
                }
            })
            resizeObserver.observe(mapContainer.current!)

                // Cleanup guardado para el return del useEffect principal
                ; (window as any).__mapCleanup = () => {
                    resizeObserver.disconnect()
                    if (map.current) {
                        map.current.remove()
                        map.current = null
                    }
                }
        }

        return () => {
            if ((window as any).__mapCleanup) {
                (window as any).__mapCleanup()
            }
        }
    }, [])

    // Fly to new location
    useEffect(() => {
        if (!map.current) return
        if (viewCenter) {
            map.current.flyTo({
                center: [viewCenter.lng, viewCenter.lat],
                zoom: 16,
                essential: true
            })
        }
    }, [viewCenter])

    // Update Marker
    useEffect(() => {
        if (!map.current) return

        if (showMarker && latitude && longitude) {
            // Remove existing marker
            if (marker.current) {
                marker.current.remove()
                marker.current = null
            }

            // Create marker container
            const el = document.createElement('div')
            el.className = 'picker-marker-custom'
            el.style.position = 'relative'
            el.style.width = '40px'
            el.style.height = '50px'
            el.style.cursor = 'grab'

            // SVG Pin Shape (using data URI like MapStore)
            el.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="position: absolute; width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                    <path fill="${markerColor}" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
                </svg>
            `

            const newMarker = new mapboxgl.Marker({
                element: el,
                draggable: true,
                anchor: 'bottom'
            })
                .setLngLat([longitude, latitude])
                .addTo(map.current)

            newMarker.on('dragend', () => {
                const lngLat = newMarker.getLngLat()
                onLocationSelect(lngLat.lat, lngLat.lng)
            })

            marker.current = newMarker

        } else {
            if (marker.current) {
                marker.current.remove()
                marker.current = null
            }
        }
    }, [latitude, longitude, onLocationSelect, markerColor, markerEmoji, showMarker])

    return (
        <div
            className="w-full relative rounded-xl overflow-hidden border border-surface-highlight shadow-sm bg-gray-200"
            style={{ height: '400px', minHeight: '400px' }}
        >
            <div ref={mapContainer} className="w-full h-full" />

            {/* Loading Overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-600">Cargando mapa...</span>
                    </div>
                </div>
            )}
        </div>
    )
}
