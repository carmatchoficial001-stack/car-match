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
}

export default function MapBoxStoreLocator({
    businesses,
    categoryColors,
    categoryEmojis,
    initialLocation
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

        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/outdoors-v12', // Light Mode
            center: center,
            zoom: 12,
            pitch: 0, // Flat view
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
                cluster: false,
            })


            // 3. UNCLUSTERED POINTS LAYER (The Pin Shape)
            mapInstance.addLayer({
                id: 'unclustered-point-bg',
                type: 'symbol',
                source: sourceId,
                layout: {
                    'icon-image': 'pin',
                    'icon-size': 0.08, // SVG is large (384x512), scale down significantly. 512 * 0.08 = ~40px height
                    'icon-allow-overlap': true,
                    'icon-anchor': 'bottom', // Pin tip at the coordinate
                },
                paint: {
                    'icon-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(categoryColors).flat(),
                        '#ef4444' // Default Red
                    ]
                }
            })

            // 4. UNCLUSTERED POINTS LAYER (The Emoji on top)
            mapInstance.addLayer({
                id: 'unclustered-point-icon',
                type: 'symbol',
                source: sourceId,
                layout: {
                    'text-field': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(categoryEmojis).flat(),
                        '📍' // Default
                    ],
                    'text-size': 14,
                    'text-allow-overlap': true,
                    'text-anchor': 'bottom',
                    'text-offset': [0, -2.2] // Move up to sit in the pin head (approx 75% height)
                },
                paint: {
                    'text-color': '#ffffff' // White emoji/text for contrast on colored pin
                }
            })

            // --- CLICK HANDLERS ---


            // Click Handler Function
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
            mapInstance.on('click', 'unclustered-point-icon', handlePointClick);

            // Cursor pointers
            const setPointer = () => mapInstance.getCanvas().style.cursor = 'pointer';
            const resetPointer = () => mapInstance.getCanvas().style.cursor = '';


            mapInstance.on('mouseenter', 'unclustered-point-bg', setPointer);
            mapInstance.on('mouseleave', 'unclustered-point-bg', resetPointer);

            mapInstance.on('mouseenter', 'unclustered-point-icon', setPointer);
            mapInstance.on('mouseleave', 'unclustered-point-icon', resetPointer);
        }

    }, [businesses, mapLoaded, categoryColors, categoryEmojis, t]) // Added t dependency

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
