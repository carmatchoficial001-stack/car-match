'use client'
// 🚀 FORCE BUILD: 2026-02-18 12:20
import { useState, useRef, useEffect, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, User, Send, ImageIcon,
    Video, Copy, Check, Plus, History, RefreshCw,
    Bot, Download, X, ChevronLeft, ChevronRight,
    Trash2, Edit, Zap, Layers, Globe, FileText, Terminal
} from 'lucide-react'
import { createAISession, getAISession, getAISessions, deleteAISession, saveAIMessage, renameAISession } from '@/app/admin/actions/ai-studio-actions'
import { chatWithPublicityAgent } from '@/app/admin/actions/ai-content-actions'
import { useVideoProduction } from '@/contexts/VideoProductionContext'
import { useImageProduction } from '@/contexts/ImageProductionContext'
import { Logo } from '@/components/Logo'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'VIDEO_GEN' | 'STRATEGY'

const SUGGESTIONS = [
    { title: "Campaña JDM Nocturna", prompt: "Crea una serie de 5 fotos RAW cinematográficas de un Nissan Skyline R34 en las calles lluviosas de Neo-Tokyo, con luces de neón reflejadas en la pintura mojada.", icon: "🌃" },
    { title: "Off-Road en el Desierto", prompt: "Genera una campaña visual de una Ford Raptor saltando en dunas de arena al atardecer, estilo GoPro y tomas de drone con mucha acción.", icon: "🏜️" },
    { title: "Clásicos de Colección", prompt: "Diseña un video para TikTok sobre la restauración de un Mustang 1965 abandonado en un granero, iluminación dramática y texturas de metal oxidado.", icon: "🛠️" },
    { title: "Lujo y Elegancia", prompt: "Campaña para redes sociales de un Mercedes Clase S frente a una mansión moderna, estética minimalista y 'Old Money'.", icon: "✨" }
]

// ─── Helper: parse message content if it's JSON ───────────────────────────
function parseChatMessage(msg: any) {
    if (typeof msg.content === 'string' && msg.content.startsWith('{')) {
        try {
            const parsed = JSON.parse(msg.content);
            return {
                ...msg,
                content: parsed.content || msg.content,
                type: parsed.type || msg.type,
                strategy: parsed.strategy || msg.strategy,
                images: parsed.images || msg.images,
                imageUrls: parsed.imageUrls || msg.imageUrls,
                videoUrl: parsed.videoUrl || msg.videoUrl,
                videoPendingId: parsed.videoPendingId || msg.videoPendingId,
                pendingCount: parsed.pendingCount || msg.pendingCount || 0
            };
        } catch (e) {
            return msg;
        }
    }
    return msg;
}

// ─── Helper: extract how many images user asked for (1-50) ─────────────────
function extractImageCount(text: string): number {
    const textLower = text.toLowerCase()

    // 1. Detección de números explícitos (dígitos)
    const digitPatterns = [
        /(?:crea|genera|hazme|dame|quiero|necesito|ponme)\s+(\d+)\s+(?:foto|imagen|fotos|imágenes|imagenes)/i,
        /(\d+)\s+(?:foto|imagen|fotos|imágenes|imagenes)/i,
        /pack de (\d+)/i,
        /(\d+)\s+ideas/i
    ]

    for (const p of digitPatterns) {
        const m = text.match(p)
        if (m) {
            const n = parseInt(m[1])
            return Math.min(Math.max(n, 1), 50)
        }
    }

    // 2. Detección de números en palabras (comunes en español)
    const wordNumbers: Record<string, number> = {
        'una': 1, 'un': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'doce': 12, 'quince': 15, 'veinte': 20, 'treinta': 30, 'cincuenta': 50
    }

    for (const [word, num] of Object.entries(wordNumbers)) {
        if (textLower.includes(`${word} fotos`) || textLower.includes(`${word} imágenes`) || textLower.includes(`${word} imagenes`)) {
            return num
        }
    }

    // 3. Casos especiales de "variedad" o "comunidad"
    if (textLower.includes('varias') || textLower.includes('algunas') || textLower.includes('muchas') ||
        textLower.includes('un pack') || textLower.includes('un paquete') || textLower.includes('una lista')) {
        return 8 // Subimos el default de "varias" para dar más opciones virales
    }

    if (textLower.includes('trivia') || textLower.includes('comunidad') || textLower.includes('debate')) {
        return 6 // Un set decente para interacción
    }

    return 1
}

