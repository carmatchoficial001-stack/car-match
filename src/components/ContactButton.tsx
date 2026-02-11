// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRestoreSessionModal } from '@/hooks/useRestoreSessionModal'

interface ContactButtonProps {
    vehicleId: string
    sellerId: string
    vehicleTitle: string
    status?: string
    variant?: 'default' | 'minimal' | 'icon'
    label?: string
    className?: string
}

export default function ContactButton({
    vehicleId,
    sellerId,
    vehicleTitle,
    status,
    variant = 'default',
    label,
    className = ''
}: ContactButtonProps) {
    const { data: session } = useSession()
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const { openModal } = useRestoreSessionModal()

    const handleContact = async () => {
        // 🔥 RESTAURAR SESIÓN: Si hay sesión pero está en "Modo Invitado", la activamos
        const isSoftLogout = document.cookie.includes('soft_logout=true') || localStorage.getItem('soft_logout') === 'true'
        if (session && isSoftLogout) {
            openModal(
                "¿Deseas reactivar tu sesión para enviar este mensaje? Tu cuenta sigue vinculada.",
                () => executeContact()
            )
            return
        }

        await executeContact()
    }

    const executeContact = async () => {
        if (!session) {
            // Redirigir a login con callbackUrl para volver aquí
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
            router.push(`/auth?callbackUrl=${encodeURIComponent(currentPath)}`)
            return
        }


        setLoading(true)
        try {
            console.log('Iniciando contacto para vehículo:', vehicleId)
            // Crear o abrir chat existente
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleId })
            })

            console.log('Respuesta status:', res.status)

            if (res.ok) {
                const chat = await res.json()
                router.push(`/messages/${chat.id}`)
            } else {
                let errorMessage
                try {
                    const errorData = await res.json()
                    errorMessage = errorData.error
                } catch (jsonError) {
                    console.error('Error parseando JSON de error:', jsonError)
                    errorMessage = 'Error desconocido del servidor (' + res.status + ')'
                }
                alert('Error al crear chat: ' + (errorMessage || t('common.errors.chat_creation')))
            }
        } catch (error: any) {
            console.error('Error al contactar:', error)
            alert('Error de conexión: ' + (error.message || t('common.errors.connection')))
        } finally {
            setLoading(false)
        }
    }

    // No mostrar si es tu propio vehículo (Solo si la sesión está ACTIVA y NO en soft logout)
    const isSoftLogout = typeof document !== 'undefined' && (document.cookie.includes('soft_logout=true') || localStorage.getItem('soft_logout') === 'true')

    if (session?.user?.id === sellerId && !isSoftLogout) {
        return null
    }

    if (status && status !== 'ACTIVE') {
        return (
            <button
                disabled
                className="w-full px-4 py-3 bg-gray-600 text-gray-300 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Vehículo No Disponible
            </button>
        )
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleContact}
                disabled={loading}
                title="Mensaje"
                className={`p-2 bg-primary-700/10 text-primary-700 rounded-lg hover:bg-primary-700/20 transition disabled:opacity-50 ${className}`}
            >
                {loading ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>
        )
    }

    if (variant === 'minimal') {
        return (
            <button
                onClick={handleContact}
                disabled={loading}
                className={`flex items-center gap-2 text-primary-500 font-bold hover:text-primary-400 transition text-sm ${className}`}
            >
                {loading ? '⌛' : '💬 Mensaje'}
            </button>
        )
    }

    return (
        <button
            onClick={handleContact}
            disabled={loading}
            className={`w-full px-4 py-3 bg-primary-700 text-white rounded-xl font-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Conectando...
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {label || t('vehicle.contact_seller')}
                </>
            )}
        </button>
    )
}

