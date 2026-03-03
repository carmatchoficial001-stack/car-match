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
    type?: 'CHAT' | 'PROMPT_READY' | 'IMAGE_READY'
    images?: { square: string; vertical: string; horizontal: string }
    imagePrompt?: string
    platforms?: Record<string, any>
    timestamp: Date
}

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

    const buildPollinationsUrl = (prompt: string, width: number, height: number) => {
        const seed = Math.floor(Math.random() * 999999)
        const encoded = encodeURIComponent(prompt)
        return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`
    }

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
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
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
                images: result.type === 'PROMPT_READY' ? {
                    square: buildPollinationsUrl(result.imagePrompt!, 1080, 1080),
                    vertical: buildPollinationsUrl(result.imagePrompt!, 1080, 1920),
                    horizontal: buildPollinationsUrl(result.imagePrompt!, 1200, 628)
                } : undefined,
                platforms: result.type === 'PROMPT_READY' ? result.platforms : undefined,
                timestamp: new Date()
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

    const handleVariation = (prompt: string, instruction: string) => {
        handleSend(`Basado en este prompt: "${prompt}", haz esta variación: ${instruction}`)
    }

    const handleSaveToCampaign = async (msg: ChatMessage) => {
        if (!msg.imagePrompt || isSaving) return
        setIsSaving(true)

        try {
            const campaignData = {
                internal_title: `Campaña IA — ${new Date().toLocaleDateString('es-MX')}`,
                imagePrompt: msg.imagePrompt,
                platforms: msg.platforms || {},
                images: msg.images,
                imageUrl: msg.images?.square
            }

            const res = await createCampaignFromAssets(campaignData)

            if (res.success) {
                window.dispatchEvent(new CustomEvent('campaign-created'))
                alert('✅ ¡Campaña creada con éxito! Ve a la lista de "Campañas" para verla.')
            }
        } catch (error) {
            console.error('Error saving campaign:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0A0A0B]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            Estudio de Imágenes
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                            Director Creativo IA • 8 Plataformas • Vista Previa Real
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/10">
                            <Sparkles className="w-10 h-10 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">¿Qué vamos a crear hoy?</h3>
                        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                            Describe tu idea y el Director Creativo diseñará la estética perfecta para tus redes sociales.
                        </p>
                        <div className="grid grid-cols-2 gap-2 w-full">
                            {QUICK_PRESETS.slice(0, 4).map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(preset.prompt)}
                                    className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-left hover:bg-violet-500/10 hover:border-violet-500/20 transition-all text-[10px] font-bold text-zinc-400 hover:text-white"
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
                                    onSaveCampaign={handleSaveToCampaign}
                                    onVariation={handleVariation}
                                    isSaving={isSaving}
                                    isLoading={isLoading}
                                />
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
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Nueva idea creativa... ej: Shooting de noche"
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
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
    onSaveCampaign,
    onVariation,
    isSaving,
    isLoading
}: {
    msg: ChatMessage
    onSaveCampaign: (msg: ChatMessage) => void
    onVariation: (prompt: string, instruction: string) => void
    isSaving: boolean
    isLoading: boolean
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-1">
                <Palette className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 max-w-2xl bg-zinc-900 border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-5">
                    <div className="mb-4">
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-[9px] font-black text-violet-400 uppercase tracking-widest border border-violet-500/30">
                            Concepto Visual Final
                        </span>
                    </div>

                    <p className="text-sm text-white leading-relaxed mb-4">{msg.content}</p>

                    {/* Image Preview */}
                    {msg.images?.square && (
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 border border-white/10 bg-black group/preview">
                            <img
                                src={msg.images.square}
                                alt="Preview"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end p-4">
                                <p className="text-[10px] font-bold text-white uppercase tracking-widest bg-violet-600/80 backdrop-blur-md px-3 py-1.5 rounded-lg">Vista Previa 1:1</p>
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
                            onClick={() => onSaveCampaign(msg)}
                            disabled={isSaving || isLoading}
                            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Crear Campaña
                        </button>
                        <button
                            onClick={() => onVariation(msg.imagePrompt!, "Haz una variación creativa manteniendo la esencia")}
                            disabled={isSaving || isLoading}
                            className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all border-dashed"
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
