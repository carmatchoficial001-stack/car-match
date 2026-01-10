'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import ShareButton from '@/components/ShareButton'
import { MapPin, Clock, Phone, Navigation, ArrowLeft, Star, ShieldCheck, Edit3, CreditCard, Play, Pause, Calendar, BadgeCheck } from 'lucide-react'
import ConfirmationModal from '@/components/ConfirmationModal'

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
        userId: string
        isActive: boolean
        expiresAt: string | Date | null
        isFreePublication: boolean
    }
    currentUserId?: string | null
}

export default function BusinessDetailClient({ business, currentUserId }: BusinessDetailProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'info' | 'danger' | 'success' | 'credit';
        confirmLabel?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    })

    // Verificar si el usuario actual es el dueño del negocio
    const isOwner = currentUserId === business.userId

    // Lógica para acciones de gestión
    const executeToggleStatus = async (useCredit: boolean) => {
        setLoading(true)
        setModal(prev => ({ ...prev, isOpen: false }))

        try {
            const res = await fetch('/api/businesses/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: business.id, useCredit })
            })
            const data = await res.json()
            if (res.ok) {
                setModal({
                    isOpen: true,
                    title: '¡Éxito!',
                    message: 'El estado del negocio se ha actualizado correctamente.',
                    variant: 'success',
                    confirmLabel: 'Aceptar',
                    onConfirm: () => window.location.reload()
                })
            } else {
                const isInsufficientCredits = data.error?.toLowerCase().includes('créditos insuficiente') || res.status === 402;

                setModal({
                    isOpen: true,
                    title: isInsufficientCredits ? 'Saldo Insuficiente' : 'Error',
                    message: data.error || 'No se pudo actualizar el estado.',
                    variant: isInsufficientCredits ? 'credit' : 'danger',
                    confirmLabel: isInsufficientCredits ? 'Comprar Créditos' : 'Entendido',
                    onConfirm: isInsufficientCredits ? () => router.push('/credits') : () => setModal(prev => ({ ...prev, isOpen: false })),
                })
            }
        } catch (error) {
            console.error(error)
            setModal({
                isOpen: true,
                title: 'Error técnico',
                message: 'No se pudo procesar la solicitud. Revisa tu conexión.',
                variant: 'danger',
                confirmLabel: 'Aceptar',
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = (useCredit: boolean = false) => {
        let title = '¿Estás seguro?'
        let message = `¿Deseas ${business.isActive ? 'pausar' : 'activar'} este negocio?`
        let variant: 'info' | 'danger' | 'success' | 'credit' = 'info'
        let confirmLabel = 'Confirmar'

        if (useCredit) {
            title = 'Activar con Crédito'
            message = '¿Deseas activar este negocio usando 1 crédito? Esto extenderá la vigencia por 30 días.'
            variant = 'credit'
            confirmLabel = 'Usar 1 Crédito'
        }

        setModal({
            isOpen: true,
            title,
            message,
            variant,
            confirmLabel,
            onConfirm: () => executeToggleStatus(useCredit)
        })
    }

    const managementPanel = () => {
        const isExpired = business.expiresAt && new Date(business.expiresAt) < new Date()
        const needsCreditToActivate = !business.isActive && (!business.isFreePublication || isExpired)

        return (
            <div className="bg-surface-highlight/20 border border-primary-500/20 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${business.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${business.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                                {business.isActive ? 'Activo' : 'Inactivo'}
                            </div>

                            {business.expiresAt && (
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${isExpired ? 'text-red-400' : 'text-text-secondary'}`}>
                                    <Calendar size={14} />
                                    {isExpired ? 'Expirado el: ' : 'Vence el: '}
                                    {new Date(business.expiresAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        {!business.isActive && isExpired && (
                            <p className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
                                <CreditCard size={14} />
                                Requiere 1 crédito para renovar y activar.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Link
                            href={`/my-businesses?edit=${business.id}`}
                            className="bg-surface-highlight hover:bg-surface-highlight/80 text-text-primary p-3 rounded-2xl border border-white/5 flex flex-col items-center gap-1 min-w-[80px] transition"
                        >
                            <Edit3 size={20} className="text-primary-400" />
                            <span className="text-[10px] font-bold uppercase">Editar</span>
                        </Link>

                        {needsCreditToActivate ? (
                            <button
                                onClick={() => handleToggleStatus(true)}
                                disabled={loading}
                                className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-2xl flex flex-col items-center gap-1 min-w-[80px] shadow-lg shadow-amber-900/40 transition"
                            >
                                <CreditCard size={20} />
                                <span className="text-[10px] font-bold uppercase text-center px-1">Activar con 1 crédito</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleToggleStatus(false)}
                                disabled={loading}
                                className={`p-3 rounded-2xl flex flex-col items-center gap-1 min-w-[80px] transition ${business.isActive
                                    ? 'bg-surface-highlight text-text-secondary border border-white/5'
                                    : 'bg-green-500 text-white shadow-lg shadow-green-900/40'
                                    }`}
                            >
                                {business.isActive ? <Pause size={20} /> : <Play size={20} />}
                                <span className="text-[10px] font-bold uppercase">{business.isActive ? 'Pausar' : 'Activar'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

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
                                url={typeof window !== 'undefined' ? `${window.location.origin}/business/${business.id}` : `/business/${business.id}`}
                                variant="minimal"
                                className="bg-surface border border-surface-highlight rounded-xl w-14 flex items-center justify-center"
                            />
                        </div>
                    </div>

                    {/* Right Column: Info & Details */}
                    <div className="flex flex-col space-y-6">
                        {isOwner && managementPanel()}

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
                                        url={typeof window !== 'undefined' ? `${window.location.origin}/business/${business.id}` : `/business/${business.id}`}
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

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                confirmLabel={modal.confirmLabel}
                isLoading={loading}
            />
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
