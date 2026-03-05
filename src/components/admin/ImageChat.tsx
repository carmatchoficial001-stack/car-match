'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Sparkles, Download, Copy, Check, ImagePlus,
    Loader2, X, ChevronDown, ExternalLink, Zap, Palette,
    Camera, Layers, RefreshCw, Trash2, Plus, MessageSquare, History
} from 'lucide-react'
import { chatWithImageDirector } from '@/app/admin/actions/image-chat-actions'
import { getStudioConversations, getStudioHistory, saveStudioMessage, createStudioConversation, deleteStudioConversation, clearStudioHistory, resetStudioMessageStatus } from '@/app/admin/actions/studio-history-actions'

import { AD_PLATFORMS } from '@/lib/admin/constants'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    type?: 'CHAT' | 'PROMPT_READY' | 'IMAGE_READY'
    images?: Record<string, string>
    imagePrompt?: string
    platforms?: Record<string, any>
    timestamp: Date
}

const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string }> = AD_PLATFORMS.reduce((acc, p) => ({
    ...acc,
    [p.id]: { name: p.label, icon: p.icon, color: p.color.replace('bg-', 'from-').replace(' ', ' to-') }
}), {})

const QUICK_PRESETS = [
    { label: '🏎️ Auto de Lujo', prompt: 'Un auto de lujo deportivo estilo Lamborghini en una ciudad nocturna con luces de neón' },
    { label: '🔥 Drift Urbano', prompt: 'Un auto haciendo drift en una calle urbana con humo y luces de ciudad de fondo' },
    { label: '⛰️ Off-Road', prompt: 'Una camioneta 4x4 todo terreno en un paisaje montañoso épico al atardecer' },
    { label: '🌙 Deportivo Nocturno', prompt: 'Un auto deportivo de carreras bajo la lluvia nocturna con reflejos de luces en el asfalto' },
    { label: '🏁 Clásico Restaurado', prompt: 'Un auto clásico americano de los 60s completamente restaurado en un garage vintage' },
    { label: '⚡ Eléctrico Futurista', prompt: 'Un auto eléctrico futurista concept car en un escenario minimalista de estudio' },
]

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ImageChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [conversations, setConversations] = useState<any[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Default closed on mobile
    const [isMobile, setIsMobile] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            setIsSidebarOpen(!mobile) // Open by default on desktop, closed on mobile
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // 🔄 LOAD CONVERSATIONS ON MOUNT
    useEffect(() => {
        const loadInitialData = async () => {
            const res = await getStudioConversations()
            if (res.success && res.conversations) {
                setConversations(res.conversations)
                // We no longer auto-load the first conversation to ensure a "New Chat" feel
                // If the user wants history, they can use the sidebar
            }
        }
        loadInitialData()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [activeConversationId])

    const handleSelectConversation = async (id: string) => {
        setActiveConversationId(id)
        setIsLoading(true)
        const res = await getStudioHistory(id)
        if (res.success && res.messages) {
            setMessages(res.messages)
        }
        setIsLoading(false)
    }

    // 🔄 POLL FOR GENERATING MESSAGES
    useEffect(() => {
        if (!activeConversationId) return

        const hasGenerating = messages.some(m => m.images && (m.images as any)._status?.startsWith('generating'))
        if (!hasGenerating) return

        console.log('[IMAGE-CHAT] Detectada generación activa, iniciando sondeo...')
        const timer = setInterval(async () => {
            const res = await getStudioHistory(activeConversationId)
            if (res.success && res.messages) {
                // Check if still generating
                const stillGenerating = res.messages.some(m => m.images && (m.images as any)._status?.startsWith('generating'))
                setMessages(res.messages)

                if (!stillGenerating) {
                    console.log('[IMAGE-CHAT] Generación completada, deteniendo sondeo.')
                    clearInterval(timer)
                }
            }
        }, 3000)

        return () => clearInterval(timer)
    }, [messages, activeConversationId])

    const handleNewChat = async () => {
        setIsLoading(true)
        const res = await createStudioConversation("Nueva Idea")
        if (res.success && res.conversation) {
            setConversations(prev => [res.conversation, ...prev])
            setActiveConversationId(res.conversation.id)
            setMessages([])
        }
        setIsLoading(false)
    }

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('¿Eliminar esta conversación?')) return

        const res = await deleteStudioConversation(id)
        if (res.success) {
            setConversations(prev => prev.filter(c => c.id !== id))
            if (activeConversationId === id) {
                setMessages([])
                setActiveConversationId(null)
            }
        }
    }

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim()
        if (!messageText || isLoading) return

        let currentConvId = activeConversationId

        // If no active conversation, create one first
        if (!currentConvId) {
            const res = await createStudioConversation(messageText.substring(0, 30))
            if (res.success && res.conversation) {
                currentConvId = res.conversation.id
                setActiveConversationId(currentConvId)
                setConversations(prev => [res.conversation, ...prev])
            } else return
        }

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        // 🛡️ PERSIST USER MESSAGE
        saveStudioMessage({
            conversationId: currentConvId,
            role: 'user',
            content: messageText
        })

        try {
            const history = [...messages, userMsg].map(m => ({
                role: m.role,
                content: m.content
            }))

            const result = await chatWithImageDirector(history, currentConvId as string)

            if (result.success === false) {
                setMessages(prev => [...prev, {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: result.message || 'Ocurrió un error al generar las imágenes.',
                    timestamp: new Date()
                }])
                setIsLoading(false)
                return
            }

            const assistantMsg: ChatMessage = {
                id: result.messageId || `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.message || '',
                type: result.type,
                imagePrompt: result.type === 'PROMPT_READY' ? result.imagePrompt : undefined,
                images: result.images || {},
                platforms: result.type === 'PROMPT_READY' ? result.platforms : undefined,
                timestamp: new Date()
            }

            // 🛡️ PERSIST ASSISTANT MESSAGE (Only if not already handled by the action)
            if (!result.messageId) {
                saveStudioMessage({
                    conversationId: currentConvId as string,
                    role: 'assistant',
                    content: assistantMsg.content,
                    type: assistantMsg.type,
                    imagePrompt: assistantMsg.imagePrompt,
                    images: assistantMsg.images,
                    platforms: assistantMsg.platforms
                })
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error: any) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `❌ Error: ${error.message || 'Algo salió mal'}`,
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearHistory = async () => {
        if (!confirm('¿Seguro que quieres borrar TODO el historial?')) return
        setIsLoading(true)
        const res = await clearStudioHistory()
        if (res.success) {
            setMessages([])
            setConversations([])
            setActiveConversationId(null)
        }
        setIsLoading(false)
    }

    const handleVariation = (prompt: string, instruction: string) => {
        handleSend(`Basado en este prompt: "${prompt}", haz esta variación: ${instruction}`)
    }

    const handleOpenWorkspace = (msg: ChatMessage) => {
        const workspaceId = `workspace-${msg.id}`
        if (messages.some(m => m.id === workspaceId)) return
        const workspaceMsg: ChatMessage = {
            id: workspaceId,
            role: 'assistant',
            type: 'IMAGE_READY',
            content: 'Aquí tienes tu Mesa de Trabajo Creativa con los diseños para todas tus redes:',
            images: msg.images,
            platforms: msg.platforms,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, workspaceMsg])
    }

    return (
        <div className="flex h-full bg-[#0A0A0B] overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{
                    width: isSidebarOpen ? (isMobile ? '85%' : 280) : 0,
                    opacity: isSidebarOpen ? 1 : 0,
                    x: isSidebarOpen ? 0 : -20
                }}
                className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'relative'} border-r border-white/5 bg-[#0D0D0E] flex flex-col shrink-0 overflow-hidden transition-all duration-300`}
            >
                <div className="p-4 border-b border-white/5">
                    <button
                        onClick={handleNewChat}
                        disabled={isLoading}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 mb-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Conversación
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    <div className="px-2 mb-4">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <History className="w-3 h-3" /> Recientes
                        </span>
                    </div>
                    {conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={`w-full group px-3 py-3 rounded-xl flex items-center justify-between text-left transition-all ${activeConversationId === conv.id
                                ? 'bg-violet-500/10 border border-violet-500/20 text-white'
                                : 'text-zinc-500 hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeConversationId === conv.id ? 'text-violet-400' : 'text-zinc-600'}`} />
                                <span className="text-[11px] font-bold truncate tracking-tight">{conv.title}</span>
                            </div>
                            <Trash2
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="w-3.5 h-3.5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                            />
                        </button>
                    ))}
                </div>

                {conversations.length > 0 && (
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={handleClearHistory}
                            disabled={isLoading}
                            className="w-full flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-red-400 text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Borrar Todo
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 md:p-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
                            >
                                <History className={`w-4 h-4 transition-transform ${isSidebarOpen && !isMobile ? 'rotate-0' : ''}`} />
                            </button>
                            <div>
                                <h1 className="text-sm md:text-xl font-black text-white uppercase tracking-tight md:tracking-tighter mb-0.5 flex items-center gap-2 md:gap-3">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <Palette className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                    </div>
                                    Estudio de Imágenes
                                </h1>
                                <p className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                    {activeConversationId ?
                                        conversations.find(c => c.id === activeConversationId)?.title || "Sesión Activa"
                                        : "Nuevo Concepto Visual"}
                                </p>
                            </div>
                        </div>

                        {/* New Chat Button for Header (Visible on Mobile) */}
                        <div className="flex items-center gap-2">
                            {activeConversationId && (
                                <button
                                    onClick={handleNewChat}
                                    disabled={isLoading}
                                    className="px-3 py-2 md:px-4 md:py-2.5 bg-violet-500 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-violet-600 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20 active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden xs:inline">Nuevo</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 md:space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/10">
                                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-violet-400" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-white mb-2 tracking-tight">¿Qué vamos a crear hoy?</h3>
                            <p className="text-xs md:text-sm text-zinc-500 mb-8 leading-relaxed">
                                Describe tu idea y el Director Creativo diseñará la estética perfecta para tus redes sociales.
                            </p>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {QUICK_PRESETS.slice(0, 4).map((preset, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(preset.prompt)}
                                        className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-left hover:bg-violet-500/10 hover:border-violet-500/20 transition-all text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-white active:scale-95"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <AnimatePresence>
                        {messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {msg.role === 'user' ? (
                                    <UserBubble content={msg.content} />
                                ) : msg.type === 'PROMPT_READY' ? (
                                    <PromptProposalCard
                                        msg={msg}
                                        onOpenWorkspace={handleOpenWorkspace}
                                        onVariation={handleVariation}
                                        onReset={async (id) => {
                                            const res = await resetStudioMessageStatus(id)
                                            if (res.success) {
                                                const hist = await getStudioHistory(activeConversationId!)
                                                if (hist.success) setMessages(hist.messages)
                                            }
                                        }}
                                        isLoading={isLoading}
                                    />
                                ) : msg.type === 'IMAGE_READY' ? (
                                    <CreativeWorkspace msg={msg} />
                                ) : (
                                    <AssistantBubble content={msg.content} />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                            </div>
                            <span className="text-xs text-zinc-500 font-medium animate-pulse">Pensando como un experto...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto flex gap-2 md:gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={isMobile ? "Idea creativa..." : "Nueva idea creativa... ej: Shooting de noche"}
                            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-violet-500/20 shrink-0"
                        >
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] bg-violet-600/10 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm text-white leading-relaxed">{content}</p>
            </div>
        </div>
    )
}

function AssistantBubble({ content }: { content: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%] bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    )
}

function PromptProposalCard({
    msg,
    onOpenWorkspace,
    onVariation,
    isLoading
}: {
    msg: ChatMessage
    onOpenWorkspace: (msg: ChatMessage) => void
    onVariation: (prompt: string, instruction: string) => void
    onReset: (messageId: string) => void
    isLoading: boolean
}) {
    const [copied, setCopied] = useState(false)
    const statusStr = (msg.images as any)?._status || ''
    const isGenerating = statusStr.startsWith('generating')
    const photoCount = (msg.images as any)?._photoCount || 11
    const lastUpdate = (msg.images as any)?._lastUpdate || 0
    const isStuck = isGenerating && lastUpdate > 0 && (Date.now() - lastUpdate) > 2 * 60 * 1000 // 2 minutes without update
    const currentPhotos = Object.keys(msg.images || {}).filter(k => k.startsWith('img_')).length
    const progress = Math.min(100, Math.round((currentPhotos / photoCount) * 100))

    const handleCopyPrompt = () => {
        if (!msg.imagePrompt) return
        navigator.clipboard.writeText(msg.imagePrompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-1">
                <Palette className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 max-w-2xl bg-zinc-900 border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-[9px] font-black text-violet-400 uppercase tracking-widest border border-violet-500/30">
                            Concepto Visual Final
                        </span>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-lg border border-violet-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Live</span>
                            </div>
                        )}
                        {!isGenerating && statusStr === '' && (
                            <div className="flex items-center gap-2">
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Completado</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-white leading-relaxed mb-4">{msg.content}</p>

                    {/* Sequential Visual Feedback: Show images as they arrive */}
                    {(Object.keys(msg.images || {}).some(k => !k.startsWith('_'))) && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {msg.images?.square && (
                                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 group/mini relative">
                                    <img src={msg.images.square} className="w-full h-full object-cover" alt="Square" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[7px] text-center font-bold text-white uppercase">1:1 Feed</div>
                                </div>
                            )}
                            {msg.images?.vertical && (
                                <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/10 group/mini relative">
                                    <img src={msg.images.vertical} className="w-full h-full object-cover" alt="Vertical" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[7px] text-center font-bold text-white uppercase">9:16 Story</div>
                                </div>
                            )}
                            {msg.images?.horizontal && (
                                <div className="aspect-[16/9] rounded-xl overflow-hidden border border-white/10 group/mini relative">
                                    <img src={msg.images.horizontal} className="w-full h-full object-cover" alt="Horizontal" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[7px] text-center font-bold text-white uppercase">16:9 Ads</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Background Progress State */}
                    {isGenerating && (
                        <div className="relative w-full rounded-2xl overflow-hidden mb-5 border border-white/5 bg-black/40 flex flex-col items-center justify-center p-6 text-center group">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <div className="relative z-10 w-full">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                                        {progress < 100 ? 'Componiendo Pack...' : 'Finalizando...'}
                                    </span>
                                    <span className="text-[9px] font-black text-violet-400">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ type: 'spring', damping: 20 }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between px-1">
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                        {currentPhotos} de {photoCount} fotos listas
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {isStuck && (
                                            <button
                                                onClick={() => onReset(msg.id)}
                                                className="text-[7px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase font-black hover:bg-red-500/40 transition-all"
                                            >
                                                Destrabar
                                            </button>
                                        )}
                                        <span className="text-[7px] text-zinc-600 font-bold uppercase italic animate-pulse">
                                            {statusStr.includes(':') ? statusStr.split(':')[1].trim() : 'Procesando...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isGenerating && msg.images?.square && !msg.images?.vertical && (
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 border border-white/10 bg-black group/preview">
                            <img
                                src={msg.images.square}
                                alt="Preview"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 md:p-4">
                                <p className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest bg-violet-600/80 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-lg">Vista Previa 1:1</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-5 relative group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-3 h-3" /> Prompt Técnico (Flux)
                            </span>
                            <button
                                onClick={handleCopyPrompt}
                                className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 hover:text-white transition"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                            {msg.imagePrompt}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onOpenWorkspace(msg)}
                            disabled={isLoading || isGenerating}
                            className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 group-hover:animate-pulse" />}
                            {isGenerating ? 'Preparando Mesa...' : 'Ver Mesa de Trabajo (9 Redes)'}
                        </button>
                        <button
                            onClick={() => onVariation(msg.imagePrompt!, "Haz una variación creativa manteniendo la esencia")}
                            disabled={isLoading || isGenerating}
                            className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all border-dashed disabled:opacity-30"
                            title="Regenerar Variación"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Platforms Mini-Feed */}
                <div className="bg-black/20 p-3 flex items-center justify-center gap-4 border-t border-white/5">
                    {Object.keys(msg.platforms || {}).slice(0, 5).map(p => (
                        <span key={p} className="text-lg grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100" title={p}>
                            {PLATFORM_CONFIG[p]?.icon || '✨'}
                        </span>
                    ))}
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                        + {Math.max(0, Object.keys(msg.platforms || {}).length - 5)} plataformas
                    </span>
                </div>
            </div>
        </div>
    )
}

function CreativeWorkspace({ msg }: { msg: ChatMessage }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 text-violet-400">
                <Layers className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-widest">Mesa de Trabajo — {Object.keys(msg.platforms || {}).length} Redes</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(msg.platforms || {}).map(([id, data]) => (
                    <PlatformAssetCard
                        key={id}
                        platformId={id}
                        data={data}
                        images={msg.images || {}}
                    />
                ))}
            </div>
        </div>
    )
}

function PlatformAssetCard({ platformId, data, images }: { platformId: string, data: any, images: any }) {
    const config = PLATFORM_CONFIG[platformId] || { name: platformId, icon: '✨', color: 'from-zinc-500 to-zinc-700' }
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const text = `${data.caption}\n\n${data.hashtags || ''}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = async () => {
        const url = platformId.includes('stories') || platformId === 'tiktok' || platformId === 'snapchat' || platformId === 'kwai'
            ? images.vertical || images.square
            : platformId === 'facebook' || platformId === 'google_ads' || platformId === 'x_twitter'
                ? images.horizontal || images.square
                : images.square

        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `carmatch-${platformId}-${Date.now()}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            window.open(url, '_blank')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md group"
        >
            <div className={`h-1 bg-gradient-to-r ${config.color}`} />
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{config.name}</span>
                    </div>
                </div>

                <div className={`${platformId.includes('stories') || platformId === 'tiktok' || platformId === 'snapchat' || platformId === 'kwai' ? 'aspect-[9/16]' : 'aspect-video'} relative rounded-lg overflow-hidden bg-black mb-4 border border-white/5`}>
                    <img
                        src={platformId.includes('stories') || platformId === 'tiktok' || platformId === 'snapchat' || platformId === 'kwai'
                            ? images.vertical || images.square
                            : platformId === 'facebook' || platformId === 'google_ads' || platformId === 'x_twitter'
                                ? images.horizontal || images.square
                                : images.square
                        }
                        alt={config.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={handleDownload}
                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition active:scale-95"
                            title="Descargar HD"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Size badge for mobile */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-white uppercase">
                        {platformId.includes('stories') || platformId === 'tiktok' ? '9:16 Vertical' : '16:9 HD'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                            {data.caption} <span className="text-violet-400 font-bold">{data.hashtags}</span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex-1 py-3 md:py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] md:text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-4 h-4 md:w-3 md:h-3" />}
                            {copied ? 'Copiado' : 'Copiar Texto'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