// ─── Image Grid Component ──────────────────────────────────────────────────
function ImageGrid({ images, onDownload }: { images: string[], onDownload: (url: string, i: number) => void }) {
    const [current, setCurrent] = useState(0)

    if (images.length === 1) {
        return (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10 group">
                <img src={images[0]} alt="AI Generated" className="w-full object-cover max-h-80" />
                <button
                    onClick={() => onDownload(images[0], 0)}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="mt-3 space-y-2">
            {/* Main image */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img src={images[current]} alt={`Imagen ${current + 1}`} className="w-full object-cover max-h-72" />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                    {current + 1} / {images.length}
                </div>
                <button
                    onClick={() => onDownload(images[current], current)}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                    <Download className="w-4 h-4" />
                </button>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrent(p => (p - 1 + images.length) % images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrent(p => (p + 1) % images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === current ? 'border-indigo-500' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                    >
                        <img src={url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
            {/* Download all */}
            <button
                onClick={() => images.forEach((url, i) => onDownload(url, i))}
                className="w-full text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 py-2 rounded-xl transition flex items-center justify-center gap-2"
            >
                <Download className="w-3.5 h-3.5" /> Descargar todas ({images.length})
            </button>
        </div>
    )
}

// ─── Copy Button with feedback ─────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-indigo-300 transition"
        >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? '¡Copiado!' : label}
        </button>
    )
}

// ─── Platform row helper ───────────────────────────────────────────────────
function PlatformRow({ icon, label, text, borderBottom = true }: { icon: string; label: string; text: string; borderBottom?: boolean }) {
    if (!text) return null
    return (
        <div className={`flex items-start justify-between gap-2 px-3 py-2.5 ${borderBottom ? 'border-b border-white/5' : ''}`}>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{icon} {label}</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">{text}</p>
            </div>
            <div className="shrink-0"><CopyBtn text={text} label="Copiar" /></div>
        </div>
    )
}

// ─── Content Copies Panel ──────────────────────────────────────────────────
function ContentPanel({ strategy, onSaveCampaign }: { strategy: any; onSaveCampaign?: () => void }) {
    if (!strategy) return null
    const {
        internal_title, caption, platforms, videoScript,
        viral_angle, hook_3s, hook_3s_visual, monetization_cta
    } = strategy

    // ── Plataformas de IMAGEN (keys antiguas + nuevas) ──────────────────────
    const imgFb = platforms?.facebook || platforms?.facebook_marketplace || platforms?.meta_ads
    const imgIg = platforms?.instagram
    const imgTt = platforms?.tiktok || platforms?.tiktok_ads
    const imgTw = platforms?.twitter_x
    const imgYt = platforms?.youtube
    const imgWa = platforms?.whatsapp
    const imgLi = platforms?.linkedin
    const imgTh = platforms?.threads

    // ── Detectar si es estrategia de VIDEO ──────────────────────────────────
    const isVideoStrategy = !!(platforms?.tiktok || platforms?.instagram_reels || platforms?.youtube_shorts || platforms?.facebook_reels || platforms?.snapchat || platforms?.youtube_largo)

    return (
        <div className="mt-3 border border-white/10 rounded-xl overflow-hidden bg-black/30">
            {/* Botón de crear campaña (Mover aquí según pedido de Ruben) */}
            {onSaveCampaign && (
                <div className="p-3 bg-indigo-600/10 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">¿Todo listo?</p>
                        <p className="text-[9px] text-zinc-500">Publica estas ideas como una campaña formal.</p>
                    </div>
                    <button
                        onClick={onSaveCampaign}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Crear Campaña
                    </button>
                </div>
            )}

            {/* Título de campaña */}
            {internal_title && <PlatformRow icon="📌" label="Título de campaña" text={internal_title} />}

            {/* ─── Sección VIRAL (solo video) ──────────────────────────────────── */}
            {isVideoStrategy && viral_angle && (
                <div className="px-3 py-2.5 border-b border-yellow-500/20 bg-yellow-500/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500 mb-1">🧠 Ángulo viral elegido</p>
                    <p className="text-xs text-yellow-200/80 italic">{viral_angle}</p>
                </div>
            )}

            {/* Hook 3 segundos */}
            {isVideoStrategy && hook_3s && (
                <div className="border-b border-red-500/20 bg-red-500/5">
                    <div className="flex items-start justify-between gap-2 px-3 pt-2.5 pb-1">
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">⚡ Hook — Primeros 3 Segundos</p>
                            <p className="text-sm font-bold text-white leading-snug">"{hook_3s}"</p>
                            {hook_3s_visual && (
                                <p className="text-[10px] text-red-300/70 mt-1 italic">👁 Visual: {hook_3s_visual}</p>
                            )}
                        </div>
                        <div className="shrink-0"><CopyBtn text={hook_3s} label="Copiar" /></div>
                    </div>
                    <p className="text-[8px] text-red-400/50 px-3 pb-2 font-bold uppercase tracking-wider">Pattern interrupt — lo que detiene el scroll</p>
                </div>
            )}

            {/* Guión del video */}
            {videoScript && <PlatformRow icon="🎬" label="Guión completo del video" text={videoScript} />}

            {/* CTA de monetización */}
            {isVideoStrategy && monetization_cta && (
                <div className="flex items-start justify-between gap-2 px-3 py-2.5 border-b border-green-500/20 bg-green-500/5">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-green-400 mb-0.5">💰 CTA de monetización</p>
                        <p className="text-xs text-green-200/80 whitespace-pre-wrap">{monetization_cta}</p>
                    </div>
                    <div className="shrink-0"><CopyBtn text={monetization_cta} label="Copiar" /></div>
                </div>
            )}

            {/* Caption principal (imágenes) */}
            {caption && !isVideoStrategy && <PlatformRow icon="✍️" label="Caption principal" text={caption} />}

            {/* No se muestran las redes sociales aquí en el chat, 
                ya que el desglose por plataforma se ve en el Área de Edición / Campañas (Global Ad Pack) 
            */}
        </div>
    )
}

// ─── Campaign Proposal Panel ───────────────────────────────────────────────
function CampaignProposal({ strategy, onConfirm, isGenerating, mode }: { strategy: any; onConfirm: () => void; isGenerating: boolean; mode: AIMode }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)
    if (!strategy) return null

    const { internal_title, visualSummary, imagePrompts, scenes, imagePrompt } = strategy
    const imgCount = imagePrompts?.length || 0
    const scenesCount = scenes?.length || 0
    const isVideo = mode === 'VIDEO_GEN'

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation()
        const textToCopy = isVideo ? strategy.master_style : (imagePrompt || (imagePrompts && imagePrompts[0]))
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div
            onClick={() => !isGenerating && setExpanded(!expanded)}
            className={`mt-4 border ${expanded ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] bg-indigo-500/10' : 'border-white/5 hover:border-indigo-500/20 bg-white/5'} rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer group/proposal backdrop-blur-md`}
        >
            <div className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 font-outfit">
                            {expanded ? 'Propuesta Maestra' : `Estrategia de ${isVideo ? 'Video' : 'Campaña'}`}
                        </span>
                    </div>
                    {!expanded && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 group-hover/proposal:border-indigo-500/30 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Abrir</span>
                        </div>
                    )}
                </div>

                <h4 className="text-sm font-bold text-white leading-tight">{internal_title || (isVideo ? 'Nueva Producción de Video' : 'Nueva Campaña CarMatch')}</h4>

                {expanded && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">📋 Plan de {isVideo ? 'Producción' : 'Generación'}:</p>
                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {visualSummary || (
                                    isVideo
                                        ? `Generaré un video con ${scenesCount} escenas basadas en tu idea.`
                                        : `Generaré ${imgCount > 1 ? imgCount : 'una'} imagen${imgCount > 1 ? 'es' : ''} de alta calidad para tu campaña.`
                                )}
                            </p>
                        </div>

                        {/* Prompt Display */}
                        <div className="bg-black/40 rounded-lg p-2.5 border border-white/10">
                            <p className="text-[9px] font-black uppercase text-zinc-500 mb-1.5 tracking-widest">🧬 Prompt Final:</p>
                            <p className="text-[10px] text-zinc-400 italic line-clamp-3">
                                {isVideo ? strategy.master_style : (imagePrompt || (imagePrompts && imagePrompts[0]))}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleCopyPrompt}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiado' : 'Copiar Prompt'}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                                disabled={isGenerating}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 ${isVideo ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'} disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg`}
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isVideo ? <Video className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                                USAR EN CAMPAÑA
                            </button>
                        </div>
                    </div>
                )}

                {!expanded && (
                    <p className="text-[10px] text-zinc-400 line-clamp-1 italic">
                        {visualSummary?.substring(0, 100)}...
                    </p>
                )}
            </div>
        </div>
    )
}

// ─── Message Item ──────────────────────────────────────────────────────────
const MessageItem = memo(({ msg, onDownload, onConfirm, onUseInCampaign, currentMode }: { msg: any; onDownload: (url: string, i: number) => void, onConfirm?: (strat: any) => void, onUseInCampaign?: (text: string) => void, currentMode: AIMode }) => {
    const [copied, setCopied] = useState(false)
    const parsedMsg = useMemo(() => parseChatMessage(msg), [msg])
    const cleanContent = useMemo(() =>
        String(parsedMsg.content || '').replace(/\[VIDEO_PREVIEW\]:.*\n?|\[IMAGE_PREVIEW\]:.*\n?/g, '').trim()
        , [parsedMsg.content])

    const handleCopy = () => {
        navigator.clipboard.writeText(cleanContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
            <div className={`shrink-0 ${msg.role === 'user' ? 'w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shadow-lg ring-4 ring-zinc-900/50' : ''}`}>
                {msg.role === 'user' ? (
                    <User className='w-4 h-4 text-white hover:scale-110 transition-transform' />
                ) : (
                    <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10 transition-transform group-hover:scale-110 duration-500">
                        <Logo className="w-7 h-7" />
                    </div>
                )}
            </div>
            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 group/message`}>
                <div className={`p-5 rounded-[2rem] text-sm leading-[1.6] whitespace-pre-wrap shadow-xl ${parsedMsg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none border border-white/5' : 'bg-[#1A1D21]/80 backdrop-blur-xl text-gray-100 border border-white/10 rounded-tl-none ring-1 ring-white/5'}`}>
                    {cleanContent}

                    {/* 📋 PROPOSAL — Antes de generar */}
                    {parsedMsg.type === 'PROPOSAL' && parsedMsg.strategy && (
                        <CampaignProposal
                            strategy={parsedMsg.strategy}
                            onConfirm={() => onConfirm?.(parsedMsg.strategy)}
                            isGenerating={!!parsedMsg.isGenerating}
                            mode={currentMode}
                        />
                    )}

                    {/* 🖼️ IMAGES — Solo para modo IMAGE_GEN */}
                    {parsedMsg.type === 'IMAGE_GEN' && (
                        <>
                            {/* Imágenes ya listas */}
                            {Array.isArray(parsedMsg.images) && parsedMsg.images.filter(Boolean).length > 0 && (
                                <ImageGrid images={parsedMsg.images.filter(Boolean)} onDownload={onDownload} />
                            )}
                            {/* Imágenes en proceso */}
                            {parsedMsg.pendingCount > 0 && (
                                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(parsedMsg.pendingCount, 3)}, 1fr)` }}>
                                    {Array.from({ length: parsedMsg.pendingCount }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Generando...</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Copies/Título generados */}
                            <ContentPanel strategy={parsedMsg.strategy} onSaveCampaign={() => onConfirm?.(parsedMsg.strategy)} />
                        </>
                    )}

                    {/* 🎬 VIDEO — Solo para modo VIDEO_GEN */}
                    {parsedMsg.type === 'VIDEO_GEN' && (
                        <>
                            {(parsedMsg.videoUrl && parsedMsg.videoUrl !== 'PENDING...') ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 relative group/video">
                                    <video src={parsedMsg.videoUrl} controls className="w-full aspect-video object-cover" />
                                    <button
                                        onClick={() => onDownload(parsedMsg.videoUrl, 0)}
                                        className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition opacity-0 group-hover/video:opacity-100"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : parsedMsg.videoPendingId ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[120px] flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                                    <span className="text-xs font-medium text-purple-300 animate-pulse">Generando Video... (puede tardar 3-5 min)</span>
                                </div>
                            ) : null}
                            {/* Guión y copies del video */}
                            <ContentPanel strategy={parsedMsg.strategy} onSaveCampaign={() => onConfirm?.(parsedMsg.strategy)} />
                        </>
                    )}
                </div>

                {parsedMsg.role === 'assistant' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white transition"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </button>
                        {parsedMsg.type !== 'PROPOSAL' && parsedMsg.type !== 'IMAGE_GEN' && parsedMsg.type !== 'VIDEO_GEN' && parsedMsg.id !== 'initial' && !String(parsedMsg.content || '').includes('❌ Error') && (
                            <button
                                onClick={() => onUseInCampaign?.(parsedMsg.content)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-[10px] text-indigo-300 hover:text-indigo-200 transition font-bold"
                            >
                                <Sparkles className="w-3 h-3" /> ✨ Usar en campaña
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})
MessageItem.displayName = 'MessageItem'

const ERROR_MAP: Record<string, string> = {
    'REPLICATE_PAYMENT_REQUIRED': '❌ Tu cuenta de Replicate no tiene créditos o requiere un método de pago activo. Por favor, revisa tu cuenta en replicate.com.',
    'REPLICATE_AUTH_FAILED': '❌ Error de autenticación con Replicate. Verifica que REPLICATE_API_TOKEN sea correcta en el archivo .env.',
    'MISSING_API_KEY': '❌ No se encontró la llave de API (REPLICATE_API_TOKEN). Contáctate con el administrador.',
    'TIMEOUT_REACHED': '⌛ La generación tardó más de lo esperado (timeout). Intenta con un prompt más simple.',
    'INVALID_OUTPUT_URL': '❌ La IA generó un archivo pero el formato no es válido. Intenta de nuevo.'
}

// ─── Empty State — Inspiration Cards ─────────────────────────────────────────
function EmptyStateStudio({ mode, onSelect }: { mode: AIMode; onSelect: (prompt: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-1000">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
                <Logo className="w-24 h-24 relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight font-outfit">
                Estudio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Creativo</span>
            </h2>
            <p className="text-zinc-500 text-sm md:text-base max-w-lg mb-12 font-medium">
                Bienvenido al centro de mando creativo de CarMatch. ¿Qué tipo de producción viral vamos a conceptualizar hoy?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
                {SUGGESTIONS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(s.prompt)}
                        className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-3xl text-left transition-all duration-500 backdrop-blur-sm"
                    >
                        <div className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-500">{s.icon}</div>
                        <h4 className="text-sm font-black text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{s.title}</h4>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed font-medium">Click para iniciar esta idea creativa...</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Download helper ───────────────────────────────────────────────────────
async function downloadFile(url: string, filename: string) {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
    } catch {
        window.open(url, '_blank')
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AIStudio({ defaultMode }: { defaultMode?: AIMode }) {
    const { registerProduction } = useVideoProduction()
    const { registerImageProduction } = useImageProduction()
    const [mode, setMode] = useState<AIMode>(defaultMode || 'CHAT')
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [showHistory, setShowHistory] = useState(true)
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    useEffect(() => { scrollToBottom() }, [messages])

    // Sincronizar modo con el panel superior
    useEffect(() => {
        if (defaultMode) {
            setMode(defaultMode)
            setCurrentSessionId(null)
            setMessages([])
        }
    }, [defaultMode])


    // Load sessions / set welcome message
    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoadingHistory(true)
            try {
                const res = await getAISessions() // Remove mode filter to show all history
                if (res.success && res.chats) setSessions(res.chats)
            } catch { } finally { setIsLoadingHistory(false) }
        }
        fetchSessions()

        if (!currentSessionId) {
            const welcomes: Record<string, string> = {
                IMAGE_GEN: '🎨 **Estudio de Imágenes (Beta)**\n\n¡Hola! Ruben. Vamos a planear tu próxima gran producción visual. Cuéntame qué tienes en mente, qué coches, qué ambiente o qué historia quieres contar.\n\nPuedo crear series de hasta 50 imágenes distintas para tus redes sociales.\n\n*Cuando estés listo, solo dime "dame el pront final" para ver la propuesta técnica.*',
                VIDEO_GEN: '🎬 **Productora de Video**\n\n¡Hola! Ruben. Aquí es donde planeamos los videos que romperán el algoritmo. Cuéntame tu idea, el nicho (JDM, Off-road, etc.) y qué quieres lograr.\n\n*Platiquemos la idea y cuando la tengamos, dime "dame el pront final" para generar el guión y clips.*',
                CHAT: '¡Hola! Soy tu Director Creativo de IA. ¿Creamos algo viral hoy? 🚀\n\n*Nota: CarMatch facilita la conexión, pero no se involucra en las negociaciones finales ni transacciones entre usuarios.*'
            }
            setMessages([{ id: 'initial', role: 'assistant', content: welcomes[mode] || welcomes.CHAT }])
        }
    }, [mode, currentSessionId])

    const loadSessions = async () => {
        try {
            const res = await getAISessions() // All sessions
            if (res.success && res.chats) setSessions(res.chats)
        } catch { }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([])
        setShowHistory(false)
    }

    const handleSelectSession = async (sessionId: string) => {
        if (currentSessionId === sessionId) {
            return
        }
        setIsLoadingHistory(true)
        try {
            const res = await getAISession(sessionId)
            if (res.success && res.chat) {
                setCurrentSessionId(res.chat.id)
                const uiMessages = res.chat.messages.map((m: any) => parseChatMessage({ id: m.id, role: m.role, content: m.content }))
                setMessages(uiMessages)
                setMode((res.chat.mode as AIMode) || 'CHAT')
            }
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('¿Estás seguro de que quieres borrar este chat?')) return
        const res = await deleteAISession(sessionId)
        if (res.success) {
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null)
                setMessages([])
            }
        }
    }

    const handleRenameSession = async (sessionId: string) => {
        if (!editName.trim()) return
        const res = await renameAISession(sessionId, editName)
        if (res.success) {
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: editName } : s))
            setEditingSessionId(null)
        }
    }

    // ── handleSend: regular chat (no generation) ──────────────────────────
    const handleSend = async () => {
        if (!prompt.trim() || isGenerating) return
        const userText = prompt
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }])
        setPrompt('')
        setIsGenerating(true)

        try {
            let sessionId = currentSessionId
            if (!sessionId) {
                const newSessionRes = await createAISession(mode, userText)
                if (newSessionRes.success && newSessionRes.chat) {
                    sessionId = newSessionRes.chat.id
                    setCurrentSessionId(sessionId)
                    await loadSessions()
                }
            }
            if (sessionId) await saveAIMessage(sessionId, 'user', userText)

            // Modo CHAT tradicional basado en nichos y experiencia
            const historyForAI = messages.slice(-10)
            const response = await chatWithPublicityAgent([...historyForAI, { role: 'user', content: userText }], 'MX', mode)

            const aiResponse = response.success ? response : { success: false, message: '❌ Error al procesar tu mensaje.' }

            const newMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: aiResponse.message || '',
                type: (aiResponse as any).type,
                strategy: (aiResponse as any).strategy
            }

            setMessages(prev => [...prev, newMessage])
            if (sessionId) await saveAIMessage(sessionId, 'assistant', JSON.stringify({
                content: newMessage.content,
                type: newMessage.type,
                strategy: newMessage.strategy
            }))

        } catch (e: any) {
            const mappedMessage = ERROR_MAP[e.message] || `❌ Error: ${e.message}`
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: mappedMessage }])
        } finally {
            setIsGenerating(false)
        }
    }

    // ── handleUseInCampaign: Genera propuesta estratégica y salta directo a Campañas ──
    const handleUseInCampaign = async (ideaText: string) => {
        if (isGenerating) return
        setIsGenerating(true)

        const thinkingId = Date.now().toString() + '_proposal_thinking'
        try {
            // Add a temporary "pensando..." message
            setMessages(prev => [...prev, {
                id: thinkingId,
                role: 'assistant',
                content: mode === 'IMAGE_GEN' ? `🎨 Diseñando campaña visual para esta idea...` : `🎬 Estructurando guiones y formatos de video para esta idea...`
            }])

            const { getCampaignStrategyPreview } = await import('@/app/admin/actions/ai-content-actions')

            // --- INTELIGENCIA DE MODO ---
            // Si el modo es CHAT o estamos en una duda, escaneamos los últimos mensajes buscando el "espíritu" de la petición
            let detectedMode: 'IMAGE' | 'VIDEO' = mode === 'VIDEO_GEN' ? 'VIDEO' : 'IMAGE'

            if (mode === 'CHAT') {
                const recentContext = messages.slice(-4).map(m => m.content.toLowerCase()).join(' ')
                const videoKeywords = ['video', 'clip', 'reels', 'shorts', 'tiktok', 'animación', 'movimiento']
                const hasVideoIntent = videoKeywords.some(kw => recentContext.includes(kw))
                detectedMode = hasVideoIntent ? 'VIDEO' : 'IMAGE'
            }

            // Pasamos el chat histórico + la idea específica seleccionada
            const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || ""
            const count = extractImageCount(lastUserMsg);

            const contextMessages = [
                ...messages.slice(-10), // Solo enviamos los últimos 10 para no saturar tokens pero mantener contexto
                { role: 'user', content: `Basado en esta conversación y específicamente en mi última petición: "${lastUserMsg}". Diseña la campaña definitiva en formato ${detectedMode === 'IMAGE' ? 'IMAGEN/CARRUSEL' : 'VIDEO VERTIACAL'}.` }
            ];

            const res = await getCampaignStrategyPreview(contextMessages, detectedMode, 'MX', count)

            // Quitar mensaje "pensando"
            setMessages(prev => prev.filter(m => m.id !== thinkingId))

            if (res.success) {
                const aiContent = `🚀 ¡Perfecto! He diseñado la estrategia maestra. Te estoy llevando al **Área de Publicidad** para iniciar la producción de tus assets de inmediato. ✨`
                const msgId = Date.now().toString()
                setMessages(prev => [...prev, {
                    id: msgId,
                    role: 'assistant',
                    content: aiContent
                }])

                if (currentSessionId) await saveAIMessage(currentSessionId, 'assistant', aiContent)

                // IMPORTANTE: Liberamos el estado de generación para que handleGenerate pueda tomarlo
                setIsGenerating(false)

                // Esperamos un momento para que el usuario lea y saltamos
                setTimeout(() => {
                    handleGenerate(res.strategy)
                }, 1000)

                return // Salimos para evitar el finally que pondría isGenerating en false de nuevo innecesariamente
            } else {
                throw new Error(res.error || 'Error al generar propuesta')
            }
        } catch (e: any) {
            // Remove thinking message if it's there
            setMessages(prev => prev.filter(m => m.id !== thinkingId))
            const mappedMessage = ERROR_MAP[e.message] || `❌ Error: ${e.message}`
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: mappedMessage }])
        } finally {
            setIsGenerating(false)
        }
    }

    // ── handleGenerate: lanza generación en segundo plano → resultado va a Campañas ──
    const handleGenerate = async (confirmedStrategy?: any) => {
        if (isGenerating) return
        setIsGenerating(true)

        const thinkingId = Date.now().toString() + '_thinking'

        try {
            if (mode === 'IMAGE_GEN') {
                let strat = confirmedStrategy;
                let count = strat?.imagePrompts?.length || strat?.count || 1;

                if (!strat) {
                    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''
                    count = extractImageCount(lastUserMsg)

                    // 1️⃣ Mensaje en chat: confirmación instantánea
                    setMessages(prev => [...prev, {
                        id: thinkingId, role: 'assistant',
                        content: `🎨 Generando ${count} imagen${count > 1 ? 'es' : ''} en segundo plano...\n\n📁 **Ve a Campañas** para ver el resultado cuando esté listo.`
                    }])
                    setPrompt('')

                    // 2️⃣ Generar estrategia + lanzar predicciones en Replicate
                    const { generateImageStrategy } = await import('@/app/admin/actions/ai-content-actions')
                    const stratRes = await generateImageStrategy(messages.slice(-10), 'MX', count)
                    if (!stratRes.success) throw new Error((stratRes as any).error || 'Error en estrategia')
                    strat = (stratRes as any).strategy;
                } else {
                    // Si ya tenemos la estrategia confirmada, solo actualizamos el mensaje
                    setMessages(prev => [...prev, {
                        id: thinkingId, role: 'assistant',
                        content: `🚀 Iniciando generación masiva de ${count} imágenes...`
                    }])
                }

                // 3️⃣ Lanzar predicciones: BACKGROUND (masivo)
                const { launchBatchImagePredictions } = await import('@/app/admin/actions/ai-content-actions')

                // Actualizar mensaje de "Thinking" con confirmación inmediata
                const finalContent = `ok campaña confirmada`
                setMessages(prev => prev.map(m => m.id === thinkingId
                    ? { ...m, content: finalContent }
                    : m
                ))
                if (currentSessionId) await saveAIMessage(currentSessionId, 'assistant', finalContent)

                // 6️⃣ Cambiar al tab de Campañas automáticamente (INMEDIATO)
                window.dispatchEvent(new CustomEvent('switch-admin-tab', { detail: { tab: 'publicity' } }))

                // Generar los IDs pendientes dinámicos
                const pendingIdsObj: any = {}
                for (let i = 0; i < count; i++) {
                    pendingIdsObj[`img_${i}`] = 'PENDING...'
                }

                // 4️⃣ GUARDADO AUTOMÁTICO: Persistir en la base de datos INMEDIATAMENTE con IDs temporales
                const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions')
                const tempAssets = {
                    ...strat,
                    imageUrl: null,
                    imagePendingIds: pendingIdsObj,
                    type: 'image',
                    count: count
                }
                const tempSaveRes = await createCampaignFromAssets(tempAssets)
                const campaignId = tempSaveRes.success ? (tempSaveRes as any).campaign?.id : null

                // Notificar a la UI global que hay una nueva campaña (con estado pending)
                window.dispatchEvent(new CustomEvent('campaign-created', { detail: tempSaveRes }))

                // 5️⃣ Despachar evento local → Abre el panel de preview con el ID REAL de campaña
                window.dispatchEvent(new CustomEvent('open-campaign-assets', {
                    detail: {
                        ...tempAssets,
                        campaignId
                    }
                }))

                // 6️⃣ Lanzamos la producción en segundo plano usando el Contexto de React
                const prompts = strat.imagePrompts && Array.isArray(strat.imagePrompts)
                    ? strat.imagePrompts.map((item: any) => typeof item === 'string' ? item : item.prompt)
                    : Array.from({ length: count }).map(() => strat.imagePrompt);

                const limitedPrompts = prompts.slice(0, 50);

                if (campaignId) {
                    const initialClips = limitedPrompts.map((p: string, i: number) => ({
                        imageId: `img_${i}`,
                        prompt: p,
                        predictionId: null,
                        status: 'pending',
                        url: null
                    }));
                    registerImageProduction(campaignId, initialClips);
                }

            } else if (mode === 'VIDEO_GEN') {
                let strategy = confirmedStrategy;

                if (!strategy) {
                    // 1️⃣ Mensaje en chat: confirmación instantánea
                    setMessages(prev => [...prev, {
                        id: thinkingId, role: 'assistant',
                        content: `🎬 Analizando tu idea y preparando la producción...`
                    }])
                    setPrompt('')

                    // 2️⃣ Generar estrategia multi-escena (guión + scenes[] + copies)
                    const { generateVideoStrategy } = await import('@/app/admin/actions/ai-content-actions')
                    const strat = await generateVideoStrategy(messages.slice(-10), 'MX')
                    if (!strat.success) throw new Error((strat as any).error || 'Error en estrategia')
                    strategy = (strat as any).strategy;
                } else {
                    setMessages(prev => [...prev, {
                        id: thinkingId, role: 'assistant',
                        content: `🎬 Iniciando producción de video: "${strategy.internal_title}"...`
                    }])
                }

                const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions')
                const scenesCount = strategy.scenes?.length || 0
                const duration = strategy.scenes?.reduce((a: number, s: any) => a + (s.duration_seconds || 8), 0) || 0

                // 3️⃣ GUARDADO AUTOMÁTICO: Crear la campaña en la BD de inmediato
                const saveRes = await createCampaignFromAssets(strategy)
                const campaignId = saveRes.success ? (saveRes as any).campaign?.id : null

                // Refrescar lista de campañas en el fondo
                window.dispatchEvent(new CustomEvent('campaign-created', { detail: saveRes }))

                // Actualizar mensaje: campaña creada, listo para producir
                setMessages(prev => prev.map(m => m.id === thinkingId
                    ? { ...m, content: `✅ Guión y copies listos — ${scenesCount} escenas (~${duration}s)\n\n🚀 Guardado en **Campañas**. Iniciando producción de escenas una por una...` }
                    : m
                ))

                const initialClips = strategy.scenes.map((s: any) => ({
                    sceneId: s.id,
                    predictionId: null,
                    status: 'pending',
                    url: null
                }))

                // 6️⃣ Cambiar al tab de Campañas automáticamente (INMEDIATO)
                window.dispatchEvent(new CustomEvent('switch-admin-tab', { detail: { tab: 'publicity' } }))

                // 5️⃣ Abrir assets INMEDIATAMENTE con el guión y estrategia generada
                window.dispatchEvent(new CustomEvent('open-campaign-assets', {
                    detail: {
                        ...strategy,
                        type: 'video',
                        videoPendingId: 'PENDING...'
                    }
                }))

                // 4️⃣ Lanzar predicciones en segundo plano sin bloquear el chat
                const { launchMultiSceneVideoPredictions } = await import('@/app/admin/actions/ai-content-actions')

                // 5️⃣ Generación en segundo plano
                launchMultiSceneVideoPredictions(strategy.scenes, strategy.master_style).then(async (multiRes) => {
                    const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions')
                    const fullAssets = {
                        ...strategy,
                        imageUrl: null, // Se llenará por polling
                        scenes: multiRes.success ? multiRes.scenes : strategy.scenes,
                        type: 'video',
                        videoPendingId: (multiRes as any).scenes?.[0]?.predictionId || null // Para polling inicial
                    }
                    const saveRes = await createCampaignFromAssets(fullAssets)
                    const campaignId = saveRes.success ? (saveRes as any).campaign?.id : null

                    // Notificar a la UI global
                    window.dispatchEvent(new CustomEvent('campaign-created', { detail: saveRes }))

                    // Actualizar modal con ID real
                    window.dispatchEvent(new CustomEvent('open-campaign-assets', {
                        detail: {
                            ...fullAssets,
                            campaignId
                        }
                    }))
                });
            }

        } catch (error: any) {
            const mapped = ERROR_MAP[error.message] || `❌ ${error.message}`
            setMessages(prev => [...prev.filter(m => m.id !== thinkingId), { id: Date.now().toString(), role: 'assistant', content: mapped }])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = (url: string, i: number) => {
        const ext = mode === 'VIDEO_GEN' ? 'mp4' : 'jpg'
        downloadFile(url, `carmatch-${mode.toLowerCase()}-${Date.now()}-${i + 1}.${ext}`)
    }

    const switchMode = (newMode: AIMode) => {
        setMode(newMode)
        setCurrentSessionId(null)
        setMessages([])
    }

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-3xl border border-white/10 relative shadow-2xl">

            {/* ─── SIDEBAR / DRAWER — HISTORY & PROJECTS ─── */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        {/* Mobile Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-80 bg-zinc-900 border-r border-white/10 z-[101] flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Logo className="w-6 h-6 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Historial</span>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-xl transition">
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-white/5">
                                <button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-2xl p-4 text-[10px] font-black tracking-widest uppercase transition-all duration-300 active:scale-95 group"
                                >
                                    <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-500" />
                                    NUEVA PRODUCCIÓN
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {sessions.length === 0 ? (
                                    <div className="p-10 text-center opacity-30 select-none">
                                        <Bot className="w-10 h-10 mx-auto mb-4" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sin Proyectos</p>
                                    </div>
                                ) : (
                                    sessions.map(session => (
                                        <div key={session.id} className="group relative border border-transparent hover:border-white/5 rounded-2xl overflow-hidden transition-all bg-white/0 hover:bg-white/[0.02]">
                                            {editingSessionId === session.id ? (
                                                <div className="p-3 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                                                    <input
                                                        autoFocus
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRenameSession(session.id);
                                                            if (e.key === 'Escape') setEditingSessionId(null);
                                                        }}
                                                        className="flex-1 bg-black/40 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs outline-none"
                                                    />
                                                    <button onClick={() => handleRenameSession(session.id)} className="p-1.5 text-green-500 hover:scale-110 transition-transform">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-1">
                                                    <button
                                                        onClick={() => { handleSelectSession(session.id); setShowHistory(false); }}
                                                        className={`flex-1 text-left p-3.5 text-[11px] truncate transition-all duration-300 ${currentSessionId === session.id ? 'text-indigo-400 font-bold bg-indigo-500/5 rounded-xl' : 'text-zinc-500 hover:text-white'}`}
                                                    >
                                                        {session.name}
                                                    </button>
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditName(session.name); }}
                                                            className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                                                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ─── MAIN CONTENT AREA ─── */}
            <main className="flex-1 flex flex-col relative z-20 min-w-0">
                {/* MODERN HEADER — Reducido para Móvil */}
                <header className="h-16 md:h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 shrink-0 relative overflow-hidden group/header">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-50" />

                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="p-2 md:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all duration-300 active:scale-95 shrink-0"
                        >
                            <History className={`w-5 h-5 ${showHistory ? 'text-indigo-500' : ''}`} />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isGenerating ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} />
                                <h1 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 truncate">
                                    {mode === 'IMAGE_GEN' ? 'Estudio Imagen' : mode === 'VIDEO_GEN' ? 'Lab Video' : 'Mastermind'}
                                </h1>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-gray-300 mt-0.5 truncate max-w-[120px] md:max-w-md">
                                {currentSessionId ? (sessions.find(s => s.id === currentSessionId)?.name || 'Proyecto Actual') : 'Nueva Producción'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status badge compacto para móvil */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                            <Bot className="w-3 h-3 text-indigo-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">v2.0</span>
                        </div>
                    </div>
                </header>

                {/* MESSAGES / WORKING AREA */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a] relative group/view">
                    {/* Background Detail */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.02)_0%,transparent_50%)] pointer-events-none" />

                    <div className="relative min-h-full">
                        {messages.length === 0 ? (
                            <EmptyStateStudio mode={mode} onSelect={(p) => { setPrompt(p); handleSend(); }} />
                        ) : (
                            <div className="p-4 md:p-12 space-y-8 md:space-y-12 max-w-5xl mx-auto">
                                {messages.map((msg, i) => (
                                    <div key={msg.id || i} className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                        <MessageItem
                                            msg={msg}
                                            onDownload={handleDownload}
                                            onConfirm={handleGenerate}
                                            onUseInCampaign={handleUseInCampaign}
                                            currentMode={mode}
                                        />
                                    </div>
                                ))}

                                {isGenerating && (
                                    <div className="flex gap-6 animate-in fade-in slide-in-from-left-6 duration-500 max-w-4xl mx-auto">
                                        <div className="shrink-0 p-3 bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 rounded-3xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)] ring-4 ring-indigo-500/5">
                                            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                                        </div>
                                        <div className="bg-[#1A1D21]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] rounded-tl-none p-8 px-12 shadow-[0_40px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 animate-shimmer scale-150" style={{ backgroundSize: '200% 100%' }} />
                                            <div className="flex items-center gap-8 relative z-10">
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                                                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                                                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Mastermind Directing</span>
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Procesando Estrategia de Impacto...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-20" />
                            </div>
                        )}
                    </div>
                </div>

                {/* INPUT AREA — Floating Control Center — Optimizado Móvil */}
                <div className="p-3 md:p-12 relative z-20">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -top-32" />
                    <div className="relative max-w-5xl mx-auto group/input">

                        <div className="relative flex items-end gap-2 bg-[#1A1D21]/95 md:bg-[#1A1D21]/90 backdrop-blur-3xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-2 md:p-3 focus-within:border-indigo-500/50 focus-within:ring-8 md:focus-within:ring-[12px] focus-within:ring-indigo-500/5 transition-all duration-700 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder={
                                    mode === 'IMAGE_GEN' ? '¿Qué visualizamos hoy?' :
                                        mode === 'VIDEO_GEN' ? 'Dime tu visión para el video...' :
                                            'Escribe tu visión aquí...'
                                }
                                className="w-full bg-transparent border-none focus:ring-0 text-[13px] md:text-lg text-gray-100 placeholder-zinc-700 min-h-[52px] max-h-[200px] py-3 px-3 md:py-4 md:px-6 resize-none custom-scrollbar font-medium leading-relaxed"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!prompt.trim() || isGenerating}
                                className="group w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-2xl md:rounded-[2rem] transition-all duration-500 shrink-0 shadow-2xl shadow-indigo-600/30 active:scale-90 disabled:opacity-20 flex items-center justify-center"
                            >
                                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />}
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
