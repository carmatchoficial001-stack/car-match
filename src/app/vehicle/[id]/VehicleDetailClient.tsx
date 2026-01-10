'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowLeft, MapPin, MessageCircle, Calendar, Gauge, Fuel, CheckCircle2 } from 'lucide-react'
import FavoriteButton from '@/components/FavoriteButton'
import ContactButton from '@/components/ContactButton'
import ShareButton from '@/components/ShareButton'
import ReportImageButton from '@/components/ReportImageButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatPrice, formatNumber } from '@/lib/vehicleTaxonomy'
import { useRouter } from 'next/navigation'
import { Edit3, Sparkles, CreditCard, Play, Pause, BadgeCheck, AlertTriangle, Share2 } from 'lucide-react'
import ConfirmationModal from '@/components/ConfirmationModal'

interface VehicleDetailProps {
    vehicle: {
        id: string
        title: string
        description: string
        brand: string
        model: string
        year: number
        price: number
        currency: string | null
        city: string
        state: string | null
        country: string | null
        latitude: number | null
        longitude: number | null
        transmission: string | null
        mileage: number | null
        mileageUnit: string
        fuel: string | null
        engine: string | null
        doors: number | null
        color: string | null
        condition: string | null
        vehicleType: string | null
        displacement: number | null
        cargoCapacity: number | null
        operatingHours?: number | null
        traction?: string | null
        passengers?: number | null
        features: string[]
        images: string[]
        isFavorited: boolean
        user: {
            id: string
            name: string
            image: string | null
            email: string | null
            phone: string | null
        }
        _count: {
            favorites: number
        }
        userId: string
        status: string
        moderationStatus?: string
        moderationFeedback?: string | null
        expiresAt?: string | Date | null
        isFreePublication?: boolean
    }
    currentUserEmail?: string | null
    currentUserId?: string | null
}

