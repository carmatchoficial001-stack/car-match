// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Header from '@/components/Header'

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

export default function NotificationsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t } = useLanguage()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Wait for session to load before checking authentication
        if (status === 'loading') return

        if (!session) {
            router.push('/auth')
            return
        }

        fetchNotifications()
    }, [session, status])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)

                // Marcar todas como leídas después de un breve delay
                setTimeout(markAllAsRead, 2000)
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true })
            })

            // Actualizar estado local
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (error) {
            console.error('Error al marcar como leídas:', error)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_MESSAGE':
                return '💬'
            case 'ENGAGEMENT_FAVORITES':
                return '❤️'
            case 'VEHICLE_REACTIVATED':
                return '✅'
            case 'VEHICLE_SOLD':
                return 'ðŸ¤'
            default:
                return '🔔'
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                    <div className="text-text-secondary">{t('notifications.loading')}</div>
                </div>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary mb-2">{t('notifications.empty_title')}</h2>
                        <p className="text-text-secondary">
                            {t('notifications.empty_text')}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-text-primary">{t('notifications.title')}</h1>
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-primary-700 hover:text-primary-400 font-medium"
                    >
                        {t('notifications.mark_read')}
                    </button>
                </div>

                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`
                                relative p-4 rounded-xl border transition cursor-pointer
                                ${notification.isRead
                                    ? 'bg-surface border-surface-highlight hover:border-primary-700/30'
                                    : 'bg-surface-highlight/50 border-primary-700/50 hover:bg-surface-highlight'}
                            `}
                        >
                            <div className="flex gap-4">
                                <div className="text-3xl flex-shrink-0 pt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className={`font-bold text-text-primary ${!notification.isRead && 'text-primary-400'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-text-secondary whitespace-nowrap">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary-700 rounded-full"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

