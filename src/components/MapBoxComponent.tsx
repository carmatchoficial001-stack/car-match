// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getUserLocation } from '@/lib/geolocation'

interface MapBoxComponentProps {
    selectedCategories: string[]
    selectedServices: string[]
    categories: Array<{
        id: string
        name: string
        color: string
        icon: string
        services: string[]
    }>
}

export default function MapBoxComponent({
    selectedCategories,
    selectedServices,
    categories
}: MapBoxComponentProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const userMarker = useRef<mapboxgl.Marker | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState<string | null>(null)

    // Inicializar mapa
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

        if (!mapboxToken) {
            setLocationError('Token de MapBox no configurado')
            return
        }

        mapboxgl.accessToken = mapboxToken

        // Detectar ubicación del usuario
        getUserLocation()
            .then(coords => {
                setUserLocation({ lat: coords.latitude, lng: coords.longitude })

                // 💰 OPTIMIZACIÓN DE COSTOS MAPBOX
                const newMap = new mapboxgl.Map({
                    container: mapContainer.current!,
                    style: 'mapbox://styles/mapbox/outdoors-v12',
                    center: [coords.longitude, coords.latitude],
                    zoom: 12, // Mantenemos 12 aquí porque mostramos ubicación exacta del usuario
                    pitch: 45,
                    // 💰 CACHÉ AGRESIVO: Reduce llamadas a tiles API
                    minTileCacheSize: 500,
                    maxTileCacheSize: 1000,
                    refreshExpiredTiles: false, // 💰 NO recargar tiles expirados
                    preserveDrawingBuffer: true,
                })

                // Agregar controles
                newMap.addControl(new mapboxgl.NavigationControl(), 'top-right')
                newMap.addControl(
                    new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true
                        },
                        trackUserLocation: true,
                        showUserHeading: true
                    }),
                    'top-right'
                )

                // Marcador del usuario (punto azul pulsante)
                const userEl = document.createElement('div')
                userEl.className = 'user-location-marker'
                userEl.style.width = '20px'
                userEl.style.height = '20px'
                userEl.style.borderRadius = '50%'
                userEl.style.backgroundColor = '#3B82F6'
                userEl.style.border = '3px solid white'
                userEl.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)'
                userEl.style.animation = 'pulse 2s infinite'

                userMarker.current = new mapboxgl.Marker(userEl)
                    .setLngLat([coords.longitude, coords.latitude])
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 })
                            .setHTML(`
                                <div style="padding: 8px;">
                                    <p style="margin: 0; font-weight: bold; color: #1F2937;">📍 Tu ubicación</p>
                                </div>
                            `)
                    )
                    .addTo(newMap)

                newMap.on('load', () => {
                    setMapLoaded(true)
                })

                map.current = newMap

            })
            .catch(error => {
                console.error('Error obteniendo ubicación:', error)
                setLocationError('No se pudo obtener tu ubicación GPS')

                // 💰 Crear mapa con ubicación por defecto (Monterrey) - OPTIMIZADO
                const newMap = new mapboxgl.Map({
                    container: mapContainer.current!,
                    style: 'mapbox://styles/mapbox/outdoors-v12',
                    center: [-100.3161, 25.6866], // Monterrey
                    zoom: 11,
                    pitch: 45,
                    // 💰 CACHÉ AGRESIVO
                    minTileCacheSize: 500,
                    maxTileCacheSize: 1000,
                    refreshExpiredTiles: false,
                    preserveDrawingBuffer: true,
                })

                newMap.addControl(new mapboxgl.NavigationControl(), 'top-right')
                newMap.addControl(
                    new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true
                        },
                        trackUserLocation: true,
                        showUserHeading: true
                    }),
                    'top-right'
                )

                map.current = newMap
            })

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove()
                map.current = null
            }
        }
    }, [])

    // Cargar negocios reales desde la API
    useEffect(() => {
        if (!map.current || !mapLoaded || !userLocation) return

        const fetchBusinesses = async () => {
            try {
                // Construir URL con parámetros
                const params = new URLSearchParams({
                    lat: userLocation.lat.toString(),
                    lng: userLocation.lng.toString(),
                    radius: '20' // 20km radio
                })

                // Si hay categorías seleccionadas, podríamos filtrar aquí o en cliente
                // Por ahora traemos todos los cercanos y filtramos visualmente

                const res = await fetch(`/api/businesses/nearby?${params}`)
                if (!res.ok) return

                const data = await res.json()
                const businesses = data.businesses || []

                // Remover marcadores existentes
                const markers = document.querySelectorAll('.business-marker')
                markers.forEach(marker => marker.remove())

                // Agregar nuevos marcadores
                businesses.forEach((business: any) => {
                    const category = categories.find(c => c.id === business.category)
                    // Fallback si la categoría no coincide exactamente o es nueva
                    const markerColor = category ? category.color : '#6B7280'
                    const markerIcon = category ? category.icon : '🏬'
                    const categoryName = category ? category.name : business.category

                    // Filtrado cliente: Solo mostrar si la categoría está seleccionada o no hay filtros
                    if (selectedCategories.length > 0 && !selectedCategories.includes(business.category)) {
                        return
                    }

                    // Crear elemento del marcador
                    const el = document.createElement('div')
                    el.className = 'business-marker'
                    el.style.width = '30px'
                    el.style.height = '30px'
                    el.style.borderRadius = '50%'
                    el.style.backgroundColor = markerColor
                    el.style.border = '3px solid white'
                    el.style.cursor = 'pointer'
                    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                    el.style.display = 'flex'
                    el.style.alignItems = 'center'
                    el.style.justifyContent = 'center'
                    el.style.fontSize = '14px'
                    el.textContent = markerIcon

                    // Popup del negocio
                    const popup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
                            <div style="padding: 12px; min-width: 200px;">
                                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1F2937; font-size: 14px;">
                                    ${markerIcon} ${business.name}
                                </p>
                                <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">
                                    ${categoryName}
                                </p>
                                ${business.description ? `
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4B5563; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${business.description}
                                </p>` : ''}
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #9CA3AF;">
                                        📍 ${business.address || 'Ubicación aproximada'}
                                    </p>
                                    ${business.phone ? `
                                    <a href="tel:${business.phone}" style="display: inline-block; margin-top: 4px; font-size: 12px; color: #3B82F6; text-decoration: none;">
                                        📞 Llamar
                                    </a>` : ''}
                                </div>
                            </div>
                        `)

                    new mapboxgl.Marker(el)
                        .setLngLat([business.longitude, business.latitude])
                        .setPopup(popup)
                        .addTo(map.current!)
                })

            } catch (error) {
                console.error('Error loading businesses:', error)
            }
        }

        fetchBusinesses()

    }, [mapLoaded, userLocation, selectedCategories, selectedServices, categories])

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />

            {/* Animación CSS para el pulso */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                    }
                    50% {
                        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                    }
                }
            `}</style>

            {/* Overlay de carga */}
            {!mapLoaded && (
                <div className="absolute inset-0 bg-surface/90 flex items-center justify-center rounded-2xl z-10">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-text-secondary">Cargando mapa...</p>
                    </div>
                </div>
            )}

            {/* Error de ubicación */}
            {locationError && (
                <div className="absolute top-4 left-4 right-4 bg-yellow-900/90 border border-yellow-700 rounded-lg p-3 z-20">
                    <p className="text-sm text-yellow-200">⚠️ {locationError}</p>
                    <p className="text-xs text-yellow-300 mt-1">Usa el botón de ubicación (arriba a la derecha) para activar GPS</p>
                </div>
            )}

            {/* Info de ubicación activa */}
            {userLocation && !locationError && (
                <div className="absolute bottom-4 left-4 bg-primary-700/90 backdrop-blur-sm rounded-lg px-4 py-2 z-20">
                    <p className="text-sm text-white font-medium">
                        📍 GPS Activo
                    </p>
                </div>
            )}
        </div>
    )
}
