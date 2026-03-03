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
    type?: 'CHAT' | 'IMAGE_READY'
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
                images: result.type === 'IMAGE_READY' ? (result as any).images : undefined,
                imagePrompt: result.type === 'IMAGE_READY' ? (result as any).imagePrompt : undefined,
                platforms: result.type === 'IMAGE_READY' ? (result as any).platforms : undefined,
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
        if (!msg.images || isSaving) return
        setIsSaving(true)
        try {
            const result = await createCampaignFromAssets({
                internal_title: `Estudio IA — ${new Date().toLocaleDateString('es-MX')}`,
                imageUrl: msg.images.square,
                imagePrompt: msg.imagePrompt || '',
                platforms: msg.platforms || {},
                copy: msg.platforms?.instagram_feed?.caption || msg.content,
            })
            if (result.success) {
                setMessages(prev => [...prev, {
                    id: `system-${Date.now()}`,
                    role: 'assistant',
                    content: '✅ ¡Campaña creada exitosamente! Ve a "Campañas" para verla.',
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
                            ) : msg.type === 'IMAGE_READY' && msg.images ? (
                                <CreativePackCard
                                    msg={msg}
                                    onVariation={handleVariation}
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
// CREATIVE PACK CARD (the star of the show)
// ─────────────────────────────────────────────────────────────

function CreativePackCard({
    msg,
    onVariation,
    onSaveCampaign,
    isSaving
}: {
    msg: ChatMessage
    onVariation: (prompt: string, instruction: string) => void
    onSaveCampaign: (msg: ChatMessage) => void
    isSaving: boolean
}) {
    const [selectedSize, setSelectedSize] = useState<ImageSize>('square')
    const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram_feed')
    const [copied, setCopied] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [showVariationInput, setShowVariationInput] = useState(false)
    const [variationText, setVariationText] = useState('')

    if (!msg.images) return null

    const currentUrl = msg.images[selectedSize]
    const platformData = msg.platforms?.[selectedPlatform] || {}
    const captionText = platformData.caption || platformData.headline || ''
    const hashtagText = platformData.hashtags || ''

    const handleCopy = () => {
        const fullText = `${captionText}\n\n${hashtagText}`.trim()
        navigator.clipboard.writeText(fullText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const a = document.createElement('a')
        a.href = currentUrl
        a.target = '_blank'
        a.download = `carmatch-${selectedSize}-${Date.now()}.jpg`
        a.click()
    }

    const sizes: { key: ImageSize; label: string; dims: string }[] = [
        { key: 'square', label: 'Cuadrado', dims: '1080×1080' },
        { key: 'vertical', label: 'Vertical', dims: '1080×1920' },
        { key: 'horizontal', label: 'Horizontal', dims: '1200×628' },
    ]

    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 mt-1">
                <Camera className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 max-w-2xl">
                {/* AI Message */}
                <p className="text-sm text-zinc-300 mb-3">{msg.content}</p>

                {/* Image Card */}
                <div className="bg-zinc-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/5">
                    {/* Size Tabs */}
                    <div className="flex items-center gap-1 p-2 bg-black/30 border-b border-white/5">
                        {sizes.map(s => (
                            <button
                                key={s.key}
                                onClick={() => { setSelectedSize(s.key); setImageLoaded(false) }}
                                className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedSize === s.key
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {s.label} <span className="opacity-50 ml-1">{s.dims}</span>
                            </button>
                        ))}
                    </div>

                    {/* Image */}
                    <div className={`relative bg-black ${selectedSize === 'vertical' ? 'aspect-[9/16] max-h-[500px]' : selectedSize === 'horizontal' ? 'aspect-[1200/628]' : 'aspect-square'} overflow-hidden`}>
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center animate-pulse">
                                        <ImagePlus className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-bold">Generando imagen...</p>
                                </div>
                            </div>
                        )}
                        <img
                            src={currentUrl}
                            alt="Generated"
                            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                        />

                        {/* Action overlay */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="w-9 h-9 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition"
                                title="Descargar"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Platform Selector */}
                    <div className="p-3 border-t border-white/5">
                        <div className="flex items-center gap-1 overflow-x-auto pb-2 hide-scrollbar">
                            {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlatform(key)}
                                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ${selectedPlatform === key
                                        ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg`
                                        : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <span>{cfg.icon}</span>
                                    <span className="whitespace-nowrap">{cfg.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Caption Display */}
                        {captionText && (
                            <div className="mt-2 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{captionText}</p>

                                {platformData.audio_suggestion && (
                                    <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Zap className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-300 uppercase tracking-tighter">Sugerencia de Audio</p>
                                            <p className="text-[10px] text-blue-400/90 italic">{platformData.audio_suggestion}</p>
                                        </div>
                                    </div>
                                )}

                                {hashtagText && (
                                    <p className="text-[10px] text-violet-400/70 mt-2 leading-relaxed">{hashtagText}</p>
                                )}
                                <button
                                    onClick={handleCopy}
                                    className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-violet-400 transition"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copiado' : 'Copiar texto'}
                                </button>
                            </div>
                        )}

                        {platformData.headline && (
                            <div className="mt-2 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <p className="text-xs font-black text-white">{platformData.headline}</p>
                                {platformData.description && (
                                    <p className="text-[10px] text-zinc-400 mt-1">{platformData.description}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t border-white/5 flex items-center gap-2">
                        <button
                            onClick={() => onSaveCampaign(msg)}
                            disabled={isSaving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            Usar en Campaña
                        </button>
                        <button
                            onClick={() => setShowVariationInput(!showVariationInput)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Variación
                        </button>
                    </div>

                    {/* Variation Input */}
                    <AnimatePresence>
                        {showVariationInput && msg.imagePrompt && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-3 border-t border-white/5 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={variationText}
                                        onChange={e => setVariationText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && variationText.trim()) {
                                                onVariation(msg.imagePrompt!, variationText)
                                                setVariationText('')
                                                setShowVariationInput(false)
                                            }
                                        }}
                                        placeholder="ej: hazlo de noche, cambia a color rojo..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                                    />
                                    <button
                                        onClick={() => {
                                            if (variationText.trim()) {
                                                onVariation(msg.imagePrompt!, variationText)
                                                setVariationText('')
                                                setShowVariationInput(false)
                                            }
                                        }}
                                        className="w-9 h-9 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
