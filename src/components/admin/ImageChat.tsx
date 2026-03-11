'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Sparkles, Download, Copy, Check, ImagePlus,
    Loader2, X, ChevronDown, ExternalLink, Zap, Palette,
    Camera, Layers, RefreshCw, Trash2, Plus, MessageSquare, History
} from 'lucide-react'
import { chatWithImageDirector } from '@/app/admin/actions/image-chat-actions'
import { getStudioConversations, getStudioHistory, saveStudioMessage, createStudioConversation, deleteStudioConversation, clearStudioHistory } from '@/app/admin/actions/studio-history-actions'
import { restartStudioWorker, processNextImageBatch, generateRandomCampaign, uploadClientGeneratedImage, reportClientError } from '@/app/admin/actions/image-chat-actions'

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
    const fetchConversations = async () => {
        const res = await getStudioConversations()
        if (res.success && res.conversations) {
            setConversations(res.conversations)
        }
    }

    useEffect(() => {
        fetchConversations()
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

    // 🔄 ORCHESTRATE GENERATION (ROBUST RECURSIVE POLLING)
    useEffect(() => {
        if (!activeConversationId) return;

        // Find the latest assistant message that is still in "generating" state
        const generatingMessage = [...messages].reverse().find(m =>
            m.role === 'assistant' &&
            m.images &&
            (m.images as any)._status?.startsWith('generating')
        );

        if (!generatingMessage) return;

        let isMounted = true;
        let pollTimer: NodeJS.Timeout | null = null;
        const messageId = generatingMessage.id;

        const pollProgress = async () => {
            if (!isMounted) return;

            try {
                // 1. Process next batch if needed
                await processNextImageBatch(messageId);

                if (!isMounted) return;

                // 2. Refresh history
                const histRes = await getStudioHistory(activeConversationId);
                if (histRes.success && histRes.messages && isMounted) {
                    setMessages(histRes.messages);
                }

                if (isMounted) {
                    pollTimer = setTimeout(pollProgress, 2500);
                }
            } catch (err) {
                console.error('[IMAGE-CHAT] Polling cycle error:', err);
                if (isMounted) {
                    pollTimer = setTimeout(pollProgress, 5000);
                }
            }
        };

        pollTimer = setTimeout(pollProgress, 1000);

        return () => {
            isMounted = false;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [activeConversationId, messages.length])

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
        const isInitialMessage = !currentConvId

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        // 🛡️ PERSIST USER MESSAGE (Wait for it if it's the first one to get a stable ConvId)
        if (isInitialMessage) {
            const saveUserRes = await saveStudioMessage({
                role: 'user',
                content: messageText
            })
            if (saveUserRes.success) {
                currentConvId = saveUserRes.conversationId
                setActiveConversationId(currentConvId!)
                fetchConversations() // Update sidebar
            }
        } else {
            // Background save for existing conversations
            saveStudioMessage({
                conversationId: currentConvId!,
                role: 'user',
                content: messageText
            })
        }

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
                    content: result.message || 'Ocurrió un error.',
                    timestamp: new Date()
                }])
                return
            }

            // Sync with actual conversationId (in case of auto-creation)
            if (result.conversationId && !activeConversationId) {
                setActiveConversationId(result.conversationId)
                fetchConversations()
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

            setMessages(prev => [...prev, assistantMsg])
        } catch (error: any) {
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

    // --- AUTOMATIC CAMPAIGN HANDLER ---
    // --- AUTOMATIC CAMPAIGN HANDLER ---
    const handleAutoCampaign = async () => {
        setIsLoading(true);
        setStatus('Calculando estrategia viral...');

        try {
            // 1. Get Strategy from IA
            const res = await suggestCampaignFromInventory();
            if (!res.success) throw new Error(res.error);

            setStatus('Creando campaña persistente...');
            
            // 2. Save it to the real Campaigns database
            const campaignRes = await saveStudioToCampaign({
                title: res.campaignData.internal_title,
                strategy: res.campaignData.strategy,
                caption: res.campaignData.caption,
                imagePrompt: res.campaignData.imagePrompt,
                videoScript: res.campaignData.videoScript,
                userId: session?.user?.id || 'admin'
            });

            if (!campaignRes.success) throw new Error(campaignRes.error);

            // 3. Inform user and refresh
            setStatus('¡Campaña Lanzada! Redirigiendo...');
            
            alert('¡ÉXITO! Tu campaña se está generando en segundo plano. Búscala en la pestaña de "Campañas".');
            
            window.location.reload(); 

        } catch (error: any) {
            console.error('Error in Auto Campaign:', error);
            alert('Error: ' + error.message);
        } finally {
            setIsLoading(false);
            setStatus('');
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

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAutoCampaign}
                                disabled={isLoading}
                                className="px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span className="hidden sm:inline">Campaña Automática</span>
                                <span className="sm:hidden">Auto</span>
                            </button>
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
                                            const res = await restartStudioWorker(id)
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
                            <span className="text-xs text-zinc-500 font-medium animate-pulse">
                                Pensando como un experto...
                                <span className="text-[10px] opacity-70 ml-2">(La generación seguirá trabajando aunque salgas del chat)</span>
                            </span>
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
    onReset,
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
    const isStuck = isGenerating && lastUpdate > 0 && (Date.now() - lastUpdate) > 45 * 1000 
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

                    {/* Sequential Visual Feedback */}
                    {(Object.keys(msg.images || {}).some(k => !k.startsWith('_'))) && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {msg.images?.square && (
                                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 group/mini relative">
                                    <img src={`${msg.images.square}?t=${msg.timestamp.getTime()}`} className="w-full h-full object-cover" alt="Square" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[7px] text-center font-bold text-white uppercase">1:1 Feed</div>
                                </div>
                            )}
                        </div>
                    )}

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
                                    />
                                </div>
                                <p className="text-[8px] text-zinc-600 mt-2 uppercase font-black tracking-tighter">Estudio CarMatch Live</p>
                            </div>
                        </div>
                    )}

                    {isStuck && (
                        <button
                            onClick={() => onReset(msg.id)}
                            className="w-full mb-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Destrabar Generación
                        </button>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyPrompt}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-wider transition-all"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiado' : 'Copiar Prompt'}
                            </button>
                            {!isGenerating && statusStr === '' && (
                                <button
                                    onClick={() => onOpenWorkspace(msg)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-wider transition-all shadow-lg shadow-violet-500/20"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir Mesa de Trabajo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CreativeWorkspace({ msg }: { msg: ChatMessage }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                <Layers className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 space-y-4">
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-violet-400" />
                        Pack Publicitario Listado
                    </h3>
                    <p className="text-xs text-zinc-500 mb-6 font-medium">Diseños optimizados para máxima conversión</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.images && Object.entries(msg.images).filter(([k]) => !k.startsWith('_')).map(([key, url]) => (
                            <DesignCard key={key} type={key.split('_')[2]} url={url} platforms={msg.platforms} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DesignCard({ type, url, platforms }: { type: string; url: string; platforms?: any }) {
    const pKey = type === 'square' ? 'instagram' : type === 'vertical' ? 'tiktok' : 'facebook'
    const isRecommended = platforms?.[pKey]

    return (
        <div className="group bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden hover:border-violet-500/30 transition-all duration-500">
            <div className="relative aspect-video md:aspect-square overflow-hidden">
                <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={type} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                        {isRecommended && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{type}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                    {AD_PLATFORMS.slice(0, 3).map(p => (
                        <div key={p.id} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500">
                            <i className={`${p.icon} text-[10px]`} />
                        </div>
                    ))}
                </div>
                <a
                    href={url}
                    download
                    target="_blank"
                    className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-white hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        </div>
    )
}
