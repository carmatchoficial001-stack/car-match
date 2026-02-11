// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, ThumbsUp, Star, Search, Eye, CheckCircle, Handshake, Calendar, RefreshCw, X, Bell } from 'lucide-react'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link: string | null
    isRead: boolean
    createdAt: string
    metadata: any
}

interface NotificationsDropdownProps {
    isOpen: boolean
    onClose: () => void
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)

                // Auto-marcar todas como leídas al abrir el dropdown
                if (data.some((n: Notification) => !n.isRead)) {
                    await fetch('/api/notifications', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ markAllAsRead: true })
                    })
                }
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (notification.link) {
            router.push(notification.link)
            onClose()
        }
    }

    const getIcon = (type: string) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case 'NEW_MESSAGE':
                return <MessageCircle className={iconClass + " text-blue-400"} />
            case 'ENGAGEMENT_FAVORITES':
            case 'FAVORITE':
            case 'VEHICLE_FAVORITED':
                return <ThumbsUp className={iconClass + " text-primary-400"} />
            case 'BUSINESS_FAVORITED':
                return <ThumbsUp className={iconClass + " text-primary-400"} />
            case 'BUSINESS_VIEWED':
                return <Star className={iconClass + " text-yellow-400"} />
            case 'BUSINESS_SEARCHED':
                return <Search className={iconClass + " text-primary-400"} />
            case 'VEHICLE_VIEWED':
                return <Eye className={iconClass + " text-cyan-400"} />
            case 'VEHICLE_REACTIVATED':
                return <CheckCircle className={iconClass + " text-green-400"} />
            case 'VEHICLE_SOLD':
                return <Handshake className={iconClass + " text-green-500"} />
            case 'APPOINTMENT_REQUEST':
                return <Calendar className={iconClass + " text-purple-400"} />
            case 'APPOINTMENT_MODIFIED':
                return <RefreshCw className={iconClass + " text-amber-400"} />
            case 'APPOINTMENT_ACCEPTED':
                return <CheckCircle className={iconClass + " text-green-400"} />
            case 'APPOINTMENT_REJECTED':
                return <X className={iconClass + " text-red-400"} />
            default:
                return <Bell className={iconClass + " text-primary-400"} />
        }
    }

    const getTimeAgo = (date: string) => {
        const now = new Date()
        const created = new Date(date)
        const diff = now.getTime() - created.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor(diff / (1000 * 60))

        if (hours === 0) {
            if (minutes === 0) return 'Ahora'
            return `Hace ${minutes}m`
        }
        if (hours < 24) return `Hace ${hours}h`
        const days = Math.floor(hours / 24)
        return `Hace ${days}d`
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown */}
            <div className="fixed top-20 sm:top-auto sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-96 bg-surface rounded-xl shadow-2xl border border-surface-highlight overflow-hidden z-50 max-h-[calc(100vh-120px)] sm:max-h-[600px] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-surface border-b border-surface-highlight px-4 py-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary">Notificaciones</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-surface-highlight transition flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-text-secondary mt-3">Cargando...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="font-bold text-text-primary mb-1">No tienes notificaciones</p>
                            <p className="text-sm text-text-secondary">Te avisaremos cuando haya actividad</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-surface-highlight">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="w-full p-4 hover:bg-surface-highlight transition text-left flex gap-3"
                                >
                                    <div className="flex-shrink-0 p-2 bg-surface-highlight rounded-lg">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-text-primary text-sm mb-0.5 line-clamp-1">
                                            {notification.title}
                                        </p>
                                        <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-primary-400 mt-1">
                                            {getTimeAgo(notification.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Información sobre auto-borrado */}
                {notifications.length > 0 && (
                    <div className="sticky bottom-0 bg-surface-highlight/50 backdrop-blur-sm border-t border-surface-highlight px-4 py-2">
                        <p className="text-xs text-text-secondary text-center">
                            Las notificaciones se eliminan después de 24 horas
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}
