'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import dynamic from 'next/dynamic'
import { ShieldAlert, Siren } from 'lucide-react'

// Dynamically import Mapbox to ensure client-side only
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface SOSComponentProps {
    isActive: boolean
    otherUserId: string
    onEndMeeting: () => void
    chatId: string
    activeAppointmentId?: string
    trustedContact?: {
        name: string
        phone: string
        relationship: string
    } | null
}

export default function SOSComponent({ isActive, otherUserId, onEndMeeting, chatId, activeAppointmentId, trustedContact }: SOSComponentProps) {
    const { t, locale } = useLanguage()
    const [sosCountdown, setSosCountdown] = useState<number | null>(null)
    const [showSOSModal, setShowSOSModal] = useState(false)
    const [checkInVisible, setCheckInVisible] = useState(false)
    const [checkInCount, setCheckInCount] = useState(0)
    const [otherUserLocation, setOtherUserLocation] = useState<any>(null)
    const [loadingLocation, setLoadingLocation] = useState(false)
    const checkInTimerRef = useRef<NodeJS.Timeout | null>(null)
    const autoCancelTimerRef = useRef<NodeJS.Timeout | null>(null)

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

        // Send immediately and then every 10s for real-time tracking
        sendLocation()
        const interval = setInterval(sendLocation, 10000)

        // Check-in timer (20 mins)
        const startCheckInTimer = () => {
            if (checkInTimerRef.current) clearInterval(checkInTimerRef.current)
            checkInTimerRef.current = setInterval(() => {
                setCheckInVisible(true)
                setCheckInCount(prev => prev + 1)

                // Auto-cancel if not answered in 5 minutes (user logic: "si no contesta en la primera... ya se quita")
                // Let's implement a timeout for the check-in
                if (autoCancelTimerRef.current) clearTimeout(autoCancelTimerRef.current)
                autoCancelTimerRef.current = setTimeout(() => {
                    if (checkInVisible) {
                        onEndMeeting() // This will end the meeting mode
                    }
                }, 5 * 60 * 1000)
            }, 20 * 60 * 1000)
        }

        startCheckInTimer()

        return () => {
            clearInterval(interval)
            if (checkInTimerRef.current) clearInterval(checkInTimerRef.current)
            if (autoCancelTimerRef.current) clearTimeout(autoCancelTimerRef.current)
        }
    }, [isActive, onEndMeeting])

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
            // Send SOS alert to backend (this would notify trusted contact)
            const sosResponse = await fetch(`/api/chats/${chatId}/sos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: activeAppointmentId,
                    latitude: 0, // Should get current
                    longitude: 0
                })
            })

            if (sosResponse.ok) {
                const sosData = await sosResponse.json()
                // Redirigir a la página de emergencia en tiempo real
                if (sosData.alertId) {
                    window.location.href = `/emergency/${sosData.alertId}`
                }
            }

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
                    <ShieldAlert className="w-6 h-6" />
                    <div>
                        <p className="font-bold text-sm md:text-base">{t('sos.banner_title')}</p>
                        <p className="text-xs opacity-90 hidden md:block">{t('sos.banner_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEndMeeting}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition"
                    >
                        {t('sos.end_meeting')}
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
                        {sosCountdown !== null ? `${t('sos.cancel')} (${sosCountdown})` : t('sos.btn')}
                    </button>
                </div>
            </div>

            {/* Check-in Modal - Every 20 mins */}
            {checkInVisible && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-surface p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-surface-highlight">
                        <div className="flex justify-center mb-4 text-primary-500">
                            <Siren className="w-16 h-16 animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">{t('sos.checkin_title')}</h3>
                        <p className="text-text-secondary mb-6 italic text-sm">{t('sos.checkin_subtitle')}</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setCheckInVisible(false);
                                    if (autoCancelTimerRef.current) clearTimeout(autoCancelTimerRef.current);
                                }}
                                className="w-full p-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                            >
                                {t('sos.checkin_ok')}
                            </button>
                            <button
                                onClick={() => {
                                    setCheckInVisible(false);
                                    onEndMeeting();
                                }}
                                className="w-full p-4 bg-surface-highlight text-text-primary rounded-xl font-bold hover:bg-surface-highlight/80 transition-all"
                            >
                                {t('sos.checkin_finished')}
                            </button>
                            <button
                                onClick={() => {
                                    setCheckInVisible(false);
                                    triggerSOS();
                                }}
                                className="w-full p-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {t('sos.checkin_emergency')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SOS Modal with Map */}
            {showSOSModal && (
                <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-red-600 p-4 text-white flex justify-between items-center">
                            <h2 className="font-bold text-xl flex items-center gap-2">
                                {t('sos.emergency_modal_title')}
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
                                        name={otherUserLocation.name || 'Contraparte'}
                                        lastUpdate={otherUserLocation.lastLocationUpdate}
                                        locale={locale}
                                    />
                                    {/* Overlay con la ubicación propia también sería ideal */}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 text-center text-gray-500">
                                    <p>{t('sos.location_not_found')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white border-t space-y-4">
                            {trustedContact && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">{t('sos.trusted_contact_notified')}</p>
                                        <p className="font-bold text-blue-900 text-sm">{trustedContact.name} ({trustedContact.relationship})</p>
                                    </div>
                                    <a href={`tel:${trustedContact.phone}`} className="p-2 bg-blue-600 text-white rounded-full">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                                    </a>
                                </div>
                            )}

                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                <h3 className="font-bold text-red-800 text-sm mb-2 uppercase">{t('sos.authorities_info')}</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                    <div>
                                        <span className="text-gray-500">{t('sos.counterpart')}:</span>
                                        <span className="font-bold block">{otherUserLocation?.name || t('common.loading')}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('sos.tracking_id')}:</span>
                                        <span className="font-mono block truncate">{chatId}</span>
                                    </div>
                                    {otherUserLocation?.lastLatitude && (
                                        <div className="col-span-2 mt-1">
                                            <span className="text-gray-500 block">{t('sos.coordinates')}:</span>
                                            <span className="font-mono font-bold text-red-600">
                                                {otherUserLocation.lastLatitude.toFixed(6)}, {otherUserLocation.lastLongitude.toFixed(6)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => window.open('tel:911')}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg flex items-center justify-center gap-2 animate-pulse"
                            >
                                {t('sos.call_911')}
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
        el.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-red-600 animate-pulse"><circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.3"/><circle cx="12" cy="12" r="6" fill="currentColor" stroke="white" stroke-width="2"/></svg>'

        const formattedDate = lastUpdate ? new Date(lastUpdate).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US') : 'Ubicación actual'

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

        map.current = newMap

        return () => {
            newMap.remove()
        }
    }, [lat, lng, name, lastUpdate, locale])

    return <div ref={mapContainer} className="w-full h-full" />
}
