"use client"

import Header from "@/components/Header"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatPrice } from "@/lib/vehicleTaxonomy"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import EditProfileModal from "@/components/EditProfileModal"
import ReportImageButton from "@/components/ReportImageButton"

interface ProfileClientProps {
    user: any // Typed as any to match the dynamic prisma include structure for now
    isOwner: boolean
    vehiclesToShow: any[]
}

export default function ProfileClient({ user, isOwner, vehiclesToShow }: ProfileClientProps) {
    const { t, locale } = useLanguage()
    const [showEditModal, setShowEditModal] = useState(false)

    // Formatear fecha según idioma
    const formattedDate = new Date(user.createdAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' })

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-8 pb-24 max-w-5xl">
                {/* Header del Perfil */}
                <div className="bg-surface rounded-2xl shadow-xl p-8 mb-8 border border-surface-highlight">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row items-start gap-4 sm:gap-6">
                            {/* 1. Foto de Perfil (Izquierda - Rojo) */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0">
                                <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface group">
                                    {user.image ? (
                                        <>
                                            <img
                                                src={user.image}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {isOwner && (
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-surface-highlight flex items-center justify-center relative">
                                            <span className="text-3xl sm:text-4xl font-black text-primary-400/50">
                                                {user.name?.[0]?.toUpperCase()}
                                            </span>
                                            {isOwner && (
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all"
                                                >
                                                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Información (Derecha - Azul y Verde) */}
                            <div className="flex-1 flex flex-col items-start gap-1">
                                {/* Nombre y Fecha */}
                                <div className="flex flex-col items-start">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary leading-tight">
                                        {user.name}
                                    </h1>
                                    <p className="text-text-secondary text-xs sm:text-sm">
                                        {t('profile.member_since')} {formattedDate}
                                    </p>
                                </div>

                                {/* ID de Usuario */}
                                {isOwner && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="bg-surface-highlight/30 px-2 py-1 rounded-md border border-surface-highlight flex items-center gap-1.5">
                                            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">ID:</span>
                                            <code className="text-[10px] sm:text-xs text-primary-400 font-mono truncate max-w-[80px] sm:max-w-[120px]">
                                                {user.id}
                                            </code>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                navigator.clipboard.writeText(user.id)
                                                // @ts-ignore
                                                const btn = e.currentTarget
                                                const originalHtml = btn.innerHTML
                                                btn.innerHTML = `<span class="text-[10px] text-green-400 font-bold">OK</span>`
                                                setTimeout(() => {
                                                    btn.innerHTML = originalHtml
                                                }, 2000)
                                            }}
                                            className="p-1.5 bg-surface-highlight/50 hover:bg-surface-highlight rounded-md transition text-text-secondary hover:text-primary-400 border border-surface-highlight"
                                            title="Copiar ID"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Botón de Editar (Móvil) */}
                                {isOwner && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="mt-2 text-xs text-primary-400 font-bold hover:underline sm:hidden"
                                    >
                                        {t('profile.edit_profile' as any) || 'Editar Perfil'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Botón Publicar (Abajo - Morado) */}
                        {isOwner && (
                            <Link
                                href="/publish"
                                className="w-full sm:w-auto px-6 py-3 bg-primary-700 text-background text-center font-bold rounded-xl hover:bg-primary-600 transition shadow-lg flex items-center justify-center gap-2 text-sm sm:self-start"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('profile.publish_vehicle')}
                            </Link>
                        )}
                    </div>

                </div>

                {/* Vehículos */}
                <div className="bg-surface rounded-2xl shadow-xl p-8 border border-surface-highlight">
                    <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                        <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22 13.5V12c0-.55-.45-1-1-1h-1.5c-.3 0-.57.14-.74.36L17.2 9.1c-.24-.31-.61-.5-1-.5h-8.4c-.39 0-.76.19-1 .5L5.24 11.36c-.17-.22-.44-.36-.74-.36H3c-.55 0-1 .45-1 1v1.5c0 .25.1.48.26.65l.04.05C2.11 14.4 2 14.69 2 15v4c0 .55.45 1 1 1h1.5c.55 0 1-.45 1-1v-1h13v1c0 .55.45 1 1 1h1.5c.55 0 1-.45 1-1v-4c0-.31-.11-.6-.3-.8l.04-.05c.16-.17.26-.4.26-.65zM6.5 17c-.83 0-1.5-.67-1.5-1.5S5.67 14 6.5 14s1.5.67 1.5 1.5S7.33 17 6.5 17zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5.5 12l1.2-2h10.6l1.2 2H5.5z" />
                        </svg>
                        {isOwner ? t('profile.my_vehicles') : t('profile.user_vehicles').replace('{name}', user.name)}
                    </h2>

                    {vehiclesToShow.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary bg-background/50 rounded-xl border border-surface-highlight border-dashed">
                            <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <p className="mb-6 text-lg">
                                {isOwner
                                    ? t('profile.no_vehicles_owner')
                                    : t('profile.no_vehicles_visitor')}
                            </p>
                            {isOwner && (
                                <Link
                                    href="/publish"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('profile.publish_first')}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {vehiclesToShow.map((vehicle) => {
                                const isInactive = vehicle.status !== "ACTIVE"
                                const statusKey = vehicle.status.toLowerCase() as 'active' | 'sold' | 'inactive'

                                // 💡 Lógica de Condición para botones
                                const isExpired = vehicle.expiresAt && new Date(vehicle.expiresAt) < new Date()
                                const needsCreditToActivate = !vehicle.isFreePublication || isExpired || vehicle.moderationStatus === 'REJECTED'
                                const canActivateFree = vehicle.isFreePublication && !isExpired && (vehicle.moderationStatus === 'APPROVED' || vehicle.moderationStatus === 'PENDING_AI')

                                return (
                                    <div
                                        key={vehicle.id}
                                        className={`border rounded-xl p-5 transition group relative ${isInactive
                                            ? "border-surface bg-background/30 opacity-60"
                                            : "border-surface-highlight bg-background/50 hover:border-primary-700/50"
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row gap-5">
                                            {/* Foto de Portada */}
                                            <Link
                                                href={`/vehicle/${vehicle.id}`}
                                                className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-surface-highlight flex-shrink-0"
                                            >
                                                {vehicle.images && vehicle.images[0] ? (
                                                    <img
                                                        src={vehicle.images[0]}
                                                        alt={vehicle.title}
                                                        className="w-full h-full object-contain bg-black/50 transition duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-secondary/20">
                                                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </Link>

                                            <div className="flex-1 flex justify-between items-start">
                                                <div>
                                                    <Link href={`/vehicle/${vehicle.id}`}>
                                                        <h3 className={`font-bold text-lg transition ${isInactive
                                                            ? "text-text-secondary"
                                                            : "text-text-primary group-hover:text-primary-400"
                                                            }`}>
                                                            {vehicle.brand} {vehicle.model} {vehicle.year}
                                                        </h3>
                                                    </Link>
                                                    <p className={`font-bold mt-1 text-xl ${isInactive ? "text-text-secondary" : "text-primary-400"
                                                        }`} suppressHydrationWarning>
                                                        {formatPrice(vehicle.price, vehicle.currency || 'MXN', locale)}
                                                    </p>
                                                    {isOwner && (
                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {vehicle.expiresAt && (
                                                                <p className={`text-xs font-medium px-2 py-1 rounded inline-block ${isExpired ? "bg-red-900/20 text-red-400" : "bg-surface-highlight/30 text-text-secondary"}`}>
                                                                    {isExpired ? '❌ Expirado: ' : '📅 Vence: '} {new Date(vehicle.expiresAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric'
                                                                    })}
                                                                </p>
                                                            )}
                                                            {vehicle.moderationStatus === 'REJECTED' && (
                                                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">⚠️ Rechazado por un Asesor - Entra para corregir datos automáticamente</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {isOwner ? (
                                                    <div className="flex flex-col gap-2">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm font-bold text-center ${vehicle.status === "ACTIVE"
                                                                ? "bg-green-900/30 text-green-400 border border-green-900/50"
                                                                : vehicle.status === "SOLD"
                                                                    ? "bg-blue-900/30 text-blue-400 border border-blue-900/50"
                                                                    : "bg-surface-highlight text-text-secondary border border-surface-highlight"
                                                                }`}
                                                        >
                                                            {t(`profile.status.${statusKey}`) || vehicle.status}
                                                        </span>

                                                        <Link
                                                            href={`/vehicle/${vehicle.id}`}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-surface-highlight rounded-xl text-primary-400 font-bold text-sm hover:bg-surface-highlight transition shadow-sm"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Gestionar
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-bold ${vehicle.status === "ACTIVE"
                                                            ? "bg-green-900/30 text-green-400 border border-green-900/50"
                                                            : vehicle.status === "SOLD"
                                                                ? "bg-blue-900/30 text-blue-400 border border-blue-900/50"
                                                                : "bg-surface-highlight text-text-secondary border border-surface-highlight"
                                                            }`}
                                                    >
                                                        {t(`profile.status.${statusKey}`) || vehicle.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Edición */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentUser={{
                    name: user.name,
                    image: user.image,
                    email: user.email,
                    trustedContactId: user.trustedContactId,
                    trustedContact: user.trustedContact
                }}
                userVehicles={vehiclesToShow}
            />
        </div>
    )
}
