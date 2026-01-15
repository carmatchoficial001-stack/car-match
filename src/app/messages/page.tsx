'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import { formatPrice } from '@/lib/vehicleTaxonomy'

interface Chat {
    id: string
    vehicleId: string
    otherUser: {
        id: string
        name: string
        image: string | null
    }
    vehicle: {
        id: string
        title: string
        brand: string
        model: string
        year: number
        price: number
        images: string[]
        city: string
        status: string
    }
    lastMessage?: {
        id: string
        content: string
        createdAt: string
        senderId: string
    }
    isBuyer: boolean
    updatedAt: string
    unreadCount: number
}

export default function MessagesPage() {
    const { t, locale } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()
    const [chats, setChats] = useState<Chat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'loading') return

        if (!session) {
            router.push('/auth')
            return
        }

        fetchChats()
    }, [session, status])

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats')
            if (res.ok) {
                const data = await res.json()
                setChats(data)
            }
        } catch (error) {
            console.error('Error al cargar chats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-text-secondary">{t('messages.loading_chats')}</div>
                </div>
            </div>
        )
    }

    if (chats.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-center max-w-md">
                        <svg className="w-24 h-24 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h2 className="text-xl font-bold text-text-primary mb-2">{t('messages.no_chats')}</h2>
                        <p className="text-text-secondary mb-6 pl-2 pr-2">
                            Cuando contactes a vendedores sobre vehículos, tus conversaciones aparecerán aquí.
                        </p>
                        <a
                            href="/swipe"
                            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                        >
                            Explorar Vehículos
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 pt-8 pb-32 max-w-4xl">
                <h1 className="text-3xl font-bold text-text-primary mb-6">Mensajes</h1>

                <div className="space-y-4">
                    {chats.map((chat) => {
                        const vehicleImage = chat.vehicle.images[0] || '/placeholder-car.png'
                        const timeSince = getTimeSince(new Date(chat.updatedAt))

                        return (
                            <a
                                key={chat.id}
                                href={`/messages/${chat.id}`}
                                className={`block bg-surface border rounded-xl p-4 hover:bg-surface-highlight transition relative ${chat.unreadCount > 0 ? 'border-primary-500/50' : 'border-surface-highlight'
                                    }`}
                            >
                                {/* Badge de mensajes no leídos */}
                                {chat.unreadCount > 0 && (
                                    <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-background">
                                        {chat.unreadCount}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    {/* Imagen del vehículo */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={vehicleImage}
                                            alt={chat.vehicle.title}
                                            className="w-24 h-24 rounded-xl object-cover"
                                        />
                                    </div>

                                    {/* Info del chat */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h3 className={`text-text-primary text-lg leading-tight ${chat.unreadCount > 0 ? 'font-black' : 'font-bold'
                                                    }`}>
                                                    {chat.vehicle.brand} {chat.vehicle.model} {chat.vehicle.year}
                                                </h3>
                                                <div className="text-[10px] text-text-secondary whitespace-nowrap pt-1">
                                                    {timeSince}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-1">
                                                {chat.otherUser.image ? (
                                                    <img
                                                        src={chat.otherUser.image}
                                                        alt={chat.otherUser.name}
                                                        className="w-5 h-5 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 bg-primary-500 rounded-md flex items-center justify-center text-[10px] text-white">
                                                        {chat.otherUser.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-xs text-text-secondary truncate">
                                                    {chat.isBuyer ? 'Vendedor' : 'Comprador'}: {chat.otherUser.name}
                                                </span>
                                            </div>

                                            {chat.lastMessage && (
                                                <p className={`text-sm text-text-secondary truncate max-w-[200px] sm:max-w-md ${chat.unreadCount > 0 ? 'font-semibold text-text-primary' : ''
                                                    }`}>
                                                    {chat.lastMessage.content}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            {chat.vehicle.status !== 'ACTIVE' ? (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${chat.vehicle.status === 'SOLD'
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {chat.vehicle.status === 'SOLD' ? 'Vendido' : 'No Disponible'}
                                                </span>
                                            ) : (
                                                <div /> // Placeholder
                                            )}
                                            <div className="text-xl font-black text-primary-500" suppressHydrationWarning>
                                                {formatPrice(chat.vehicle.price, 'MXN', locale)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function getTimeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Ahora'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return `${Math.floor(seconds / 604800)}sem`
}
