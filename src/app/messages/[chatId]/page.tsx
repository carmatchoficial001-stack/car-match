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
import SOSComponent from './SOSComponent'
import dynamic from 'next/dynamic'

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
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
    proposerId?: string
}

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = use(params)
    const { t } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()

    // States
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [safetyTip] = useState(getRandomTip())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [chat, setChat] = useState<any>(null)
    const [showAppointmentModal, setShowAppointmentModal] = useState(false)
    const [editingAppointment, setEditingAppointment] = useState<any>(null)
    const [isEmergencyActive, setIsEmergencyActive] = useState(false)
    const [showSafetyTips, setShowSafetyTips] = useState(false)
    const [safePlaces, setSafePlaces] = useState<any[]>([])
    const [apiTip, setApiTip] = useState('')

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/auth')
            return
        }
        fetchMessages()
        fetchChatDetails()
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
        new Date(m.date!).toDateString() === new Date().toDateString() // Mismo día
    )
    const isSafetyModeActive = !!activeAppointment
    const currentUser = chat ? (chat.buyerId === session?.user?.id ? chat.buyer : chat.seller) : null
    const otherUserId = chat ? (chat.buyerId === session?.user?.id ? chat.sellerId : chat.buyerId) : ''

    const handleActivateSOS = () => {
        setIsEmergencyActive(true)
    }

    const handleEndMeeting = async () => {
        if (activeAppointment && confirm(t('messages.safety_mode.confirm_end'))) {
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
                const uniqueMessages = Array.from(
                    new Map<string, Message>(data.map((m: Message) => [m.id, m])).values()
                )
                setMessages(uniqueMessages)
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
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                })
                queryParams = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            } catch (e) { }

            const res = await fetch(`/api/chats/${chatId}/safe-places${queryParams}`)
            if (res.ok) {
                const data = await res.json()
                setSafePlaces(data.suggestions)
                if (data.tip) setApiTip(data.tip)
                setShowAppointmentModal(true) // Abrir directamente el modal para proponer
            }
        } catch (error) {
            console.error('Error al cargar lugares seguros:', error)
        }
    }

    const handleAppointmentSubmit = async (data: any) => {
        try {
            const url = editingAppointment
                ? `/api/appointments/${editingAppointment.id}`
                : `/api/chats/${chatId}/appointments`

            const method = editingAppointment ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setShowAppointmentModal(false)
                setEditingAppointment(null)
                fetchMessages()
                router.refresh()
            }
        } catch (error) {
            console.error('Error handling appointment:', error)
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
                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    <SOSComponent
                        chatId={chatId}
                        activeAppointmentId={activeAppointment?.id}
                        isEmergencyActive={isEmergencyActive}
                        onActivateSOS={handleActivateSOS}
                        trustedContact={currentUser?.trustedContact}
                    />

                    {/* Header del Chat */}
                    <div className="bg-surface border-b border-surface-highlight p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <Link href="/messages" className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-background rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </Link>
                            {chat && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center overflow-hidden shrink-0">
                                        {chat.vehicle.user.image ? (
                                            <img src={chat.vehicle.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-text-secondary uppercase">{(chat.vehicle.user.name || '?')[0]}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-text-primary truncate">{chat.vehicle.user.name}</h2>
                                        <p className="text-xs text-text-secondary truncate">{chat.vehicle.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banner de Monitoreo (Modo Live) */}
                    {isSafetyModeActive && activeAppointment && (
                        <div className="bg-primary-950/40 border-b border-primary-500/20 p-3 shadow-inner shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-primary-400 mb-0.5 uppercase tracking-wider">🛡️ {t('messages.safety_mode.active')}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-text-primary">
                                            {new Date(activeAppointment.date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-text-secondary truncate italic">📍 {activeAppointment.location}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingAppointment(activeAppointment);
                                            setShowAppointmentModal(true);
                                        }}
                                        className="p-2 bg-surface-highlight/50 rounded-xl text-primary-400 hover:bg-surface transition shadow-sm"
                                        title="Editar cita"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleEndMeeting}
                                        className="px-3 py-1.5 bg-background border border-surface-highlight rounded-xl text-[10px] font-black uppercase text-text-secondary hover:text-red-400 transition"
                                    >
                                        {t('messages.safety_mode.end_btn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 bg-background scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {messages.map((message) => {
                                const isOwnMessage = message.senderId === session?.user?.id
                                const isSystem = message.senderId === 'SYSTEM'

                                return (
                                    <div key={message.id} className={`flex ${isSystem ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        {isSystem ? (
                                            <div className="bg-red-900/20 border border-red-500/30 px-4 py-2 rounded-xl text-[11px] text-red-400 font-bold max-w-[90%] text-center italic">
                                                {message.content}
                                            </div>
                                        ) : (
                                            <div className={`max-w-[85%] flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isOwnMessage && (
                                                    <div className="flex-shrink-0">
                                                        {message.sender?.image ? (
                                                            <img src={message.sender.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-xs text-white font-bold uppercase">
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
                                                        {!isOwnMessage && <div className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wider">{message.sender?.name}</div>}
                                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                                        <span className="text-[9px] block text-right mt-1 opacity-60">
                                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="bg-surface border-t border-surface-highlight p-2 sm:p-4 shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-1 sm:gap-2">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowSafetyTips(!showSafetyTips)}
                                        className={`p-2.5 rounded-xl transition-colors ${showSafetyTips ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'}`}
                                        title={t('messages.safety_shield')}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loadSafePlaces()}
                                        disabled={chat?.vehicle?.status !== 'ACTIVE'}
                                        className={`p-2.5 rounded-xl transition-colors ${chat?.vehicle?.status !== 'ACTIVE' ? 'opacity-30 cursor-not-allowed text-gray-400' : 'text-primary-600 hover:bg-primary-50'}`}
                                        title="Proponer Cita Segura"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                                <div className="flex-1 bg-background border border-surface-highlight rounded-xl flex items-center px-4 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={chat?.vehicle?.status === 'ACTIVE' ? t('messages.write_message') : 'Vehículo no disponible para consulta'}
                                        className="flex-1 bg-transparent py-3 focus:outline-none text-text-primary text-sm shadow-inner disabled:opacity-50"
                                        disabled={sending || chat?.vehicle?.status !== 'ACTIVE'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending || chat?.vehicle?.status !== 'ACTIVE'}
                                    className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg active:scale-95 shrink-0 disabled:opacity-50 disabled:bg-gray-700"
                                >
                                    <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                            {chat?.vehicle?.status !== 'ACTIVE' && (
                                <div className="mt-3 p-3 bg-red-900/10 border border-red-500/20 rounded-xl text-center">
                                    <p className="text-xs text-red-400 font-bold flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Este vehículo ya no está disponible para nuevas consultas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar de Tips de Seguridad */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 bg-black/50 lg:hidden ${showSafetyTips ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowSafetyTips(false)} />
            <div className={`fixed bottom-0 left-0 right-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-96 bg-surface border-t lg:border-t-0 lg:border-l border-surface-highlight shadow-2xl transform transition-transform duration-300 z-[101] rounded-t-[2.5rem] lg:rounded-none h-[80vh] lg:h-full ${showSafetyTips ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}`}>
                <div className="h-full flex flex-col p-6">
                    <div className="w-12 h-1.5 bg-surface-highlight rounded-full mx-auto mb-4 lg:hidden" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-2xl text-text-primary flex items-center gap-2">
                            <span className="text-primary-500">🛡️</span> {isSeller ? t('messages.tips.seller.title') : t('messages.tips.buyer.title')}
                        </h3>
                        <button onClick={() => setShowSafetyTips(false)} className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary">&times;</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
                        {Array.from({ length: isSeller ? 15 : 16 }).map((_, idx) => (
                            <div key={idx} className="bg-surface-highlight/40 p-4 rounded-2xl border border-white/5 flex gap-4">
                                <div className="w-6 h-6 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 text-xs font-bold">{idx + 1}</div>
                                <p className="text-text-primary text-sm">{t(`messages.tips.${isSeller ? 'seller' : 'buyer'}.t${idx + 1}`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAppointmentModal && (
                <AppointmentModal
                    chatId={chatId}
                    initialAppointment={editingAppointment}
                    onClose={() => { setShowAppointmentModal(false); setEditingAppointment(null); }}
                    onSubmit={handleAppointmentSubmit}
                />
            )}
        </>
    )
}
