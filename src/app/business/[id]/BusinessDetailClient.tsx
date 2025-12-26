'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import ShareButton from '@/components/ShareButton'
import { MapPin, Clock, Phone, Navigation, ArrowLeft, Star, ShieldCheck } from 'lucide-react'

interface BusinessDetailProps {
    business: {
        id: string
        name: string
        category: string
        description: string | null
        address: string
        phone: string | null
        hours: string | null
        latitude: number
        longitude: number
        images: string[]
        user: {
            name: string
            image: string | null
        }
    }
}

export default function BusinessDetailClient({ business }: BusinessDetailProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Lógica principal: Ver en Mapa
    const handleViewOnMap = () => {
        setLoading(true)

        // URL destino en el mapa (filtrada y centrada)
        const mapUrl = `/map?category=${business.category}&lat=${business.latitude}&lng=${business.longitude}&highlight=${business.id}`

        if (!session) {
            // Si no está logueado -> Login -> Callback a Mapa
            // Usamos encodeURIComponent para asegurar que los params pasen bien
            const callbackUrl = encodeURIComponent(mapUrl)
            router.push(`/auth?callbackUrl=${callbackUrl}`)
        } else {
            // Si ya está logueado -> Directo al Mapa
            router.push(mapUrl)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <div className="container mx-auto px-4 pt-6">
                {/* Back Button */}
                <Link href="/map" className="inline-flex items-center text-text-secondary hover:text-primary-400 mb-6 transition">
                    <ArrowLeft className="mr-2" size={20} />
                    Volver a MapStore
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Images & Visuals */}
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-surface rounded-2xl overflow-hidden border border-surface-highlight shadow-2xl group">
                            {business.images && business.images.length > 0 ? (
                                <Image
                                    src={business.images[0]}
                                    alt={business.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-text-secondary bg-surface-highlight/10">
                                    <MapPin size={48} className="mb-2 opacity-50" />
                                    <span className="text-lg">Sin imagen disponible</span>
                                </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                                    {business.category}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                    {business.name}
                                </h1>
                            </div>
                        </div>

                        {/* Quick Actions Mobile */}
                        <div className="flex gap-3 lg:hidden">
                            <button
                                onClick={handleViewOnMap}
                                className="flex-1 bg-primary-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20 active:scale-95 transition"
                            >
                                <Navigation size={20} />
                                Ver en Mapa
                            </button>
                            <ShareButton
                                title={business.name}
                                text={`¡Mira este negocio en CarMatch! ${business.name}`}
                                url={typeof window !== 'undefined' ? window.location.href : ''}
                                variant="minimal"
                                className="bg-surface border border-surface-highlight rounded-xl w-14 flex items-center justify-center"
                            />
                        </div>
                    </div>

                    {/* Right Column: Info & Details */}
                    <div className="flex flex-col space-y-6">

                        {/* Status Card */}
                        <div className="bg-surface border border-surface-highlight rounded-3xl p-6 shadow-xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-1">Información del Negocio</h2>
                                    <p className="text-sm text-text-secondary">Detalles públicos verificados</p>
                                </div>
                                <div className="hidden lg:block">
                                    <ShareButton
                                        title={business.name}
                                        text={`¡Mira este negocio en CarMatch! ${business.name}`}
                                        url={typeof window !== 'undefined' ? window.location.href : ''}
                                        variant="minimal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <InfoItem
                                    icon={<MapPin size={20} />}
                                    label="Dirección"
                                    value={business.address}
                                />

                                {business.hours && (
                                    <InfoItem
                                        icon={<Clock size={20} />}
                                        label="Horario"
                                        value={business.hours}
                                    />
                                )}

                                <div className="pt-4 border-t border-surface-highlight">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500 mt-1">
                                            <Phone size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-text-secondary mb-1">Contacto</p>
                                            {session ? (
                                                <p className="font-bold text-text-primary text-lg">
                                                    {business.phone || 'No disponible'}
                                                </p>
                                            ) : (
                                                <div className="bg-surface-highlight/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-sm text-text-secondary italic mb-2">
                                                        Inicia sesión para ver el número y contactar directamente.
                                                    </p>
                                                    <Link
                                                        href={`/auth?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                                                        className="text-primary-400 font-bold text-sm hover:underline"
                                                    >
                                                        Iniciar Sesión →
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {business.description && (
                            <div className="bg-surface border border-surface-highlight rounded-3xl p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-text-primary mb-3">Sobre nosotros</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                    {business.description}
                                </p>
                            </div>
                        )}

                        {/* CTA Desktop */}
                        <div className="hidden lg:block">
                            <button
                                onClick={handleViewOnMap}
                                disabled={loading}
                                className="w-full bg-primary-700 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-2xl hover:shadow-primary-600/20 active:scale-95"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Navigation size={24} />
                                        <span className="text-lg">Ver Ubicación en Mapa</span>
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-text-secondary mt-3">
                                {session ? 'Te llevaremos a MapStore para ver la ubicación exacta.' : 'Se requiere iniciar sesión para acceder al mapa interactivo.'}
                            </p>
                        </div>

                        {/* Owner Badge */}
                        <div className="flex items-center justify-center gap-2 text-text-secondary opacity-60 mt-4">
                            <ShieldCheck size={16} />
                            <span className="text-xs">Negocio registrado por {business.user.name}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="p-2 bg-surface-highlight rounded-lg text-primary-400 mt-1">
                {icon}
            </div>
            <div>
                <p className="text-sm text-text-secondary mb-1">{label}</p>
                <p className="font-medium text-text-primary leading-snug">{value}</p>
            </div>
        </div>
    )
}
