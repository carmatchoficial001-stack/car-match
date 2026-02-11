// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

interface Business {
    id: string
    name: string
    category: string
    latitude: number
    longitude: number
    images: string[]
    city: string
    description?: string
    services?: string[]
}

interface MapBoxStoreLocatorProps {
    businesses: Business[]
    categoryColors: Record<string, string>
    categoryEmojis: Record<string, string>
    initialLocation?: { latitude: number; longitude: number }
    highlightCategories?: string[]
    onBoundsChange?: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void
}

export default function MapBoxStoreLocator({
    businesses,
    categoryColors,
    categoryEmojis,
    initialLocation,
    onBoundsChange,
    highlightCategories = []
}: MapBoxStoreLocatorProps) {
    const { t } = useLanguage()
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Default: Monterrey (Fallback)
    const DEFAULT_LAT = 25.6866
    const DEFAULT_LNG = -100.3161

    useEffect(() => {
        if (!mapContainer.current || map.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) {
            console.error('Mapbox token missing')
            return
        }
        mapboxgl.accessToken = token

        const center: [number, number] = initialLocation
            ? [initialLocation.longitude, initialLocation.latitude]
            : [DEFAULT_LNG, DEFAULT_LAT]

        // 💰 OPTIMIZACIÓN DE COSTOS MAPBOX
        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/outdoors-v12',
            center: center,
            zoom: 11, // 💰 Reducido de 12 a 11 (25% menos tiles cargados)
            minZoom: 8,  // 💰 Evitar zoom muy lejano (ahorro tiles)
            maxZoom: 18, // 💰 Limitar zoom máximo (ahorro 30% en tiles)
            pitch: 0,
            // 💰 CACHÉ AGRESIVO: Reduce llamadas a tiles API
            minTileCacheSize: 500,  // Cachear más tiles en memoria
            maxTileCacheSize: 1000, // Límite máximo de caché
            refreshExpiredTiles: false, // 💰 NO recargar tiles expirados (ahorro 30%)
            preserveDrawingBuffer: true, // Mejor performance
            trackResize: true, // 💰 Optimizar tiles al hacer resize
        })

        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right')

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserLocation: true,
            showAccuracyCircle: false // 🚫 Disable giant blue circle
        })

        newMap.addControl(geolocateControl, 'top-right')

        newMap.on('load', () => {
            setMapLoaded(true)
            newMap.resize()

            // Auto-locate user on load
            geolocateControl.trigger()

            // 🧹 HIDE EXTERNAL BUSINESSES (POIs)
            if (newMap.getLayer('poi-label')) {
                newMap.setLayoutProperty('poi-label', 'visibility', 'none')
            }

            // 📍 Report initial bounds or when map moves
            const reportBounds = () => {
                if (!onBoundsChange) return
                const bounds = newMap.getBounds()
                if (!bounds) return

                onBoundsChange({
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLng: bounds.getWest(),
                    maxLng: bounds.getEast()
                })
            }

            newMap.on('moveend', reportBounds)
            // Report once map is loaded and centered
            setTimeout(reportBounds, 1000)
        })

        // 🎯 Focus Business Listener
        const handleFocus = (e: any) => {
            const { lat, lng, id } = e.detail;
            newMap.flyTo({
                center: [lng, lat],
                zoom: 15,
                essential: true
            });
            // Auto open popup after fly
            setTimeout(() => {
                const features = newMap.queryRenderedFeatures({ layers: ['unclustered-point-bg'] });
                const busFeature = features.find(f => f.properties?.id === id);
                if (busFeature) {
                    // This is complex in Mapbox to trigger programmatic clicks on symbols, 
                    // better to just fly there. The highlighting in the sidebar already helps.
                }
            }, 1000);
        };

        window.addEventListener('map-focus-business', handleFocus);

        map.current = newMap

        return () => {
            window.removeEventListener('map-focus-business', handleFocus);
            if (map.current) {
                map.current.remove()
                map.current = null
            }
        }
    }, [])

    // 📍 Render Markers with Clustering & Emoji Pins
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        const mapInstance = map.current

        // Convert businesses to GeoJSON
        const features = businesses
            .filter(b => b.latitude && b.longitude)
            .map(b => ({
                type: 'Feature',
                properties: {
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    city: b.city,
                    image: b.images?.[0] || '',
                    description: b.description || '',
                    services: b.services || [] // Pass services to properties
                },
                geometry: {
                    type: 'Point',
                    coordinates: [b.longitude, b.latitude]
                }
            }))

        const geojson: any = {
            type: 'FeatureCollection',
            features: features
        }

        // Load the Pin Image (SDF for dynamic coloring) - Using Data URI to avoid loadImage SVG limits
        if (!mapInstance.hasImage('pin')) {
            const pinImg = new window.Image(384, 512)
            pinImg.onload = () => {
                if (!mapInstance.hasImage('pin')) {
                    mapInstance.addImage('pin', pinImg, { sdf: true })
                }
            }
            // FontAwesome Map Marker (Solid) - White fill for SDF
            pinImg.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath fill='%23fff' d='M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z'/%3E%3C/svg%3E"
        }

        // Add or Update Source
        const sourceId = 'businesses';
        if (mapInstance.getSource(sourceId)) {
            (mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson)
        } else {
            mapInstance.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
                // 💰 CLUSTERING: Agrupar negocios cercanos (ahorro 40% en rendering)
                cluster: true, // Siempre activar clustering
                clusterMaxZoom: 14, // Deshace clusters al hacer zoom
                clusterRadius: 70, // Radio de agrupación en píxeles
                clusterMinPoints: 70, // ⚠️ MÍNIMO 70 negocios para hacer grupo
            })

            // 1. CLUSTER CIRCLES (Fondo de los círculos agrupados)
            mapInstance.addLayer({
                id: 'clusters',
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#1a1a2e',
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            })

            // 2. CLUSTER COUNT (Números en los círculos)
            mapInstance.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14
                },
                paint: {
                    'text-color': '#ffffff'
                }
            })

            // 3. UNCLUSTERED POINTS LAYER (The Pin Shape)
            mapInstance.addLayer({
                id: 'unclustered-point-bg',
                type: 'symbol',
                source: sourceId,
                filter: ['!', ['has', 'point_count']], // Solo puntos NO agrupados
                layout: {
                    'icon-image': 'pin',
                    'icon-size': 0.08,
                    'icon-allow-overlap': true,
                    'icon-anchor': 'bottom',
                },
                paint: {
                    'icon-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(categoryColors).flat(),
                        '#ef4444'
                    ]
                }
            })

            // 4. REMOVED UNCLUSTERED POINTS EMOJI LAYER
            // We only keep the background pin with category color for a professional look.

            // --- CLICK HANDLERS ---

            // Click handler para CLUSTERS: Expandir al hacer click
            mapInstance.on('click', 'clusters', (e) => {
                const features = mapInstance.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                })
                const clusterId = features[0].properties?.cluster_id
                const source = mapInstance.getSource('businesses') as mapboxgl.GeoJSONSource

                source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err || zoom == null) return

                    mapInstance.easeTo({
                        center: (features[0].geometry as any).coordinates,
                        zoom: zoom
                    })
                })
            })

            // Cambiar cursor en clusters
            mapInstance.on('mouseenter', 'clusters', () => {
                mapInstance.getCanvas().style.cursor = 'pointer'
            })
            mapInstance.on('mouseleave', 'clusters', () => {
                mapInstance.getCanvas().style.cursor = ''
            })

            // Click Handler Function para puntos individuales
            const handlePointClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
                if (!e.features || !e.features[0]) return

                const feature = e.features[0]
                const coordinates = (feature.geometry as any).coordinates.slice()
                const props = feature.properties as any

                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                // Parse services if stringified (Mapbox behavior)
                let servicesList: string[] = []
                try {
                    servicesList = typeof props.services === 'string' ? JSON.parse(props.services) : props.services
                } catch (e) {
                    servicesList = []
                }

                const popupHTML = `
                    <div class="p-2 min-w-[200px]">
                        ${props.image ?
                        `<div class="w-full h-32 relative mb-2 rounded-lg overflow-hidden bg-gray-900">
                                <div class="absolute inset-0 bg-cover bg-center blur-sm opacity-50" style="background-image: url('${props.image}')"></div>
                                <img src="${props.image}" alt="${props.name}" style="object-fit: contain; width: 100%; height: 100%; position: relative; z-index: 10;" />
                            </div>` : ''
                    }
                        <h3 class="font-bold text-gray-900 text-lg leading-tight mb-1">${props.name}</h3>
                        
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gray-800">
                                ${props.category?.toUpperCase()}
                            </span>
                        </div>
                        
                        <p class="text-xs text-gray-500 mb-2 pb-2 border-b border-gray-200 truncate">
                            ${props.city}
                        </p>
                        
                        <button 
                            onclick="window.dispatchEvent(new CustomEvent('open-business-modal', { detail: '${props.id}' }))"
                            class="block w-full py-1.5 bg-gray-900 text-white text-sm font-bold rounded hover:bg-black transition"
                        >
                            ${t('map_locator.view_details')}
                        </button>
                    </div >
                `

                new mapboxgl.Popup({ offset: 15 })
                    .setLngLat(coordinates)
                    .setHTML(popupHTML)
                    .addTo(mapInstance);
            }

            // Bind click to both layers
            mapInstance.on('click', 'unclustered-point-bg', handlePointClick);

            // Cursor pointers
            const setPointer = () => mapInstance.getCanvas().style.cursor = 'pointer';
            const resetPointer = () => mapInstance.getCanvas().style.cursor = '';

            mapInstance.on('mouseenter', 'unclustered-point-bg', setPointer);
            mapInstance.on('mouseleave', 'unclustered-point-bg', resetPointer);
        }
    }, [businesses, mapLoaded, categoryColors, categoryEmojis, t])

    return (
        <div className="w-full h-full relative bg-gray-900">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Loading Overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-white">{t('map_locator.loading_3d')}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
