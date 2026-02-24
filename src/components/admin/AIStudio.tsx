import { useState, useRef, useEffect, memo, useMemo } from 'react'
import {
    Sparkles, User, Send, ImageIcon,
    Video, Copy, Check, Plus, History, RefreshCw,
    Bot, Download, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { createAISession, getAISession, getAISessions, deleteAISession, saveAIMessage } from '@/app/admin/actions/ai-studio-actions'
import { chatWithPublicityAgent } from '@/app/admin/actions/ai-content-actions'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'VIDEO_GEN' | 'STRATEGY'

// ─── Helper: extract how many images user asked for (1-10) ─────────────────
function extractImageCount(text: string): number {
    const patterns = [
        /(?:crea|genera|hazme|dame|quiero|necesito)\s+(\d+)\s+(?:foto|imagen|fotos|imágenes|imagenes)/i,
        /(\d+)\s+(?:foto|imagen|fotos|imágenes|imagenes)/i,
    ]
    for (const p of patterns) {
        const m = text.match(p)
        if (m) {
            const n = parseInt(m[1])
            return Math.min(Math.max(n, 1), 10)
        }
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
function ContentPanel({ strategy }: { strategy: any }) {
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

    // ── Plataformas de VIDEO (keys nuevas de generateVideoStrategy) ──────────
    const vidTT = platforms?.tiktok
    const vidIG = platforms?.instagram_reels
    const vidYTS = platforms?.youtube_shorts
    const vidFB = platforms?.facebook_reels
    const vidSC = platforms?.snapchat
    const vidYTL = platforms?.youtube_largo

    // ── Detectar si es estrategia de VIDEO ──────────────────────────────────
    const isVideoStrategy = !!(vidIG || vidYTS || vidFB || vidSC || vidYTL)

    const videoRows = isVideoStrategy ? [
        vidTT && { icon: '🎵', label: 'TikTok', badge: vidTT.format || 'Vertical 9:16', duration: vidTT.duration || '30s–60s', isHoriz: false, text: [vidTT.caption, vidTT.audio_suggestion ? `🎶 Audio: ${vidTT.audio_suggestion}` : ''].filter(Boolean).join('\n') },
        vidIG && { icon: '📸', label: 'Instagram Reels', badge: vidIG.format || 'Vertical 9:16', duration: vidIG.duration || '30s–90s', isHoriz: false, text: vidIG.caption },
        vidYTS && { icon: '▶️', label: 'YouTube Shorts', badge: vidYTS.format || 'Vertical 9:16', duration: vidYTS.duration || '30s–60s', isHoriz: false, text: [vidYTS.titulo, vidYTS.descripcion].filter(Boolean).join('\n') },
        vidFB && { icon: '📘', label: 'Facebook Reels', badge: vidFB.format || 'Vertical 9:16', duration: vidFB.duration || '30s–90s', isHoriz: false, text: vidFB.caption },
        vidSC && { icon: '👻', label: 'Snapchat Spotlight', badge: vidSC.format || 'Vertical 9:16', duration: vidSC.duration || '15s–60s', isHoriz: false, text: vidSC.caption },
        vidYTL && { icon: '🎬', label: 'YouTube (largo)', badge: vidYTL.format || 'Horizontal 16:9', duration: vidYTL.duration || '3min–10min', isHoriz: true, text: [vidYTL.titulo, vidYTL.descripcion].filter(Boolean).join('\n') },
    ].filter(Boolean) as { icon: string; label: string; badge: string; duration: string; isHoriz: boolean; text: string }[] : []

    const imageRows = !isVideoStrategy ? [
        imgFb && { icon: '📘', label: 'Facebook', text: [imgFb.titulo || imgFb.title || imgFb.headline, imgFb.descripcion || imgFb.description || imgFb.primary_text].filter(Boolean).join('\n\n') },
        imgIg && { icon: '📸', label: 'Instagram', text: imgIg.caption },
        imgTt && { icon: '🎵', label: 'TikTok', text: imgTt.caption },
        imgTw && { icon: '🐦', label: 'Twitter / X', text: imgTw.tweet },
        imgYt && { icon: '▶️', label: 'YouTube', text: [imgYt.titulo || imgYt.title, imgYt.descripcion || imgYt.description].filter(Boolean).join('\n') },
        imgWa && { icon: '💬', label: 'WhatsApp', text: imgWa.mensaje },
        imgLi && { icon: '💼', label: 'LinkedIn', text: imgLi.post },
        imgTh && { icon: '🧵', label: 'Threads', text: imgTh.post },
    ].filter(Boolean) as { icon: string; label: string; text: string }[] : []

    return (
        <div className="mt-3 border border-white/10 rounded-xl overflow-hidden bg-black/30">
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

            {/* ─── Plataformas de VIDEO ─────────────────── */}
            {isVideoStrategy && videoRows.length > 0 && (
                <>
                    <div className="px-3 py-1.5 bg-purple-900/20 border-y border-purple-500/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">📱 Copies por plataforma de video</p>
                    </div>
                    {videoRows.map((row, i) => (
                        <div key={row.label} className={`flex items-start justify-between gap-2 px-3 py-2.5 ${i < videoRows.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{row.icon} {row.label}</p>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${row.isHoriz ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {row.badge}
                                    </span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">
                                        ⏱ {row.duration}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">{row.text}</p>
                            </div>
                            <div className="shrink-0"><CopyBtn text={row.text} label="Copiar" /></div>
                        </div>
                    ))}
                </>
            )}

            {/* ─── Plataformas de IMAGEN ─────────────────── */}
            {!isVideoStrategy && imageRows.length > 0 && (
                <>
                    <div className="px-3 py-1.5 bg-white/3 border-y border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">🌐 Copies por red social</p>
                    </div>
                    {imageRows.map((row, i) => (
                        <PlatformRow key={row.label} icon={row.icon} label={row.label} text={row.text} borderBottom={i < imageRows.length - 1} />
                    ))}
                </>
            )}
        </div>
    )
}

// ─── Message Item ──────────────────────────────────────────────────────────
const MessageItem = memo(({ msg, onDownload }: { msg: any; onDownload: (url: string, i: number) => void }) => {
    const [copied, setCopied] = useState(false)

    const cleanContent = useMemo(() =>
        msg.content.replace(/\[VIDEO_PREVIEW\]:.*\n?|\[IMAGE_PREVIEW\]:.*\n?/g, '').trim()
        , [msg.content])

    const handleCopy = () => {
        navigator.clipboard.writeText(cleanContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
                {msg.role === 'user' ? <User className='w-4 h-4 text-white' /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-[#1A1D21] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                    {cleanContent}

                    {/* 🖼️ IMAGES — Solo para modo IMAGE_GEN */}
                    {msg.type === 'IMAGE_GEN' && (
                        <>
                            {/* Imágenes ya listas */}
                            {msg.images && msg.images.filter(Boolean).length > 0 && (
                                <ImageGrid images={msg.images.filter(Boolean)} onDownload={onDownload} />
                            )}
                            {/* Imágenes en proceso */}
                            {msg.pendingCount > 0 && (
                                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(msg.pendingCount, 3)}, 1fr)` }}>
                                    {Array.from({ length: msg.pendingCount }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Generando...</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Copies/Título generados */}
                            <ContentPanel strategy={msg.strategy} />
                        </>
                    )}

                    {/* 🎬 VIDEO — Solo para modo VIDEO_GEN */}
                    {msg.type === 'VIDEO_GEN' && (
                        <>
                            {(msg.videoUrl && msg.videoUrl !== 'PENDING...') ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 relative group/video">
                                    <video src={msg.videoUrl} controls className="w-full aspect-video object-cover" />
                                    <button
                                        onClick={() => onDownload(msg.videoUrl, 0)}
                                        className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition opacity-0 group-hover/video:opacity-100"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : msg.videoPendingId ? (
                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[120px] flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                                    <span className="text-xs font-medium text-purple-300 animate-pulse">Generando Video... (puede tardar 3-5 min)</span>
                                </div>
                            ) : null}
                            {/* Guión y copies del video */}
                            <ContentPanel strategy={msg.strategy} />
                        </>
                    )}
                </div>

                {msg.role === 'assistant' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white transition"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </button>
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
    const [mode, setMode] = useState<AIMode>(defaultMode || 'CHAT')
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    useEffect(() => { scrollToBottom() }, [messages])


    // Load sessions / set welcome message
    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoadingHistory(true)
            try {
                const res = await getAISessions(mode)
                if (res.success && res.chats) setSessions(res.chats)
            } catch { } finally { setIsLoadingHistory(false) }
        }
        fetchSessions()

        if (!currentSessionId) {
            const welcomes: Record<string, string> = {
                IMAGE_GEN: '🎨 **Estudio de Imágenes**\n\nDime qué foto quieres y cuántas necesitas (máx 10).\n\nEjemplos:\n• "Crea 3 fotos de CarMatch en ciudad nocturna"\n• "Genera 5 imágenes de lujo para Instagram"\n• "Una foto de un Mustang rojo en la carretera"',
                VIDEO_GEN: '🎬 **Productora de Video**\n\nDescribe el video que necesitas y lo genero.\n\nEjemplos:\n• "Video de 15s para TikTok de CarMatch"\n• "Anuncio cinematográfico de SUV de lujo"\n• "Historia de usuario vendiendo su auto con CarMatch"',
                CHAT: '¡Hola! Soy tu Director Creativo de IA. ¿Creamos algo viral hoy? 🚀'
            }
            setMessages([{ id: 'initial', role: 'assistant', content: welcomes[mode] || welcomes.CHAT }])
        }
    }, [mode, currentSessionId])

    const loadSessions = async () => {
        try {
            const res = await getAISessions(mode)
            if (res.success && res.chats) setSessions(res.chats)
        } catch { }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([])
        setShowHistory(false)
    }

    const handleSelectSession = async (sessionId: string) => {
        if (currentSessionId === sessionId) return
        setIsLoadingHistory(true)
        setCurrentSessionId(sessionId)
        setShowHistory(false)
        const res = await getAISession(sessionId)
        if (res.success && res.chat) {
            const uiMessages = res.chat.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content }))
            setMessages(uiMessages)
            setMode((res.chat.mode as AIMode) || 'CHAT')
        }
        setIsLoadingHistory(false)
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
                    loadSessions()
                }
            }
            if (sessionId) saveAIMessage(sessionId, 'user', userText)

            const historyForAI = messages.slice(-10)
            const response = await chatWithPublicityAgent([...historyForAI, { role: 'user', content: userText }], 'MX')

            const aiContent = response.success ? response.message! : '❌ Error al procesar tu mensaje.'
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiContent }])
            if (sessionId) await saveAIMessage(sessionId, 'assistant', aiContent)
        } catch (e: any) {
            const mappedMessage = ERROR_MAP[e.message] || `❌ Error: ${e.message}`
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: mappedMessage }])
        } finally {
            setIsGenerating(false)
        }
    }

    // ── handleGenerate: lanza generación en segundo plano → resultado va a Campañas ──
    const handleGenerate = async () => {
        if (isGenerating) return
        setIsGenerating(true)

        const thinkingId = Date.now().toString() + '_thinking'

        try {
            if (mode === 'IMAGE_GEN') {
                const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''
                const count = extractImageCount(lastUserMsg)

                // 1️⃣ Mensaje en chat: confirmación instantánea
                setMessages(prev => [...prev, {
                    id: thinkingId, role: 'assistant',
                    content: `🎨 Generando ${count} imagen${count > 1 ? 'es' : ''} en segundo plano...\n\n📁 **Ve a Campañas** para ver el resultado cuando esté listo.`
                }])
                setPrompt('')

                // 2️⃣ Generar estrategia + lanzar predicciones en Replicate
                const { generateImageStrategy, launchImageOnlyPrediction } = await import('@/app/admin/actions/ai-content-actions')
                const strat = await generateImageStrategy(messages.slice(-10), 'MX')
                if (!strat.success) throw new Error(strat.error || 'Error en estrategia')

                const predictions = await Promise.all(
                    Array.from({ length: count }).map((_, i) =>
                        launchImageOnlyPrediction({ ...strat.strategy, _seed: i }).catch(e => ({ success: false, error: e.message }))
                    )
                )

                // 3️⃣ Construir el objeto de assets (igual que PublicityTab espera)
                const imageUrls: string[] = []
                const imagePendingIds: Record<string, string | null> = {}
                predictions.forEach((pred, i) => {
                    if (!pred.success) return
                    const assets = (pred as any).assets
                    if (assets?.imageUrl?.startsWith('http')) {
                        imageUrls.push(assets.imageUrl)
                    }
                    if (assets?.imagePendingIds?.square) {
                        imagePendingIds[`img_${i}`] = assets.imagePendingIds.square
                        imagePendingIds.square = assets.imagePendingIds.square
                    }
                })

                // 4️⃣ Despachar evento → PublicityTab lo recibe y abre el panel de Campañas
                window.dispatchEvent(new CustomEvent('open-campaign-assets', {
                    detail: {
                        strategy: strat.strategy,
                        imageUrl: imageUrls[0] || null,
                        images: imageUrls,
                        imagePendingIds: Object.keys(imagePendingIds).length > 0 ? imagePendingIds : null,
                        type: 'image',
                        count,
                    }
                }))

                // 5️⃣ Cambiar al tab de Campañas automáticamente
                window.dispatchEvent(new CustomEvent('switch-admin-tab', { detail: { tab: 'publicity' } }))

                // Actualizar mensaje del chat con éxito
                setMessages(prev => prev.map(m => m.id === thinkingId
                    ? { ...m, content: `✅ ${count} imagen${count > 1 ? 'es iniciadas' : ' iniciada'} — se está generando en **Campañas** 📁\n\nAhí verás el resultado cuando esté listo junto con todos los copies para redes sociales.` }
                    : m
                ))

            } else if (mode === 'VIDEO_GEN') {
                // 1️⃣ Mensaje en chat: confirmación instantánea
                setMessages(prev => [...prev, {
                    id: thinkingId, role: 'assistant',
                    content: `🎬 Analizando tu idea y generando el guión con escenas...`
                }])
                setPrompt('')

                // 2️⃣ Generar estrategia multi-escena (guión + scenes[] + copies)
                const { generateVideoStrategy, launchMultiSceneVideoPredictions } = await import('@/app/admin/actions/ai-content-actions')
                const strat = await generateVideoStrategy(messages.slice(-10), 'MX')
                if (!strat.success) throw new Error(strat.error || 'Error en estrategia')

                const strategy = strat.strategy
                const scenes: { id: number; visual_prompt: string; duration_seconds: number }[] =
                    strategy.scenes || [{ id: 1, visual_prompt: strategy.videoPrompt_vertical || strategy.videoPrompt || '', duration_seconds: 8 }]
                const masterStyle: string = strategy.master_style || 'Cinematic car commercial, dark background, neon purple accents, smooth camera motion, high energy'

                // Actualizar mensaje: guión listo, lanzando clips
                setMessages(prev => prev.map(m => m.id === thinkingId
                    ? { ...m, content: `✅ Guión listo — ${scenes.length} escena${scenes.length > 1 ? 's' : ''} (~${scenes.reduce((a, s) => a + (s.duration_seconds || 8), 0)}s)\n\n🎬 Lanzando ${scenes.length} clips en paralelo... Ve a **Campañas** para ver el progreso.` }
                    : m
                ))

                // 3️⃣ Lanzar todas las predicciones de video en paralelo
                const multiRes = await launchMultiSceneVideoPredictions(scenes, masterStyle)
                const launchedScenes = multiRes.success ? multiRes.scenes : scenes.map(s => ({ sceneId: s.id, predictionId: null, status: 'error', url: null }))

                // 4️⃣ Despachar evento → PublicityTab inicializa el MultiSceneVideoPlayer
                window.dispatchEvent(new CustomEvent('open-campaign-assets', {
                    detail: {
                        ...strategy,
                        type: 'video',
                        scenes: launchedScenes,
                    }
                }))

                // 5️⃣ Cambiar al tab de Campañas automáticamente
                window.dispatchEvent(new CustomEvent('switch-admin-tab', { detail: { tab: 'publicity' } }))

                // Actualizar mensaje final
                setMessages(prev => prev.map(m => m.id === thinkingId
                    ? { ...m, content: `🚀 ${scenes.length} clips lanzados en paralelo — ~${scenes.reduce((a, s) => a + (s.duration_seconds || 8), 0)}s de video\n\n📁 Ve a **Campañas** para ver el progreso de cada escena. Cuando todos terminen podrás ensamblar y descargar el video final.` }
                    : m
                ))
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
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/5 flex-col relative">
            {/* HEADER */}
            <div className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20 relative">
                <div className="flex items-center gap-3">
                    <button onClick={handleNewChat} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition" title="Nuevo chat">
                        <Plus className="w-4 h-4" />
                    </button>

                    <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 shadow-lg">
                        <button
                            onClick={() => switchMode('IMAGE_GEN')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'IMAGE_GEN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">IMÁGENES</span>
                        </button>
                        <button
                            onClick={() => switchMode('VIDEO_GEN')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'VIDEO_GEN' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Video className="w-4 h-4" />
                            <span className="hidden sm:inline">VIDEO</span>
                        </button>
                        <button
                            onClick={() => switchMode('CHAT')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'CHAT' ? 'bg-zinc-700 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Bot className="w-4 h-4" />
                            <span className="hidden sm:inline">GENERAL</span>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition">
                        <History className="w-3.5 h-3.5" /> Historial
                    </button>
                    {showHistory && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1A1D21] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400">Chats anteriores</span>
                                <button onClick={() => setShowHistory(false)}><X className="w-3.5 h-3.5 text-zinc-500" /></button>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto p-1">
                                {sessions.length === 0
                                    ? <p className="text-xs text-zinc-600 p-3 text-center">No hay historial</p>
                                    : sessions.map(session => (
                                        <button key={session.id} onClick={() => handleSelectSession(session.id)} className="w-full text-left p-2 hover:bg-white/5 rounded text-xs text-zinc-400 truncate">
                                            {session.name}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#0F1115]">
                {messages.map((msg) => (
                    <MessageItem key={msg.id || msg.content} msg={msg} onDownload={handleDownload} />
                ))}
                {isGenerating && (
                    <div className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-[#1A1D21] px-4 py-3 rounded-2xl text-sm text-indigo-300">
                            {mode === 'IMAGE_GEN' ? 'Creando imágenes con IA...' : mode === 'VIDEO_GEN' ? 'Produciendo video...' : 'Pensando...'}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 bg-zinc-900/50 border-t border-white/5 backdrop-blur-md">
                <div className="relative flex items-end gap-2 bg-[#1A1D21] border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-all shadow-inner max-w-4xl mx-auto">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={
                            mode === 'IMAGE_GEN' ? 'Ej: "Genera 5 fotos de CarMatch en ciudad nocturna"...' :
                                mode === 'VIDEO_GEN' ? 'Describe el video que necesitas para TikTok/Reels...' :
                                    'Escribe un mensaje...'
                        }
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-zinc-500 min-h-[44px] max-h-[160px] py-3 px-2 resize-none custom-scrollbar"
                    />
                    <button onClick={handleSend} disabled={!prompt.trim() || isGenerating} className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition shrink-0 disabled:opacity-40" title="Enviar mensaje">
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* GENERATE BUTTON — only in IMAGE/VIDEO mode */}
                {mode !== 'CHAT' && messages.filter(m => m.role === 'user').length > 0 && !isGenerating && (
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={handleGenerate}
                            className={`group flex items-center gap-3 px-8 py-3 text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 font-black text-xs uppercase tracking-widest ${mode === 'IMAGE_GEN'
                                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-cyan-900/40'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-900/40'
                                }`}
                        >
                            {mode === 'IMAGE_GEN' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                            {mode === 'IMAGE_GEN' ? '✨ Generar Imágenes' : '🎬 Producir Video'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
