// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import Header from "@/components/Header"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatPrice } from "@/lib/vehicleTaxonomy"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import EditProfileModal from "@/components/EditProfileModal"
import ReportImageButton from "@/components/ReportImageButton"
import { Flag, MessageSquare, AlertCircle, ChevronRight, RefreshCw, Headset, ShieldCheck } from "lucide-react"

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
            <div className="container mx-auto px-4 pt-8 pb-24 max-w-5xl">
                {/* Header del Perfil */}
                <div className="bg-surface rounded-2xl shadow-xl p-8 mb-8 border border-surface-highlight">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row items-start gap-4 sm:gap-6">
                            {/* 1. Foto de Perfil (Izquierda - Rojo) */}
                            <div className="w-32 sm:w-40 md:w-56 flex-shrink-0">
                                <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-black/10 group flex items-center justify-center">
                                    {user.image ? (
                                        <>
                                            <img
                                                src={user.image}
                                                alt={user.name}
                                                className="w-full h-full object-contain"
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


                <div className="bg-surface rounded-2xl shadow-xl p-8 border border-surface-highlight">


                    {/* Botón de Actualizar / Barajar para Visitantes (Solo si hay vehículos) */}
                    {!isOwner && vehiclesToShow.length > 0 && (
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => {
                                    // 🔄 Hack simple: Forzar recarga completa para re-barajar en el servidor o reordenar local
                                    // Opción local visual más rápida:
                                    const shuffled = [...vehiclesToShow].sort(() => Math.random() - 0.5)
                                    // Necesitaríamos estado local para esto, pero como fallback rápido usaremos router.refresh
                                    // window.location.reload() // Fuerza bruta pero efectiva para "pull-to-refresh" real

                                    // Mejor UX: Router refresh (mantiene estado pero recarga data del server)
                                    const btn = document.getElementById('btn-refresh-inventory')
                                    if (btn) btn.classList.add('animate-spin')
                                    window.location.reload()
                                }}
                                className="flex items-center gap-2 text-primary-400 text-sm font-bold hover:text-primary-300 transition"
                            >
                                <RefreshCw id="btn-refresh-inventory" className="w-4 h-4" />
                                {t('common.refresh' as any) || 'Actualizar Inventario'}
                            </button>
                        </div>
                    )}

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
                                                ) : null}
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
                    id: user.id,
                    trustedContactId: user.trustedContactId,
                    trustedContact: user.trustedContact,
                }}
                userVehicles={vehiclesToShow}
            />
        </div >
    )
}

function ReportChat({ reportId }: { reportId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/report/${reportId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [reportId])

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [fetchMessages])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/report/${reportId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })
            if (res.ok) {
                const msg = await res.json()
                setMessages(prev => [...prev, msg])
                setNewMessage("")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="flex-1 flex items-center justify-center text-xs opacity-50">Cargando conversación...</div>

    return (
        <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 grayscale p-8">
                        <div className="p-4 bg-primary-400/10 rounded-full">
                            <Headset className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className="text-[10px] font-bold text-center">Inicia una conversación con un administrador sobre tu reporte.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = !msg.sender.isAdmin // Para el usuario, "Me" son los NO admins
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] ${isMe
                                    ? 'bg-primary-700 text-white rounded-tr-none'
                                    : 'bg-surface border border-surface-highlight text-text-primary rounded-tl-none'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <span className="font-black uppercase text-[8px]">{msg.sender.isAdmin ? 'ADMINISTRADOR' : 'TU'}</span>
                                        <span className="text-[8px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-surface-highlight bg-surface">
                <div className="flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-background border border-surface-highlight rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary-500 transition-colors"
                        disabled={sending}
                    />
                    <button
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-primary-700 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </>
    )
}
