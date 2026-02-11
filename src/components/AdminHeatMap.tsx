// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface IntelligenceData {
    searches: Array<{ latitude: number; longitude: number; category?: string; query?: string }>
    vehicles: Array<{ latitude: number; longitude: number; title: string }>
    businesses: Array<{ latitude: number; longitude: number; name: string; category: string }>
}

export default function AdminHeatMap({ data }: { data: IntelligenceData }) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    useEffect(() => {
        if (!mapContainer.current || map.current) return

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-100.3161, 25.6866], // MTY
            zoom: 10,
        })

        map.current.on('load', () => {
            setMapLoaded(true)
            if (map.current) map.current.resize()
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    useEffect(() => {
        if (!map.current || !mapLoaded || !data) return
        const m = map.current

        // 1. Demand Source (Searches)
        const demandGeojson = {
            type: 'FeatureCollection',
            features: data.searches.map(s => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
                properties: { weight: 1 }
            }))
        }

        if (m.getSource('demand')) {
            (m.getSource('demand') as mapboxgl.GeoJSONSource).setData(demandGeojson as any)
        } else {
            m.addSource('demand', { type: 'geojson', data: demandGeojson as any })
            m.addLayer({
                id: 'demand-heat',
                type: 'heatmap',
                source: 'demand',
                paint: {
                    'heatmap-weight': ['get', 'weight'],
                    'heatmap-intensity': 1,
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,0,255,0)',
                        0.2, 'rgba(0,255,255,0.5)',
                        0.4, 'rgba(0,255,0,0.6)',
                        0.6, 'rgba(255,255,0,0.7)',
                        1, 'rgba(255,0,0,0.8)'
                    ],
                    'heatmap-radius': 30,
                    'heatmap-opacity': 0.7
                }
            })
        }

        // 2. Supply Source (Businesses - Competition)
        const supplyGeojson = {
            type: 'FeatureCollection',
            features: data.businesses.map(b => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
                properties: { name: b.name, category: b.category }
            }))
        }

        if (m.getSource('supply')) {
            (m.getSource('supply') as mapboxgl.GeoJSONSource).setData(supplyGeojson as any)
        } else {
            m.addSource('supply', { type: 'geojson', data: supplyGeojson as any })
            m.addLayer({
                id: 'supply-points',
                type: 'circle',
                source: 'supply',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000'
                }
            })
        }
    }, [data, mapLoaded])

    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10">
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[10px] space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <span className="font-bold text-white uppercase tracking-tighter">Alta Demanda (Búsquedas)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                    <span className="font-bold text-white/60 uppercase tracking-tighter">Competencia (Negocios)</span>
                </div>
            </div>
        </div>
    )
}
