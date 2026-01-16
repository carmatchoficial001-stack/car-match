'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Phone, AlertTriangle, MapPin } from 'lucide-react'
import Header from '@/components/Header'

interface LocationData {
    id: string
    name: string
    lat: number | null
    lng: number | null
    lastUpdate: string | null
}

interface SOSData {
    alertId: string
    status: string
    victim: LocationData
    counterpart: LocationData | null
    createdAt: string
}

export default function EmergencyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session, status } = useSession()
    const router = useRouter()
    const [sosData, setSOSData] = useState<SOSData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const victimMarker = useRef<mapboxgl.Marker | null>(null)
    const counterpartMarker = useRef<mapboxgl.Marker | null>(null)

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/auth')
            return
        }

        fetchSOSData()
        const interval = setInterval(fetchSOSData, 10000) // Actualizar cada 10s

        return () => clearInterval(interval)
    }, [session, status, id])

    const fetchSOSData = async () => {
        try {
            const res = await fetch(`/api/sos/${id}/locations`)
            if (res.ok) {
                const data = await res.json()
                setSOSData(data)
                setLoading(false)
                updateMap(data)
            } else {
                setError('No se pudo cargar la alerta SOS')
                setLoading(false)
            }
        } catch (e) {
            console.error(e)
            setError('Error de conexión')
            setLoading(false)
        }
    }

    const updateMap = (data: SOSData) => {
        if (!mapContainer.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return

        // Inicializar mapa si no existe
        if (!map.current) {
            mapboxgl.accessToken = token
            const centerLat = data.victim.lat || 0
            const centerLng = data.victim.lng || 0

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [centerLng, centerLat],
                zoom: 14
            })

            map.current.addControl(new mapboxgl.NavigationControl())
        }

        // Actualizar marcador de la víctima
        if (data.victim.lat && data.victim.lng) {
            if (victimMarker.current) {
                victimMarker.current.setLngLat([data.victim.lng, data.victim.lat])
            } else {
                const el = document.createElement('div')
                el.className = 'w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse'
                el.innerHTML = '🆘'

                victimMarker.current = new mapboxgl.Marker(el)
                    .setLngLat([data.victim.lng, data.victim.lat])
                    .setPopup(new mapboxgl.Popup().setHTML(`<strong class="text-red-600">Víctima: ${data.victim.name}</strong>`))
                    .addTo(map.current!)
            }
        }

        // Actualizar marcador de la contraparte
        if (data.counterpart?.lat && data.counterpart?.lng) {
            if (counterpartMarker.current) {
                counterpartMarker.current.setLngLat([data.counterpart.lng, data.counterpart.lat])
            } else {
                const el = document.createElement('div')
                el.className = 'w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center'
                el.innerHTML = '👤'

                counterpartMarker.current = new mapboxgl.Marker(el)
                    .setLngLat([data.counterpart.lng, data.counterpart.lat])
                    .setPopup(new mapboxgl.Popup().setHTML(`<strong class="text-blue-600">Contraparte: ${data.counterpart.name}</strong>`))
                    .addTo(map.current!)
            }
        }

        // Ajustar el mapa para mostrar ambos puntos
        if (data.victim.lat && data.victim.lng && data.counterpart?.lat && data.counterpart?.lng) {
            const bounds = new mapboxgl.LngLatBounds()
            bounds.extend([data.victim.lng, data.victim.lat])
            bounds.extend([data.counterpart.lng, data.counterpart.lat])
            map.current!.fitBounds(bounds, { padding: 100 })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-text-secondary">Cargando alerta de emergencia...</p>
                </div>
            </div>
        )
    }

    if (error || !sosData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <p className="text-text-primary font-bold text-xl mb-2">Error</p>
                    <p className="text-text-secondary">{error || 'No se encontró la alerta'}</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background">
                {/* Banner de Emergencia */}
                <div className="bg-red-600 text-white p-4 flex items-center justify-between shadow-lg animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8" />
                        <div>
                            <h1 className="font-bold text-lg">🚨 ALERTA SOS ACTIVA</h1>
                            <p className="text-xs opacity-90">Rastreo en tiempo real - Actualización cada 10s</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.open('tel:911')}
                        className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition"
                    >
                        <Phone className="w-5 h-5" />
                        911
                    </button>
                </div>

                {/* Mapa en Pantalla Completa */}
                <div ref={mapContainer} className="w-full h-[calc(100vh-200px)]" />

                {/* Panel de Información */}
                <div className="bg-surface border-t border-surface-highlight p-6">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
                        {/* Información de la Víctima */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                                <h3 className="font-bold text-red-600 uppercase">Víctima (Usuario que activó SOS)</h3>
                            </div>
                            <p className="font-bold text-lg mb-1">{sosData.victim.name}</p>
                            {sosData.victim.lat && sosData.victim.lng ? (
                                <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4" />
                                        <span className="font-mono">{sosData.victim.lat.toFixed(6)}, {sosData.victim.lng.toFixed(6)}</span>
                                    </div>
                                    <p className="text-xs">Última actualización: {sosData.victim.lastUpdate ? new Date(sosData.victim.lastUpdate).toLocaleString('es-MX') : 'N/A'}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Ubicación no disponible</p>
                            )}
                        </div>

                        {/* Información de la Contraparte */}
                        {sosData.counterpart && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    <h3 className="font-bold text-blue-600 uppercase">Contraparte (Otro Usuario)</h3>
                                </div>
                                <p className="font-bold text-lg mb-1">{sosData.counterpart.name}</p>
                                {sosData.counterpart.lat && sosData.counterpart.lng ? (
                                    <div className="text-sm text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="w-4 h-4" />
                                            <span className="font-mono">{sosData.counterpart.lat.toFixed(6)}, {sosData.counterpart.lng.toFixed(6)}</span>
                                        </div>
                                        <p className="text-xs">Última actualización: {sosData.counterpart.lastUpdate ? new Date(sosData.counterpart.lastUpdate).toLocaleString('es-MX') : 'N/A'}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Ubicación no disponible</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Información sobre el protocolo */}
                    <div className="max-w-6xl mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-sm text-yellow-800">
                            <strong>ℹ️ Información:</strong> Esta es una alerta de seguridad real. Las ubicaciones se actualizan automáticamente.
                            Si eres el contacto de confianza, contacta inmediatamente a las autoridades locales (911) con la información mostrada arriba.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
