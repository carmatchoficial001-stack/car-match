'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Sparkles, Download, Copy, Check, ImagePlus,
    Loader2, X, ChevronDown, ExternalLink, Zap, Palette,
    Camera, Layers, RefreshCw
} from 'lucide-react'
import { chatWithImageDirector, generateImageVariation } from '@/app/admin/actions/image-chat-actions'
import { createCampaignFromAssets } from '@/app/admin/actions/publicity-actions'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    type?: 'CHAT' | 'PROMPT_READY'
    images?: { square: string; vertical: string; horizontal: string }
    imagePrompt?: string
    platforms?: Record<string, any>
    timestamp: Date
}

type ImageSize = 'square' | 'vertical' | 'horizontal'

const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
    instagram_feed: { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
    instagram_stories: { name: 'IG Stories', icon: '📱', color: 'from-orange-500 to-pink-500' },
    tiktok: { name: 'TikTok', icon: '🎵', color: 'from-cyan-400 to-teal-500' },
    facebook: { name: 'Facebook', icon: '👤', color: 'from-blue-500 to-blue-700' },
    x_twitter: { name: 'X', icon: '𝕏', color: 'from-zinc-600 to-zinc-800' },
    google_ads: { name: 'Google Ads', icon: '🔍', color: 'from-green-500 to-blue-500' },
    snapchat: { name: 'Snapchat', icon: '👻', color: 'from-yellow-400 to-yellow-500' },
    kwai: { name: 'Kwai', icon: '🎬', color: 'from-orange-400 to-red-500' },
}

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
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim()
        if (!messageText || isLoading) return

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            type: 'CHAT',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            // Build history for server action
            const history = [...messages, userMsg].map(m => ({
                role: m.role,
                content: m.content
            }))

            const result = await chatWithImageDirector(history)

            const assistantMsg: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.message || '',
                type: result.type,
                imagePrompt: result.type === 'PROMPT_READY' ? result.imagePrompt : undefined,
                platforms: result.type === 'PROMPT_READY' ? result.platforms : undefined,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `❌ Error: ${error.message || 'Algo salió mal'}`,
                type: 'CHAT',
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleVariation = async (originalPrompt: string, instruction: string) => {
        setIsLoading(true)
        try {
            const result = await generateImageVariation(originalPrompt, instruction)
            if (result.success) {
                setMessages(prev => [...prev, {
                    id: `variation-${Date.now()}`,
                    role: 'assistant',
                    content: result.message || '🎨 Variación lista',
                    type: 'IMAGE_READY',
                    images: result.images,
                    imagePrompt: result.imagePrompt,
                    timestamp: new Date()
                }])
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveToCampaign = async (msg: ChatMessage) => {
        if (!msg.imagePrompt || isSaving) return
        setIsSaving(true)
        try {
            // Generate images in 3 key sizes on the fly
            const prompt = msg.imagePrompt
            const seed = Math.floor(Math.random() * 999999)
            const encoded = encodeURIComponent(prompt)
            const buildUrl = (w: number, h: number) => `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`

            const images = {
                square: buildUrl(1080, 1080),
                vertical: buildUrl(1080, 1920),
                horizontal: buildUrl(1200, 628)
            }

            const result = await createCampaignFromAssets({
                internal_title: `Creativo IA — ${new Date().toLocaleDateString('es-MX')}`,
                imageUrl: images.square,
                imagePrompt: prompt,
                platforms: msg.platforms || {},
                copy: msg.platforms?.instagram_feed?.caption || msg.content,
            })
            if (result.success) {
                setMessages(prev => [...prev, {
                    id: `system-${Date.now()}`,
                    role: 'assistant',
                    content: '✅ ¡Campaña creada exitosamente! Ve a la lista de "Campañas" para ver tus gráficos fabricados.',
                    type: 'CHAT',
                    timestamp: new Date()
                }])
            }
        } catch (error: any) {
            console.error('Error saving campaign:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 blur-[80px] -ml-24 -mb-24 rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            Estudio de Imágenes
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                            Director Creativo IA • 8 Plataformas • Generación Instantánea
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {messages.filter(m => m.type === 'IMAGE_READY').length > 0 && (
                            <div className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-[10px] font-black text-violet-400 uppercase tracking-widest">
                                {messages.filter(m => m.type === 'IMAGE_READY').length} imágenes
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/10">
                            <Sparkles className="w-10 h-10 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">¿Qué imagen quieres crear?</h3>
                        <p className="text-sm text-zinc-500 mb-8 max-w-md">
                            Describe tu idea y la IA generará imágenes optimizadas para <span className="text-violet-400 font-bold">8 plataformas</span> con copies listos para publicar.
                        </p>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                            {QUICK_PRESETS.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(preset.prompt)}
                                    className="group p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-left hover:bg-violet-500/10 hover:border-violet-500/20 transition-all duration-300"
                                >
                                    <div className="text-base mb-1">{preset.label.split(' ')[0]}</div>
                                    <div className="text-xs font-bold text-zinc-400 group-hover:text-violet-300 transition-colors">
                                        {preset.label.split(' ').slice(1).join(' ')}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {msg.role === 'user' ? (
                                <UserBubble content={msg.content} />
                            ) : msg.type === 'PROMPT_READY' ? (
                                <PromptProposalCard
                                    msg={msg}
                                    onSaveCampaign={handleSaveToCampaign}
                                    isSaving={isSaving}
                                />
                            ) : (
                                <AssistantBubble content={msg.content} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                                <span className="text-sm text-zinc-400">El Director Creativo está trabajando...</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-4 border-t border-white/5 bg-zinc-950/70 backdrop-blur-xl">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Describe tu imagen... ej: Un Mustang rojo en la lluvia nocturna"
                            className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white disabled:opacity-30 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm text-white leading-relaxed">{content}</p>
            </div>
        </div>
    )
}

function AssistantBubble({ content }: { content: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%] bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// PROMPT PROPOSAL CARD
// ─────────────────────────────────────────────────────────────

function PromptProposalCard({
    msg,
    onSaveCampaign,
    isSaving
}: {
    msg: ChatMessage
    onSaveCampaign: (msg: ChatMessage) => void
    isSaving: boolean
}) {
    const [copied, setCopied] = useState(false)

    const handleCopyPrompt = () => {
        if (!msg.imagePrompt) return
        navigator.clipboard.writeText(msg.imagePrompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 mt-1">
                <Palette className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 max-w-2xl bg-zinc-900/80 border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/5 transition-all hover:border-violet-500/40">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-0.5 rounded-md bg-violet-500/20 text-[9px] font-black text-violet-400 uppercase tracking-widest border border-violet-500/30">
                            Propuesta de Diseño Final
                        </div>
                    </div>

                    <p className="text-sm text-white leading-relaxed mb-4">{msg.content}</p>

                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 relative group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-3 h-3" /> Prompt de Generación (Inglés)
                            </span>
                            <button
                                onClick={handleCopyPrompt}
                                className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition flex items-center gap-1.5 text-[9px] font-bold"
                            >
                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all cursor-default">
                            {msg.imagePrompt}
                        </p>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            onClick={() => onSaveCampaign(msg)}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse hover:animate-none"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Usar en Campaña
                        </button>
                    </div>
                </div>

                {/* Micro-feed for Platforms Check */}
                <div className="bg-black/20 p-3 flex items-center justify-center gap-4 border-t border-white/5">
                    {Object.keys(msg.platforms || {}).slice(0, 5).map(p => (
                        <span key={p} className="text-lg grayscale hover:grayscale-0 transition-all cursor-default opacity-40 hover:opacity-100" title={p}>
                            {PLATFORM_CONFIG[p]?.icon || '✨'}
                        </span>
                    ))}
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">+ {Object.keys(msg.platforms || {}).length - 5} plataformas</span>
                </div>
            </div>
        </div>
    )
}
