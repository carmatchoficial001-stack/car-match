'use client'

import { useState } from 'react'
import { Calendar, MapPin, Clock } from 'lucide-react'

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
}

export default function AppointmentCard({ appointment, isOwn, onUpdateStatus }: AppointmentCardProps) {
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
    const formattedDate = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    const formattedTime = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    const statusColors = {
        PENDING: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
        ACCEPTED: 'bg-green-500/10 border-green-500/30 text-green-600',
        REJECTED: 'bg-red-500/10 border-red-500/30 text-red-600',
        CANCELLED: 'bg-gray-500/10 border-gray-500/30 text-gray-600',
        COMPLETED: 'bg-blue-500/20 border-blue-500/40 text-blue-400'
    }

    const statusText = {
        PENDING: 'Pendiente',
        ACCEPTED: 'Confirmada',
        REJECTED: 'Rechazada',
        CANCELLED: 'Cancelada',
        COMPLETED: 'Finalizada'
    }

    const currentStatus = appointment.status?.toUpperCase() as keyof typeof statusText || 'PENDING'

    return (
        <div className={`p-4 rounded-xl border ${statusColors[currentStatus] || 'bg-surface border-surface-highlight'} w-full max-w-sm shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 opacity-70" />
                <span className="font-bold">Propuesta de Cita</span>
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
                <div className="font-medium text-sm text-text-primary">
                    Estado: <span className={`font-black uppercase tracking-wider ${currentStatus === 'ACCEPTED' ? 'text-green-500' : ''}`}>
                        {statusText[currentStatus] || currentStatus}
                    </span>
                </div>

                {/* Mostrar botones solo si está pendiente Y NO es el proponente (el otro usuario decide) */}
                {appointment.status === 'PENDING' && !isOwn && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction('REJECTED')}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition"
                        >
                            Rechazar
                        </button>
                        <button
                            onClick={() => handleAction('ACCEPTED')}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg shadow transition"
                        >
                            Aceptar
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
                        Cancelar
                    </button>
                )}
            </div>
        </div>
    )
}