export default function VehicleDetailClient({ vehicle, currentUserEmail, currentUserId }: VehicleDetailProps) {
    const { t, locale } = useLanguage()
    const [activeImage, setActiveImage] = useState(0)
    const isOwner = currentUserId === vehicle.userId

    useEffect(() => {
        // Registrar vista real al entrar
        fetch(`/api/vehicles/${vehicle.id}/view`, { method: 'POST' }).catch(() => { })
    }, [vehicle.id])

    const locationString = [vehicle.city, vehicle.state, vehicle.country]
        .filter(b => b && b !== 'null' && b !== 'undefined')
        .join(', ')

    // Componentes de Gestión Internos (Solo Dueño)
    const ManagementPanel = () => {
        const isExpired = vehicle.expiresAt && new Date(vehicle.expiresAt) < new Date()
        const needsCreditToActivate = !vehicle.isFreePublication || isExpired || vehicle.moderationStatus === 'REJECTED'
        const canActivateFree = vehicle.isFreePublication && !isExpired && (vehicle.moderationStatus === 'APPROVED' || vehicle.moderationStatus === 'PENDING_AI')
        const statusKey = vehicle.status.toLowerCase()

        return (
            <div className="bg-surface-highlight/20 border border-primary-500/20 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${vehicle.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                vehicle.status === 'SOLD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${vehicle.status === 'ACTIVE' ? 'bg-green-400' :
                                    vehicle.status === 'SOLD' ? 'bg-blue-400' : 'bg-gray-400'
                                    }`} />
                                {t(`profile.status.${statusKey}`) || vehicle.status}
                            </div>

                            {vehicle.expiresAt && (
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${isExpired ? 'text-red-400' : 'text-text-secondary'}`}>
                                    <Calendar size={14} />
                                    {isExpired ? 'Expirado el: ' : 'Vence el: '}
                                    {new Date(vehicle.expiresAt).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                        </div>

                        {vehicle.moderationStatus === 'REJECTED' && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
                                <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-red-400 font-black text-xs uppercase tracking-wider mb-1">Rechazado por un Asesor</p>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {vehicle.moderationFeedback || 'Tu anuncio requiere corrección. Haz clic en el botón "Corregir datos automáticamente" para que nuestro sistema ajuste los datos según tus fotos y active tu publicación.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {vehicle.moderationStatus === 'APPROVED' && vehicle.moderationFeedback?.includes('Auto-corregido') && (
                            <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-4 flex gap-3 items-start">
                                <Sparkles className="text-primary-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-primary-400 font-black text-xs uppercase tracking-wider mb-1">Optimizado por CarMatch</p>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {vehicle.moderationFeedback}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full md:w-auto">
                        <Link
                            href={`/publish?edit=${vehicle.id}`}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-highlight hover:bg-surface-highlight/80 text-text-primary transition border border-white/5 gap-1 group"
                        >
                            <Edit3 size={20} className="text-primary-400 group-hover:scale-110 transition" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Editar</span>
                        </Link>

                        {vehicle.status !== 'ACTIVE' && vehicle.moderationStatus === 'REJECTED' && (
                            <OwnerActionButton
                                action="ai-fix"
                                vehicleId={vehicle.id}
                                icon={<Sparkles size={20} />}
                                label="Corregir datos automáticamente"
                                variant="ia"
                            />
                        )}

                        {vehicle.status !== 'ACTIVE' && needsCreditToActivate && (
                            <OwnerActionButton
                                action="activate-credit"
                                vehicleId={vehicle.id}
                                icon={<CreditCard size={20} />}
                                label="Activar con 1 crédito"
                                variant="credit"
                            />
                        )}

                        {vehicle.status !== 'ACTIVE' && canActivateFree && (
                            <OwnerActionButton
                                action="activate"
                                vehicleId={vehicle.id}
                                icon={<Play size={20} />}
                                label="Activar"
                                variant="success"
                            />
                        )}

                        {vehicle.status === 'ACTIVE' && (
                            <OwnerActionButton
                                action="pause"
                                vehicleId={vehicle.id}
                                icon={<Pause size={20} />}
                                label="Pausar"
                                variant="neutral"
                            />
                        )}

                        {vehicle.status !== 'SOLD' && (
                            <OwnerActionButton
                                action="sold"
                                vehicleId={vehicle.id}
                                icon={<BadgeCheck size={20} />}
                                label="Marcado como vendido"
                                variant="sold"
                            />
                        )}

                        <div className="col-span-2 sm:col-span-1 md:col-span-1">
                            <ShareButton
                                title={vehicle.title}
                                text={t('vehicle.share_text').replace('{title}', vehicle.title)}
                                url={typeof window !== 'undefined' ? window.location.href : `https://carmatch.app/vehicle/${vehicle.id}`}
                                variant="icon"
                                className="w-full h-full flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-highlight hover:bg-surface-highlight/80 text-text-primary transition border border-white/5 gap-1"
                            >
                                <Share2 size={20} className="text-primary-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Compartir</span>
                            </ShareButton>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <div className="container mx-auto px-4 pt-6">
                {/* Back Button */}
                <div className="flex justify-between items-center mb-6">
                    <Link href="/market" className="inline-flex items-center text-text-secondary hover:text-primary-400 transition">
                        <ArrowLeft className="mr-2" size={20} />
                        {t('vehicle.back_market')}
                    </Link>

                    {isOwner && (
                        <div className="bg-primary-700/10 text-primary-400 px-4 py-1.5 rounded-xl border border-primary-700/30 flex items-center gap-2 lg:hidden">
                            <BadgeCheck size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Mi Publicación</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-surface rounded-2xl overflow-hidden border border-surface-highlight shadow-2xl">
                            {vehicle.images && vehicle.images.length > 0 ? (
                                <Image
                                    src={vehicle.images[activeImage]}
                                    alt={vehicle.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-secondary">
                                    <span className="text-lg">{t('vehicle.no_images')}</span>
                                </div>
                            )}

                            <div className="absolute top-4 right-4 z-10">
                                <FavoriteButton
                                    vehicleId={vehicle.id}
                                    initialIsFavorited={vehicle.isFavorited}
                                    size="lg"
                                />
                            </div>

                            <ReportImageButton
                                imageUrl={vehicle.images?.[activeImage] || ''}
                                vehicleId={vehicle.id}
                                className="absolute top-4 left-4 z-10"
                            />
                        </div>

                        {/* Thumbnails */}
                        {vehicle.images && vehicle.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {vehicle.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${activeImage === idx ? 'border-primary-500' : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex flex-col">
                        {isOwner && <ManagementPanel />}

                        <div className="bg-surface border border-surface-highlight rounded-3xl p-6 shadow-xl mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <p className="text-primary-400 font-bold text-sm tracking-wider uppercase mb-1">
                                        {vehicle.condition === 'Nuevo' || vehicle.condition === 'NEW' ? t('vehicle.condition_new') :
                                            vehicle.condition === 'Seminuevo (Casi Nuevo)' || vehicle.condition === 'Seminuevo' ? 'Seminuevo' :
                                                t('vehicle.condition_used')} · {vehicle.year}
                                    </p>
                                    <h1 className="text-3xl md:text-3xl font-black text-text-primary leading-tight mb-2">
                                        {vehicle.title}
                                    </h1>
                                    <div className="flex items-center text-text-secondary text-sm">
                                        <MapPin size={16} className="mr-1.5 text-primary-400" />
                                        {locationString}
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-2xl md:text-4xl font-black text-primary-400 mb-2 font-outfit tracking-tight" suppressHydrationWarning>
                                        {formatPrice(vehicle.price, vehicle.currency || 'MXN', locale)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mb-8">
                                <ShareButton
                                    title={vehicle.title}
                                    text={t('vehicle.share_text').replace('{title}', vehicle.title)}
                                    url={typeof window !== 'undefined' ? window.location.href : `https://carmatch.app/vehicle/${vehicle.id}`}
                                    variant="full"
                                />
                            </div>

                            {/* Main Specs Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <DetailItem icon={<Calendar size={20} />} label={t('publish.labels.year')} value={vehicle.year.toString()} />
                                <DetailItem icon={<Gauge size={20} />} label={t('publish.labels.mileage')} value={vehicle.mileage ? `${formatNumber(vehicle.mileage, locale)} ${vehicle.mileageUnit || 'km'}` : 'N/A'} />
                                <DetailItem icon={<Fuel size={20} />} label={t('publish.labels.fuel')} value={vehicle.fuel || 'N/A'} />
                                <DetailItem
                                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                                    label="Motor"
                                    value={(() => {
                                        const engine = vehicle.engine || '';
                                        const disp = vehicle.displacement;
                                        if (!engine && !disp) return 'N/A';
                                        if (!disp) return engine;
                                        const dispStr = disp > 100 ? `${disp} cc` : `${disp}L`;
                                        return engine ? `${engine} - ${dispStr}` : dispStr;
                                    })()}
                                />
                            </div>

                            {/* Ficha Técnica Extra */}
                            <div className="border-t border-surface-highlight pt-6 mb-8">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Especificaciones</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <DetailItem icon={<CheckCircle2 size={18} />} label="Transmisión" value={vehicle.transmission || 'N/A'} />
                                    <DetailItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-2v2" /></svg>} label="Color" value={vehicle.color || 'N/A'} />
                                    <DetailItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>} label="Puertas" value={vehicle.doors?.toString() || 'N/A'} />
                                    <DetailItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>} label="Categoría" value={vehicle.vehicleType || 'N/A'} />

                                    <DetailItem icon={<CheckCircle2 size={18} />} label="Condición" value={vehicle.condition || 'N/A'} />


                                    {vehicle.cargoCapacity && <DetailItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} label="Carga" value={`${vehicle.cargoCapacity} kg`} />}

                                    {vehicle.traction && (
                                        <DetailItem
                                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                            label="Tracción"
                                            value={vehicle.traction}
                                        />
                                    )}
                                    {vehicle.passengers && (
                                        <DetailItem
                                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                            label="Pasajeros"
                                            value={vehicle.passengers.toString()}
                                        />
                                    )}
                                    {vehicle.operatingHours && (
                                        <DetailItem
                                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            label="Horas de Uso"
                                            value={`${formatNumber(vehicle.operatingHours, locale)} hrs`}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Features Tags (Prominent) */}
                            {vehicle.features && vehicle.features.length > 0 && (
                                <div className="border-t border-surface-highlight pt-6 mb-8 border-2 border-primary-500/50 rounded-2xl p-5 bg-primary-500/5">
                                    <h3 className="text-xl font-bold text-text-primary mb-4 font-outfit flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        Equipamiento
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {vehicle.features.map((feature, idx) => (
                                            <span key={`feat-${idx}-${feature}`} className="bg-surface-highlight/60 text-text-primary px-4 py-2 rounded-xl text-sm border border-white/10 shadow-sm font-medium">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="border-t border-surface-highlight pt-6 mb-8">
                                <h3 className="text-lg font-bold text-text-primary mb-3 font-outfit">{t('publish.labels.description')}</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base mb-8">
                                    {vehicle.description}
                                </p>
                            </div>

                            <div className="border-t border-surface-highlight pt-6">
                                <h3 className="text-lg font-bold text-text-primary mb-4 font-outfit">{t('vehicle.seller')}</h3>
                                <div className="flex items-center justify-between">
                                    <Link href={`/profile/${vehicle.user.id}`} className="flex items-center gap-3 group/seller transition-all hover:opacity-80">
                                        <div className="w-12 h-12 bg-primary-700/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-xl uppercase shadow-glow group-hover/seller:bg-primary-700/30 transition-colors">
                                            {vehicle.user.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary group-hover/seller:text-primary-400 transition-colors">{vehicle.user.name}</p>
                                            <p className="text-xs text-text-secondary">{t('vehicle.verified_seller')}</p>
                                        </div>
                                    </Link>
                                    <ContactButton
                                        sellerId={vehicle.userId}
                                        vehicleId={vehicle.id}
                                        vehicleTitle={vehicle.title}
                                        status={vehicle.status as any}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OwnerActionButton({ action, vehicleId, icon, label, variant }: {
    action: 'edit' | 'ai-fix' | 'activate' | 'activate-credit' | 'pause' | 'sold',
    vehicleId: string,
    icon: any,
    label: string,
    variant: 'ia' | 'credit' | 'success' | 'neutral' | 'sold'
}) {
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'info' | 'danger' | 'success' | 'credit';
        confirmLabel?: string;
        onConfirm?: () => void;
        secondaryAction?: { label: string; onClick: () => void };
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    })
    const router = useRouter()

    const handleAction = async () => {
        setLoading(true)
        setModal(prev => ({ ...prev, isOpen: false }))

        try {
            let res;
            if (action === 'ai-fix') {
                res = await fetch(`/api/vehicles/${vehicleId}/ai-fix`, { method: 'POST' })
            } else {
                const newStatus = action === 'sold' ? 'SOLD' : action === 'pause' ? 'INACTIVE' : 'ACTIVE'
                res = await fetch(`/api/vehicles/${vehicleId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        status: newStatus,
                        useCredit: action === 'activate-credit'
                    })
                })
            }

            const data = await res.json()
            if (res.ok) {
                setModal({
                    isOpen: true,
                    title: '¡Éxito!',
                    message: `La acción "${label}" se ha realizado correctamente.`,
                    variant: 'success',
                    confirmLabel: 'Aceptar',
                    onConfirm: () => window.location.reload()
                })
            } else {
                const isInsufficientCredits = data.error?.toLowerCase().includes('créditos insuficiente') || res.status === 402;

                setModal({
                    isOpen: true,
                    title: isInsufficientCredits ? 'Saldo Insuficiente' : 'Error',
                    message: data.error || 'No se pudo completar la acción. Inténtalo de nuevo más tarde.',
                    variant: isInsufficientCredits ? 'credit' : 'danger',
                    confirmLabel: isInsufficientCredits ? 'Comprar Créditos' : 'Entendido',
                    onConfirm: isInsufficientCredits ? () => router.push('/credits') : () => setModal(prev => ({ ...prev, isOpen: false })),
                })
            }
        } catch (e) {
            console.error(e)
            setModal({
                isOpen: true,
                title: 'Error de Conexión',
                message: 'Ocurrió un error técnico al procesar tu solicitud. Revisa tu conexión de internet.',
                variant: 'danger',
                confirmLabel: 'Aceptar',
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClick = () => {
        if (action === 'edit') return // Handled by Link

        let title = '¿Estás seguro?'
        let message = `¿Deseas ${label.toLowerCase()} esta publicación?`
        let variant: 'info' | 'danger' | 'success' | 'credit' = 'info'
        let confirmLabel = 'Confirmar'

        if (action === 'ai-fix') {
            title = 'Corrección Automática'
            message = '¿Deseas corregir los datos de tu vehículo automáticamente según las fotos y activarlo ahora?'
            variant = 'info'
        }
        if (action === 'activate-credit') {
            title = 'Activar con Crédito'
            message = '¿Deseas activar esta publicación usando 1 crédito? Esto extenderá la vigencia por 30 días.'
            variant = 'credit'
            confirmLabel = 'Usar 1 Crédito'
        }
        if (action === 'sold') {
            variant = 'success'
            confirmLabel = 'Marcar como Vendido'
        }

        setModal({
            isOpen: true,
            title,
            message,
            variant,
            confirmLabel,
            onConfirm: handleAction
        })
    }

    const variants = {
        ia: 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-900/40',
        credit: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-900/40',
        success: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-900/40',
        neutral: 'bg-surface-highlight text-text-primary hover:bg-surface border border-white/5',
        sold: 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-900/40'
    }

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition gap-1 group w-full ${variants[variant]}`}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <div className="group-hover:scale-110 transition">{icon}</div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-tighter line-clamp-1">{label}</span>
            </button>

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
        </>
    )
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-surface-highlight/30 rounded-xl p-3 flex flex-col items-center text-center border border-white/5 transition hover:bg-surface-highlight/50">
            <div className="text-primary-400 mb-1">{icon}</div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1 font-medium">{label}</p>
            <p className="font-bold text-text-primary text-sm line-clamp-1" suppressHydrationWarning>{value}</p>
        </div>
    )
}
