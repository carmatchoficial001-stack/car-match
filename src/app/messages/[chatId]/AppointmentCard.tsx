'use client'

import { useState } from 'react'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Appointment {
    id: string
    date: string
    location: string
    address?: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
    proposerId: string
}

interface AppointmentCardProps {
    appointment: Appointment
    isOwn: boolean
    onUpdateStatus: (id: string, status: string) => void
    onEdit?: (appointment: Appointment) => void
}

export default function AppointmentCard({ appointment, isOwn, onUpdateStatus, onEdit }: AppointmentCardProps) {
    const { t, locale } = useLanguage()
    const [updating, setUpdating] = useState(false)

    const handleAction = async (status: string) => {
        setUpdating(true)
        try {
            await onUpdateStatus(appointment.id, status)
        } finally {
            setUpdating(false)
        }
    }

    const dateObj = new Date(appointment.date)
    const formattedDate = dateObj.toLocaleDateString(locale === 'es' ? 'es-MX' : locale === 'en' ? 'en-US' : locale, { weekday: 'long', day: 'numeric', month: 'long' })
    const formattedTime = dateObj.toLocaleTimeString(locale === 'es' ? 'es-MX' : locale === 'en' ? 'en-US' : locale, { hour: '2-digit', minute: '2-digit' })

    const statusColors: any = {
        PENDING: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
        ACCEPTED: 'bg-green-500/10 border-green-500/30 text-green-600',
        REJECTED: 'bg-red-500/10 border-red-500/30 text-red-600',
        CANCELLED: 'bg-gray-500/10 border-gray-500/30 text-gray-600',
        COMPLETED: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
        FINISHED: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
        EMERGENCY: 'bg-red-600 text-white border-red-800'
    }

    const statusText: any = {
        PENDING: t('appointments.pending') || 'Pendiente',
        ACCEPTED: t('appointments.accepted') || 'Confirmada',
        REJECTED: t('appointments.rejected') || 'Rechazada',
        CANCELLED: t('appointments.cancelled') || 'Cancelada',
        COMPLETED: t('appointments.completed') || 'Finalizada',
        FINISHED: t('appointments.completed') || 'Finalizada',
        EMERGENCY: '🚨 EMERGENCIA'
    }

    // 🛡️ Safe Status Resolution
    const rawStatus = (appointment.status || 'PENDING').toUpperCase()
    const currentStatus = (statusText.hasOwnProperty(rawStatus) ? rawStatus : 'PENDING')
    const simpleStatus = statusText[currentStatus]

    const getCountdown = () => {
        const now = new Date()
        const diff = dateObj.getTime() - now.getTime()

        if (diff <= 0) return t('appointments.past') || 'Finalizada'

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) return `${t('common.in') || 'En'} ${days}d ${hours}h`
        return `${t('common.in') || 'En'} ${hours}h`
    }

    return (
        <div className={`p-4 rounded-xl border ${statusColors[currentStatus] || 'bg-surface border-surface-highlight'} w-full max-w-sm shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 opacity-70" />
                <span className="font-bold">{t('appointments.proposal_title')}</span>
                {appointment.status === 'PENDING' && onEdit && (
                    <button
                        onClick={() => onEdit(appointment)}
                        className="ml-auto p-1.5 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                        title="Editar cita"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-1 opacity-60" />
                    <div>
                        <div className="font-medium capitalize">{formattedDate}</div>
                        <div className="text-sm opacity-80">{formattedTime}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 opacity-60" />
                    <div>
                        <div className="font-medium">{appointment.location}</div>
                        {appointment.address && (
                            <div className="text-sm opacity-80">{appointment.address}</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-current/10">
                <div className="flex flex-col">
                    <div className="font-medium text-xs opacity-70 uppercase tracking-widest mb-0.5">
                        {simpleStatus}
                    </div>
                    {/* ⏳ COUNTDOWN / TIMER - Visible si es futuro y está activo */}
                    {['ACCEPTED', 'PENDING'].includes(currentStatus) && (
                        <div className="font-bold text-lg text-primary-400 mt-1">
                            {getCountdown()}
                        </div>
                    )}
                </div>

                {/* Mostrar botones solo si está pendiente Y NO es el proponente (el otro usuario decide) */}
                {appointment.status === 'PENDING' && !isOwn && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction('REJECTED')}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition"
                        >
                            {t('appointments.reject_btn')}
                        </button>
                        <button
                            onClick={() => handleAction('ACCEPTED')}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg shadow transition"
                        >
                            {t('appointments.accept_btn')}
                        </button>
                    </div>
                )}

                {/* Opción para cancelar si es el proponente */}
                {appointment.status === 'PENDING' && isOwn && (
                    <button
                        onClick={() => handleAction('CANCELLED')}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                        {t('appointments.cancel_btn')}
                    </button>
                )}
            </div>
        </div>
    )
}
