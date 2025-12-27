'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import dynamic from 'next/dynamic'

// Dynamically import Mapbox to ensure client-side only
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface SOSComponentProps {
    isActive: boolean
    otherUserId: string
    onEndMeeting: () => void
}

export default function SOSComponent({ isActive, otherUserId, onEndMeeting }: SOSComponentProps) {
    const { t, locale } = useLanguage()
    const [sosCountdown, setSosCountdown] = useState<number | null>(null)
    const [showSOSModal, setShowSOSModal] = useState(false)
    const [checkInVisible, setCheckInVisible] = useState(false)
    const [otherUserLocation, setOtherUserLocation] = useState<any>(null)
    const [loadingLocation, setLoadingLocation] = useState(false)
    const checkInTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Location Tracking Effect
    useEffect(() => {
        if (!isActive) return

        const sendLocation = () => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    await fetch('/api/user/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude
                        })
                    })
                } catch (e) {
                    console.error('Error sending location:', e)
                }
            })
        }

        // Send immediately and then every 30s
        sendLocation()
        const interval = setInterval(sendLocation, 30000)

        // Check-in timer (20 mins)
        checkInTimerRef.current = setInterval(() => {
            setCheckInVisible(true)
        }, 20 * 60 * 1000)
        // For demo purposes, maybe shorter? No, user said 20 mins.

        return () => {
            clearInterval(interval)
            if (checkInTimerRef.current) clearInterval(checkInTimerRef.current)
        }
    }, [isActive])

    // SOS Logic
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (sosCountdown !== null && sosCountdown > 0) {
            timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000)
        } else if (sosCountdown === 0) {
            triggerSOS()
        }
        return () => clearTimeout(timer)
    }, [sosCountdown])

    const startSOS = () => setSosCountdown(3)
    const cancelSOS = () => setSosCountdown(null)

    const triggerSOS = async () => {
        setSosCountdown(null)
        // 1. Trigger simulated 911 call
        window.open('tel:911')

        // 2. Open Modal and Fetch Data
        setShowSOSModal(true)
        setLoadingLocation(true)
        try {
            const res = await fetch(`/api/user/location?targetId=${otherUserId}`)
            if (res.ok) {
                const data = await res.json()
                setOtherUserLocation(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingLocation(false)
        }
    }

    if (!isActive) return null

    return (
        <>
            {/* Persistent Top Banner */}
            <div className="sticky top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 flex items-center justify-between z-40 shadow-lg animate-pulse-slow">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                        <p className="font-bold text-sm md:text-base">{t('safety_mode.active')}</p>
                        <p className="text-xs opacity-90 hidden md:block">{t('safety_mode.active_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEndMeeting}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition"
                    >
                        {t('safety_mode.end_btn')}
                    </button>
                    <button
                        onMouseDown={startSOS}
                        onMouseUp={cancelSOS}
                        onMouseLeave={cancelSOS}
                        onTouchStart={startSOS}
                        onTouchEnd={cancelSOS}
                        className={`px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 ${sosCountdown !== null ? 'bg-white text-red-600' : 'bg-red-800 hover:bg-red-900'
                            }`}
                    >
                        {sosCountdown !== null ? `CANCELAR (${sosCountdown})` : 'SOS'}
                    </button>
                </div>
            </div>

            {/* Check-in Modal */}
            {checkInVisible && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-surface p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-surface-highlight">
                        <div className="text-4xl mb-4">👮❓</div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">{t('safety_mode.check_in_title')}</h3>
                        <p className="text-text-secondary mb-6">{t('safety_mode.check_in_body')}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { setCheckInVisible(false); if (checkInTimerRef.current) { clearInterval(checkInTimerRef.current); checkInTimerRef.current = setInterval(() => setCheckInVisible(true), 20 * 60 * 1000) } }}
                                className="w-full p-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
                            >
                                {t('safety_mode.still_here')}
                            </button>
                            <button
                                onClick={() => { setCheckInVisible(false); startSOS(); }}
                                className="w-full p-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200"
                            >
                                {t('safety_mode.emergency')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SOS Modal with Map */}
            {showSOSModal && (
                <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-red-600 p-4 text-white flex justify-between items-center">
                            <h2 className="font-bold text-xl flex items-center gap-2">
                                🚨 EMERGENCIA - DATOS DEL USUARIO
                            </h2>
                            <button onClick={() => setShowSOSModal(false)} className="text-white/80 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 bg-gray-100 relative">
                            {loadingLocation ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full"></div>
                                </div>
                            ) : otherUserLocation?.lastLatitude ? (
                                <div className="w-full h-full relative">
                                    <SOSMap
                                        lat={otherUserLocation.lastLatitude}
                                        lng={otherUserLocation.lastLongitude}
                                        name={otherUserLocation.name || 'Usuario'}
                                        lastUpdate={otherUserLocation.lastLocationUpdate}
                                        locale={locale}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 text-center text-gray-500">
                                    <p>No se pudo obtener la ubicación en tiempo real del usuario.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white border-t space-y-4">
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                <h3 className="font-bold text-red-800 mb-2">COMPARTE ESTO CON LA POLICÍA (911):</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">Nombre:</span>
                                        <span className="font-bold">{otherUserLocation?.name || 'Desconocido'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">ID Usuario:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{otherUserLocation?.id || otherUserId}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block">Email:</span>
                                        <span className="font-bold">{otherUserLocation?.email || 'Desconocido'}</span>
                                    </div>
                                    {otherUserLocation?.lastLatitude && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 block">Coordenadas:</span>
                                            <span className="font-mono font-bold text-lg">
                                                {otherUserLocation.lastLatitude}, {otherUserLocation.lastLongitude}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => window.open('tel:911')}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg flex items-center justify-center gap-2 animate-pulse"
                            >
                                📞 REINTENTAR LLAMADA AL 911
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function SOSMap({ lat, lng, name, lastUpdate, locale }: { lat: number, lng: number, name: string, lastUpdate: string, locale: string }) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)

    // Extract formatting logic
    const formattedDate = new Date(lastUpdate).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')

    useEffect(() => {
        if (!mapContainer.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) return
        mapboxgl.accessToken = token

        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 15
        })

        // Add user marker
        const el = document.createElement('div')
        el.className = 'sos-marker'
        el.innerHTML = '<div style="font-size: 24px;">🚨</div>'

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div class="p-2">
                    <strong class="block text-red-600">Ubicación de ${name}</strong>
                    <span class="text-xs text-gray-500">${formattedDate}</span>
                </div>
            `)

        new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(newMap)
            .togglePopup()

        newMap.addControl(new mapboxgl.NavigationControl())

        // SOS Map MUST show reference points for safety

        map.current = newMap

        return () => {
            newMap.remove()
        }
    }, [lat, lng, name, lastUpdate, locale])

    return <div ref={mapContainer} className="w-full h-full" />
}
