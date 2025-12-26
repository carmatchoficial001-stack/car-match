'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getRandomTip } from '@/lib/safety-tips'
import { useLanguage } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import AppointmentCard from './AppointmentCard'
import AppointmentModal from './AppointmentModal'

interface Message {
    id: string
    content: string
    senderId: string
    createdAt: string
    sender: {
        id: string
        name: string
        image: string | null
    }
    type: 'MESSAGE' | 'APPOINTMENT'
    // Campos extra para Appointments
    date?: string
    location?: string
    address?: string
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
    proposerId?: string
}



import dynamic from 'next/dynamic'

const SOSComponent = dynamic(() => import('@/components/SOSComponent'), { ssr: false })

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = use(params)
    const { t } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [safetyTip] = useState(getRandomTip())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [chat, setChat] = useState<any>(null)
    const [showAppointmentModal, setShowAppointmentModal] = useState(false)
    const [showSafetyTips, setShowSafetyTips] = useState(false)
    // Estados para Safe Places (agregados para evitar errores)
    const [safePlaces, setSafePlaces] = useState<any[]>([])
    const [showSafePlaces, setShowSafePlaces] = useState(false)
    const [apiTip, setApiTip] = useState('')

    useEffect(() => {
        // Wait for session to load before making decisions
        if (status === 'loading') return

        if (!session) {
            router.push('/auth')
            return
        }

        // Fetch Messages
        fetchMessages()
        // Fetch Chat Details (Participants)
        fetchChatDetails()

        // Polling cada 3 segundos para nuevos mensajes
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [session, status, chatId])

    const fetchChatDetails = async () => {
        try {
            const res = await fetch(`/api/chats/${chatId}`)
            if (res.ok) {
                const data = await res.json()
                setChat(data)
            }
        } catch (error) {
            console.error('Error fetching chat details:', error)
        }
    }

    // Determine if Live Safety Mode should be active
    const activeAppointment = messages.find(m =>
        m.type === 'APPOINTMENT' &&
        m.status === 'ACCEPTED' &&
        new Date(m.date!).toDateString() === new Date().toDateString() // Simple check: Same day
    )
    const isSafetyModeActive = !!activeAppointment
    const otherUserId = chat ? (chat.buyerId === session?.user?.id ? chat.sellerId : chat.buyerId) : ''

    const handleEndMeeting = async () => {
        if (activeAppointment && confirm(t('safety_mode.confirm_end'))) {
            await handleUpdateAppointment(activeAppointment.id, 'COMPLETED')
            fetchMessages()
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chats/${chatId}/messages`)
            if (res.ok) {
                const data = await res.json()
                // Deduplicate messages by ID
                const uniqueMessages = Array.from(
                    new Map<string, Message>(data.map((m: Message) => [m.id, m])).values()
                )
                setMessages(uniqueMessages)
            } else if (res.status === 410) {
                // Vehículo ya no disponible
                const error = await res.json()
                alert(error.error)
            }
        } catch (error) {
            console.error('Error al cargar mensajes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })

            if (res.ok) {
                const message = await res.json()
                setMessages(prev => [...prev, message])
                setNewMessage('')
            } else if (res.status === 410) {
                const error = await res.json()
                alert(error.error)
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error)
        } finally {
            setSending(false)
        }
    }

    const loadSafePlaces = async () => {
        try {
            let queryParams = ''

            // Intentar obtener ubicación del usuario para calcular punto medio
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        maximumAge: 60000
                    })
                })
                queryParams = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            } catch (e) {
                console.log('No se pudo obtener ubicación del usuario, usando solo ubicación del vehículo')
            }

            const res = await fetch(`/api/chats/${chatId}/safe-places${queryParams}`)
            if (res.ok) {
                const data = await res.json()
                setSafePlaces(data.suggestions)
                if (data.tip) setApiTip(data.tip)
                setShowSafePlaces(true)
            }
        } catch (error) {
            console.error('Error al cargar lugares seguros:', error)
        }
    }

    const handleCreateAppointment = async (data: any) => {
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    ...data
                })
            })

            if (res.ok) {
                setShowAppointmentModal(false)
                fetchMessages() // Recargar para ver la cita
            }
        } catch (error) {
            console.error('Error creating appointment:', error)
        }
    }

    const handleUpdateAppointment = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                // Actualizar estado localmente
                setMessages(prev => prev.map(m => {
                    if (m.id === id) return { ...m, status: status as any }
                    return m
                }))
            }
        } catch (error) {
            console.error('Error updating appointment:', error)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const isSeller = chat?.vehicle?.user?.id === session?.user?.id

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-text-secondary">{t('messages.loading_chat')}</div>
            </div>
        )
    }

    return (
        <>
            <Header />
            <div className="flex bg-background h-[calc(100dvh-64px-5rem)] md:h-[calc(100vh-64px)] overflow-hidden">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    <SOSComponent
                        isActive={isSafetyModeActive}
                        otherUserId={otherUserId}
                        onEndMeeting={handleEndMeeting}
                    />
                    {/* Header */}
                    <div className="bg-surface border-b border-surface-highlight p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <Link href="/messages" className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-background rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </Link>
                            {chat && (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center overflow-hidden">
                                            {chat.vehicle.user.image ? (
                                                <img src={chat.vehicle.user.image} alt={chat.vehicle.user.name || ''} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-text-secondary">
                                                    {(chat.vehicle.user.name || '?')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-text-primary">{chat.vehicle.user.name}</h2>
                                        <p className="text-xs text-text-secondary line-clamp-1">{chat.vehicle.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowSafetyTips(!showSafetyTips)}
                            className={`p-2 rounded-full transition-colors flex items-center gap-2 ${showSafetyTips ? 'bg-primary-100 text-primary-700' : 'text-text-secondary hover:bg-surface-highlight'}`}
                            title={t('messages.safety_shield')}
                        >
                            <span className="hidden md:inline text-sm font-bold">{t('messages.safety_shield')}</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 bg-background scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {messages.map((message) => {
                                const isOwnMessage = message.senderId === session?.user?.id

                                return (
                                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            {!isOwnMessage && (
                                                <div className="flex-shrink-0">
                                                    {message.sender?.image ? (
                                                        <img src={message.sender.image} alt={message.sender.name || '?'} className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white">
                                                            {(message.sender?.name || '?')[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {message.type === 'APPOINTMENT' ? (
                                                <AppointmentCard
                                                    appointment={message as any}
                                                    isOwn={isOwnMessage}
                                                    onUpdateStatus={handleUpdateAppointment}
                                                />
                                            ) : (
                                                <div className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                                    ? 'bg-primary-600 text-white rounded-tr-sm'
                                                    : 'bg-surface border border-surface-highlight text-text-primary rounded-tl-sm'
                                                    }`}>
                                                    {!isOwnMessage && (
                                                        <div className="text-xs font-bold mb-1 opacity-70">
                                                            {message.sender?.name}
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap text-sm">{message.content.replace('[ACTION:SCHEDULE]', '').trim()}</p>

                                                    {message.content.includes('[ACTION:SCHEDULE]') && !isOwnMessage && (
                                                        <button
                                                            onClick={() => loadSafePlaces()}
                                                            className="mt-3 w-full text-xs bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2 shadow-sm font-bold animate-pulse"
                                                        >
                                                            📅 {t('messages.suggest_safe_places')}
                                                        </button>
                                                    )}

                                                    <span className={`text-[10px] block text-right mt-1 ${isOwnMessage ? 'text-primary-200' : 'text-text-secondary'
                                                        }`}>
                                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="bg-surface border-t border-surface-highlight p-4 shrink-0">
                        <div className="max-w-4xl mx-auto">
                            {chat?.vehicle.status && chat.vehicle.status !== 'ACTIVE' && (
                                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs text-center font-bold">
                                    ⚠️ Vehículo no disponible. No puedes enviar mensajes.
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                {/* Actions Button Group */}
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={loadSafePlaces}
                                        className="p-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                        title={t('messages.suggest_safe_places')}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAppointmentModal(true)}
                                        className="p-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                        title="Agendar Cita"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex-1 bg-background border border-surface-highlight rounded-xl flex items-center px-4 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={t('messages.write_message')}
                                        className="flex-1 bg-transparent py-3 focus:outline-none text-text-primary"
                                        disabled={sending || (chat?.vehicle.status && chat.vehicle.status !== 'ACTIVE')}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending || (chat?.vehicle.status && chat.vehicle.status !== 'ACTIVE')}
                                    className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-900/20"
                                >
                                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Safety Tips Sidebar - Fixed right side */}
                <div className={`fixed inset-y-0 right-0 w-80 bg-surface border-l border-surface-highlight shadow-2xl transform transition-transform duration-300 z-30 lg:relative lg:shadow-none lg:translate-x-0 ${showSafetyTips ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-surface-highlight flex justify-between items-center bg-accent-500/10">
                            <h3 className="font-bold text-lg text-accent-500 flex items-center gap-2">
                                <span>🛡️</span>
                                {t('messages.safety_shield')}
                            </h3>
                            <button onClick={() => setShowSafetyTips(false)} className="lg:hidden text-text-secondary">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Role Specific Tips */}
                            <div className="bg-primary-900/10 rounded-xl p-4 border border-primary-900/20">
                                <h4 className="font-bold text-primary-700 mb-3 text-sm uppercase tracking-wider">
                                    {isSeller ? t('messages.tips.seller.title') : t('messages.tips.buyer.title')}
                                </h4>
                                <ul className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <li key={i} className="text-sm text-text-secondary flex gap-2 items-start">
                                            <span className="text-primary-500 font-bold text-lg leading-none">•</span>
                                            <span className="leading-snug">{t(`messages.tips.${isSeller ? 'seller' : 'buyer'}.t${i}`)}</span>
                                        </li>
                                    ))}
                                    {!isSeller && (
                                        <li className="text-sm text-text-secondary flex gap-2 items-start">
                                            <span className="text-primary-500 font-bold text-lg leading-none">•</span>
                                            <span className="leading-snug">{t(`messages.tips.buyer.t6`)}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* General Warning */}
                            <div className="bg-yellow-900/10 rounded-xl p-4 border border-yellow-900/20">
                                <h4 className="font-bold text-yellow-700 mb-2 text-sm uppercase tracking-wider">⚠️ {t('messages.tips.general.title')}</h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {t('messages.tips.general.desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div >



                {/* Appointment Modal */}
                {
                    showAppointmentModal && (
                        <AppointmentModal
                            chatId={chatId}
                            onClose={() => setShowAppointmentModal(false)}
                            onSubmit={handleCreateAppointment}
                        />
                    )
                }
            </div >
        </>
    )
}
