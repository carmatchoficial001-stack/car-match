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
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header del Perfil */}
                <div className="bg-surface rounded-2xl shadow-xl p-8 mb-8 border border-surface-highlight">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative group">
                                {user.image ? (
                                    <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface group relative">
                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                        {isOwner && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="bg-primary-700 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    Editar Perfil
                                                </button>
                                            </div>
                                        )}
                                        {!isOwner && (
                                            <ReportImageButton
                                                imageUrl={user.image}
                                                targetUserId={user.id}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface relative group">
                                        {/* Avatar Aleatorio (Usamos del 1 al 6 disponibles) */}
                                        <img
                                            src={`/defaults/avatars/car_${((user.name?.charCodeAt(0) || 0) % 6) + 1}.png`}
                                            alt="Portada por defecto"
                                            className="w-full h-full object-cover opacity-90"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                            <span className="mt-8 text-4xl font-bold text-white drop-shadow-lg tracking-wider">
                                                {user.name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>

                                        {isOwner && (
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => setShowEditModal(true)}
                                                    className="bg-black/50 hover:bg-primary-700 text-white p-2 rounded-full backdrop-blur-sm transition"
                                                    title="Editar Perfil"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-3xl font-bold text-text-primary">
                                        {user.name}
                                    </h1>
                                    {isOwner && (
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="text-text-secondary hover:text-primary-400 transition p-1"
                                            title="Editar nombre"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="text-text-secondary text-sm">
                                    {t('profile.member_since')} {formattedDate}
                                </p>

                            </div>
                        </div>

                        {isOwner && (
                            <Link
                                href="/publish"
                                className="w-full md:w-auto px-6 py-3 bg-primary-700 text-background text-center font-bold rounded-xl hover:bg-primary-600 transition shadow-lg flex items-center justify-center gap-2 text-sm"
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
                                                        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
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
                                                            {vehicle.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-text-secondary mt-1">
                                                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                                                    </p>
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
                                                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">⚠️ Rechazado por IA - Requiere corrección o activar con crédito</p>
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

                                                        {/* Botones de Acción Rápida */}
                                                        <div className="flex gap-1 z-10 flex-wrap justify-end">
                                                            {/* EDITAR - Siempre visible para el dueño */}
                                                            <Link
                                                                href={`/publish?edit=${vehicle.id}`}
                                                                className="p-1.5 rounded-lg bg-surface border border-surface-highlight hover:bg-surface-highlight hover:text-primary-400 text-text-secondary transition"
                                                                title="Editar vehículo"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </Link>

                                                            {/* ASESOR REAL (IA FIX) - Solo si está inactivo y rechazado */}
                                                            {vehicle.status !== 'ACTIVE' && vehicle.moderationStatus === 'REJECTED' && (
                                                                <AIFixButton vehicleId={vehicle.id} />
                                                            )}

                                                            {/* ACTIVAR CON CRÉDITO - Solo si es necesario */}
                                                            {vehicle.status !== 'ACTIVE' && needsCreditToActivate && (
                                                                <UpdateStatusButton
                                                                    vehicleId={vehicle.id}
                                                                    newStatus="ACTIVE"
                                                                    useCredit={true}
                                                                    label="Activar con 1 Crédito"
                                                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.406 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.406-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                />
                                                            )}

                                                            {/* ACTIVAR GRATIS - Solo si es posible */}
                                                            {vehicle.status !== 'ACTIVE' && canActivateFree && (
                                                                <UpdateStatusButton
                                                                    vehicleId={vehicle.id}
                                                                    newStatus="ACTIVE"
                                                                    label="Activar"
                                                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                />
                                                            )}
                                                            {vehicle.status === 'ACTIVE' && (
                                                                <UpdateStatusButton
                                                                    vehicleId={vehicle.id}
                                                                    newStatus="INACTIVE"
                                                                    label="Pausar"
                                                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                />
                                                            )}
                                                            {vehicle.status !== 'SOLD' && (
                                                                <UpdateStatusButton
                                                                    vehicleId={vehicle.id}
                                                                    newStatus="SOLD"
                                                                    label="Vendido"
                                                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                />
                                                            )}
                                                        </div>
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
                    email: user.email
                }}
                userVehicles={vehiclesToShow}
            />
        </div>
    )
}


function AIFixButton({ vehicleId }: { vehicleId: string }) {
    const [loading, setLoading] = useState(false)

    const handleAIFix = async () => {
        if (!confirm('¿Deseas que nuestro "Asesor Real" (IA) corrija los datos de tu vehículo según las fotos y lo active automáticamente?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/vehicles/${vehicleId}/ai-fix`, {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success) {
                alert('✅ ¡Tu vehículo ha sido corregido y activado por el Asesor Real!')
                window.location.reload()
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo realizar la corrección'))
            }
        } catch (e) {
            console.error(e)
            alert('❌ Error técnico al contactar al asesor.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleAIFix}
            disabled={loading}
            className="p-1.5 rounded-lg bg-primary-900/20 border border-primary-500/30 hover:bg-primary-700/40 text-primary-400 transition flex items-center gap-1"
            title="Asesor Real (IA) - Corregir y Activar"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )}
            <span className="text-[10px] font-bold uppercase px-1">Asesor</span>
        </button>
    )
}

function UpdateStatusButton({ vehicleId, newStatus, icon, label, useCredit = false }: { vehicleId: string, newStatus: string, icon: any, label: string, useCredit?: boolean }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter() // Importar useRouter arriba si no existe

    const handleClick = async () => {
        if (!confirm(`¿Cambiar estado a ${label}?`)) return
        setLoading(true)
        try {
            await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                    useCredit: useCredit
                })
            })
            if (useCredit) alert('✅ Vehículo activado con 1 crédito exitosamente.')
            window.location.reload() // Simple reload to refresh data
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`p-1.5 rounded-lg border transition ${useCredit
                ? "bg-amber-900/20 border-amber-500/30 hover:bg-amber-700/40 text-amber-500 shadow-sm"
                : "bg-surface border-surface-highlight hover:bg-surface-highlight hover:text-primary-400 text-text-secondary"
                }`}
            title={label}
        >
            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
        </button>
    )
}
