'use client'

import Link from "next/link"
import Header from "@/components/Header"
import FavoriteButton from "@/components/FavoriteButton"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/vehicleTaxonomy"

interface FavoriteVehicle {
    vehicle: {
        id: string
        title: string
        price: number
        currency?: string | null
        city: string
        brand: string
        model: string
        year: number
        status: string
        images: string[] // Added images field
        user: {
            name: string
            image: string | null
        }
        _count: {
            favorites: number
        }
    }
}

export default function FavoritesClient({ favorites }: { favorites: FavoriteVehicle[] }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [removingId, setRemovingId] = useState<string | null>(null)

    const handleRemove = async (e: React.MouseEvent, vehicleId: string) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation()
        setRemovingId(vehicleId)

        try {
            const response = await fetch('/api/favorites', {
                method: 'POST', // Toggle endpoint, sending ID will remove it if it exists
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vehicleId })
            })

            if (response.ok) {
                router.refresh()
            }
        } catch (error) {
            console.error("Error removing favorite:", error)
        } finally {
            setRemovingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-8 pb-32">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">{t('favorites.title')}</h1>
                    <p className="text-text-secondary">
                        {t('favorites.subtitle').replace('{count}', favorites.length.toString())}
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="bg-surface rounded-2xl shadow-xl p-12 text-center border border-surface-highlight">
                        <div className="w-20 h-20 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-text-primary">
                            {t('favorites.empty_title')}
                        </h2>
                        <p className="text-text-secondary mb-8 max-w-md mx-auto">
                            {t('favorites.empty_text')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/swipe"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                {t('favorites.explore_carmatch')}
                            </Link>
                            <Link
                                href="/market"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-surface-highlight text-text-primary rounded-lg hover:border-primary-500 transition font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {t('favorites.go_to_market')}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map(({ vehicle }) => {
                            const isActive = vehicle.status === 'ACTIVE'
                            return (
                                <Link
                                    key={vehicle.id}
                                    href={`/vehicle/${vehicle.id}`}
                                    className={`bg-surface rounded-xl border border-surface-highlight overflow-hidden hover:border-primary-500/50 transition shadow-lg group block relative ${!isActive ? 'opacity-75 grayscale-[0.5]' : ''
                                        }`}
                                >
                                    {/* Imagen del vehículo */}
                                    <div className="aspect-video bg-gradient-to-br from-surface-highlight to-surface flex items-center justify-center relative overflow-hidden">
                                        {vehicle.images && vehicle.images.length > 0 ? (
                                            <img
                                                src={vehicle.images[0]}
                                                alt={vehicle.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg className="w-16 h-16 text-text-secondary opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M22 13.5V12c0-.55-.45-1-1-1h-1.5c-.3 0-.57.14-.74.36L17.2 9.1c-.24-.31-.61-.5-1-.5h-8.4c-.39 0-.76.19-1 .5L5.24 11.36c-.17-.22-.44-.36-.74-.36H3c-.55 0-1 .45-1 1v1.5c0 .25.1.48.26.65l.04.05C2.11 14.4 2 14.69 2 15v4c0 .55.45 1 1 1h1.5c.55 0 1-.45 1-1v-1h13v1c0 .55.45 1 1 1h1.5c.55 0 1-.45 1-1v-4c0-.31-.11-.6-.3-.8l.04-.05c.16-.17.26-.4.26-.65zM6.5 17c-.83 0-1.5-.67-1.5-1.5S5.67 14 6.5 14s1.5.67 1.5 1.5S7.33 17 6.5 17zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5.5 12l1.2-2h10.6l1.2 2H5.5z" />
                                            </svg>
                                        )}

                                        {/* Status OVERLAY if not active */}
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                                                <span className="bg-red-600/90 text-white px-4 py-2 rounded-lg font-bold shadow-xl border border-red-400 rotate-[-12deg] tracking-wider text-lg">
                                                    NO DISPONIBLE
                                                </span>
                                            </div>
                                        )}

                                        {/* Botón de Eliminar (Trash) */}
                                        <div className="absolute top-3 left-3 z-30">
                                            <button
                                                onClick={(e) => handleRemove(e, vehicle.id)}
                                                className="w-10 h-10 rounded-full bg-black/40 hover:bg-red-600/80 backdrop-blur-sm text-white flex items-center justify-center transition shadow-lg group-two"
                                                title="Eliminar de favoritos"
                                            >
                                                {removingId === vehicle.id ? (
                                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        {/* Badge de ciudad */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="px-3 py-1 bg-primary-500/90 backdrop-blur-sm text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{vehicle.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-text-primary mb-1 line-clamp-1 group-hover:text-primary-400 transition">
                                            {vehicle.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm mb-3">
                                            {vehicle.brand} {vehicle.model} • {vehicle.year}
                                        </p>

                                        <div className="flex items-center justify-between mb-3">
                                            <p className={`font-bold text-xl ${!isActive ? 'text-text-secondary line-through opacity-70' : 'text-primary-400'}`}>
                                                {formatPrice(vehicle.price, vehicle.currency || 'MXN')}
                                            </p>
                                            <div className="flex items-center gap-1 text-text-secondary text-sm">
                                                <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                </svg>
                                                <span>{vehicle._count.favorites}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="truncate">{vehicle.user.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
