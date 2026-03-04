'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, Camera, Video, ChevronRight, LayoutGrid,
    Zap, Palette, PlayCircle, Star
} from 'lucide-react'
import ImageChat from '@/components/admin/ImageChat'

type PublicityView = 'HUB' | 'PHOTO_CHAT' | 'VIDEO_CHAT'

export default function PublicityTab() {
    const [viewMode, setViewMode] = useState<PublicityView>('HUB')

    if (viewMode === 'PHOTO_CHAT') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={() => setViewMode('HUB')}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Volver al Hub
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                        <Camera className="w-3 h-3" /> Estudio de Fotos Activo
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ImageChat />
                </div>
            </div>
        )
    }

    if (viewMode === 'VIDEO_CHAT') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={() => setViewMode('HUB')}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Volver al Hub
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                        <Video className="w-3 h-3" /> Estudio de Video Activo
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10">
                        <PlayCircle className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Próximamente: Video Studio AI</h2>
                    <p className="max-w-md text-zinc-500 font-bold text-sm leading-relaxed uppercase tracking-wider">
                        Estamos perfeccionando el motor de video para crear piezas virales automáticas.
                    </p>
                    <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left">
                            <Zap className="w-6 h-6 text-indigo-400 mb-4" />
                            <h4 className="text-xs font-black text-white uppercase mb-2">Reels Automáticos</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-normal">Generación de escenas dinámicas con música.</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left">
                            <Palette className="w-6 h-6 text-indigo-400 mb-4" />
                            <h4 className="text-xs font-black text-white uppercase mb-2">Edición Pro</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-normal">Control total sobre el color y ritmo via chat.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="relative overflow-hidden p-8 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-zinc-900/50 to-fuchsia-500/10 border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 blur-[100px] -ml-32 -mb-32 rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 rounded-full text-[9px] font-black text-primary-400 uppercase tracking-widest shadow-lg shadow-primary-500/10">
                                <Sparkles className="w-3 h-3 inline-block mr-1 mb-0.5" /> IA Creative Suite
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                            Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-fuchsia-400">Publicidad</span>
                        </h1>
                        <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest max-w-md">
                            Selecciona una herramienta especializada para potenciar tu marca con Inteligencia Artificial.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1 min-w-[100px]">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black text-white">PRO</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hub Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Studio Card */}
                <motion.button
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('PHOTO_CHAT')}
                    className="relative group h-[400px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-black to-black z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700"
                        alt="Photos"
                    />

                    <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:bg-violet-500 group-hover:rotate-12 transition-all duration-500">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 group-hover:translate-x-3 transition-transform">Estudio de Fotos <span className="block text-xl text-violet-400 not-italic">Creative Director</span></h3>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs group-hover:text-white transition-colors">
                                Genera packs de 8 redes sociales con captions virales y descarga HD instantánea.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-violet-400 font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                Entrar ahora <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </motion.button>

                {/* Video Studio Card */}
                <motion.button
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('VIDEO_CHAT')}
                    className="relative group h-[400px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-black to-black z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200"
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-70 transition-all duration-700"
                        alt="Video"
                    />

                    <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:-rotate-12 transition-all duration-500">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 group-hover:translate-x-3 transition-transform">Video Studio <span className="block text-xl text-indigo-400 not-italic">Motion Artist AI</span></h3>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs group-hover:text-white transition-colors">
                                Crea reels y videos dinámicos para tus campañas automotrices.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-widest opacity-40 group-hover:opacity-100 transition-all">
                                Próximamente <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </motion.button>
            </div>

            {/* Bottom Info */}
            <div className="flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Workflow Instantáneo</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-normal">
                            Sin esperas de aprobación. Crea, descarga y publica manualmente en segundos.
                        </p>
                    </div>
                </div>
                <div className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <LayoutGrid className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Ecosistema CarMatch</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-normal">
                            Todas tus herramientas creativas centralizadas en un solo hub de alto rendimiento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { AD_PLATFORMS as PLATFORMS } from '@/lib/admin/constants'

// Helper for downloading assets (Standalone)
const downloadAsset = async (url: string, filename: string) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = filename
        link.click()
        window.URL.revokeObjectURL(link.href)
    } catch (error) {
        console.error('Download failed:', error)
        window.open(url, '_blank')
    }
}

// Helper to safely parse campaign metadata (handles JSON strings and nested strings)
function parseMetadata(campaign: any): any {
    const raw = campaign.metadata as any;
    if (!raw) return {};
    let meta = typeof raw === 'string' ? raw : JSON.stringify(raw);
    try {
        meta = JSON.parse(meta);
    } catch {
        return {};
    }
    // Handle double‑stringified metadata
    if (typeof meta === 'string') {
        try {
            meta = JSON.parse(meta);
        } catch {
            return {};
        }
    }
    return meta || {};
}

function buildFallbackPlatformData(platformId: string, assets: any): any {
    const caption = assets.caption || assets.videoScript || '¡Descarga CarMatch, la app #1 de compra-venta de autos! 🚗🔥'
    const title = assets.internal_title || 'CarMatch - Tu Auto Ideal'

    const fallbacks: Record<string, any> = {
        meta_ads: {
            primary_text: caption,
            headline: title,
            description: 'Encuentra o vende tu auto de forma segura y rápida.',
            caption: caption
        },
        facebook_marketplace: {
            title: title,
            description: caption
        },
        google_ads: {
            headlines: [title, 'Compra-Venta de Autos', 'CarMatch México'],
            descriptions: ['Encuentra tu auto ideal en segundos.', 'La app #1 del mercado automotriz.']
        },
        tiktok_ads: {
            caption: caption,
            script_notes: assets.videoScript || 'Usa el video vertical generado por IA.'
        },
        youtube_shorts: {
            title: title,
            description: caption
        },
        twitter_x: {
            tweets: [caption, '¡Únete a CarMatch! 🚗💨 #CarMatch #Autos']
        },
        threads: {
            caption: caption
        },
        snapchat_ads: {
            headline: title,
            caption: '¡Desliza para tu próximo auto! 🚗'
        },
        kwai: {
            caption: `${caption} 🔥 #CarMatch #Autos #Kwai`
        },
        facebook_reels: {
            caption: `${caption} 🚗 Comenta y comparte! #CarMatch #FacebookReels`
        },
        pinterest: {
            description: `${title} — ${caption} Descúbrelo en carmatch.app 📌`
        },
        linkedin: {
            post: `CarMatch está revolucionando el mercado automotriz en LATAM. ${caption}\n\nDescúbrelo en carmatch.app #CarMatch #AutosLatam`
        }
    }
    return fallbacks[platformId] || { caption }
}

function CampaignAssetsModal({ isOpen, onClose, assets, campaignId, onOpenEditChat }: any) {
    const [selectedSize, setSelectedSize] = useState<'square' | 'vertical' | 'horizontal'>('square')
    const [copied, setCopied] = useState(false)

    if (!isOpen || !assets) return null

    const campaignTitle = assets.internal_title || assets.title || 'Campaña Creativa'
    const prompt = assets.imagePrompt || assets.prompt || ''

    // Use assets.images securely
    const images = assets.images || {}
    const currentImageUrl = images[selectedSize] || assets.imageUrl || ''

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const sizeLabels: Record<string, string> = {
        'square': 'Instagram / Feed',
        'vertical': 'TikTok / Reels / Stories',
        'horizontal': 'Google Ads / X / Meta Ads'
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#111114] w-full max-w-5xl max-h-[90vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
                {/* Left Side: Images & Prompt */}
                <div className="flex-1 p-8 border-r border-white/5 flex flex-col bg-zinc-900/30 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white tracking-tight">{campaignTitle}</h2>
                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                                {(['square', 'vertical', 'horizontal'] as const).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300 ${selectedSize === size
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                                            : 'text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{size}</span>
                                        <span className={`text-[8px] font-bold mt-0.5 opacity-60 ${selectedSize === size ? 'text-white' : 'text-zinc-600'}`}>
                                            {sizeLabels[size]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className={`relative bg-black rounded-2xl overflow-hidden mb-6 ${selectedSize === 'vertical' ? 'aspect-[9/16] max-h-96 mx-auto' : selectedSize === 'horizontal' ? 'aspect-[1200/628]' : 'aspect-square max-h-96 mx-auto'
                        }`}>
                        <img src={currentImageUrl} alt="Asset" className="w-full h-full object-cover" />
                        <button
                            onClick={() => downloadAsset(currentImageUrl, `asset-${selectedSize}.jpg`)}
                            className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/40 transition"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Prompt Box */}
                    <div className="mt-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-3 h-3" /> Creative Prompt
                            </span>
                            <button
                                onClick={handleCopyPrompt}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-zinc-400 font-mono italic leading-relaxed">
                                {prompt}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Platform Copies */}
                <div className="w-80 p-6 flex flex-col bg-black/20">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Plataformas ({Object.keys(assets.platforms || {}).length})</span>
                        <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {PLATFORMS.map(platform => {
                            const pData = assets.platforms?.[platform.id]
                            if (!pData) return null
                            return (
                                <PlatformMiniItem
                                    key={platform.id}
                                    platform={platform}
                                    data={pData}
                                />
                            )
                        })}
                    </div>

                    <div className="mt-6 flex gap-3">
                        {onOpenEditChat && (
                            <button
                                onClick={() => {
                                    onClose()
                                    onOpenEditChat()
                                }}
                                className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 shrink-0"
                                title="Editar toda la campaña con IA"
                            >
                                <Sparkles className="w-6 h-6" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition active:scale-95"
                        >
                            LISTO
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function PlatformMiniItem({ platform, data }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const fullCopy = data.caption || data.headline || ''
    const hashtags = data.hashtags || ''

    const handleCopy = () => {
        navigator.clipboard.writeText(`${fullCopy}\n${hashtags}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`p-4 rounded-2xl border transition ${isOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${platform.color} font-black`}>
                        {platform.icon}
                    </div>
                    <span className="text-xs font-black text-white">{platform.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="mt-4 space-y-3">
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                        {fullCopy}
                    </p>
                    {hashtags && (
                        <p className="text-[10px] text-violet-400 font-bold">
                            {hashtags}
                        </p>
                    )}
                    {data.audio_suggestion && (
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/10">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">🎵 Sugerencia de Audio</p>
                            <p className="text-[10px] text-blue-300 italic">{data.audio_suggestion}</p>
                        </div>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copiado' : 'Copiar Texto'}
                    </button>
                </div>
            )}
        </div>
    )
}


function PlatformAccordionItem({ platform, data, assets, isFallback, defaultOpen }: any) {
    const [isOpen, setIsOpen] = useState(defaultOpen || false)
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 2000)
    }

    return (
        <div className={`overflow-hidden transition-all duration-300 border ${isOpen ? 'bg-zinc-900/30 border-purple-500/30 shadow-lg shadow-purple-900/10' : 'bg-white/5 border-white/5 hover:border-white/10'} rounded-2xl`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform ${isOpen ? 'scale-110' : ''} ${isOpen ? 'bg-white text-black' : 'bg-white/10 text-zinc-400'}`}>
                        {platform.icon}
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-sm ${isOpen ? 'text-white' : 'text-zinc-300'}`}>{platform.label}</h3>
                            {isFallback && (
                                <span className="text-[9px] font-bold uppercase text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded">Genérico</span>
                            )}
                        </div>
                        {!isOpen && <p className="text-[10px] text-zinc-500">Toca para ver el copy</p>}
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-white/10 rotate-180' : 'hover:bg-white/5'}`}>
                    <ArrowRight className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-4 space-y-4">
                            {/* MEDIA ASSETS FOR THIS PLATFORM */}
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <ImagePlus className="w-3 h-3" /> Archivos Multimedia
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* VIDEO LOGIC: Meta, TikTok, Shorts, Snapchat — Solo si NO es imagen */}
                                    {assets.type !== 'image' && ['meta_ads', 'tiktok_ads', 'youtube_shorts', 'snapchat_ads'].includes(platform.id) && (
                                        <div className="col-span-2 sm:col-span-1">
                                            <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                                {assets.videoUrl && assets.videoUrl.startsWith('http') ? (
                                                    <>
                                                        <video src={assets.videoUrl} className="w-full h-full object-cover opacity-80" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <button
                                                                onClick={() => downloadAsset(assets.videoUrl, `${platform.id}-video.mp4`)}
                                                                className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-zinc-200 transition"
                                                            >
                                                                <Download className="w-3 h-3" /> Video
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (assets.videoUrl === 'PENDING...' || assets.videoPendingId) ? (
                                                    <div className="flex flex-col items-center justify-center relative w-full h-full bg-black">
                                                        {(assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...') && (
                                                            <img src={assets.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                                                        )}
                                                        <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                                                            <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                                                            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest leading-tight">Generando<br />Video...</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-zinc-600 font-bold">No hay video</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* SQUARE IMAGE: Meta, Marketplace, Google, Threads — Solo si NO es video */}
                                    {assets.type !== 'video' && ['meta_ads', 'facebook_marketplace', 'google_ads', 'threads'].includes(platform.id) && (
                                        <div className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                            {((assets.images?.square && assets.images.square.startsWith('http')) || (assets.imageUrl && assets.imageUrl.startsWith('http'))) ? (
                                                <>
                                                    <img src={assets.images?.square || assets.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => downloadAsset(assets.images?.square || assets.imageUrl, `${platform.id}-square.jpg`)}
                                                            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] text-white">1:1</div>
                                                </>
                                            ) : (assets.images?.square === 'PENDING...' || assets.imagePendingIds?.square || assets.imageUrl === 'PENDING...') ? (
                                                <div className="flex flex-col items-center justify-center relative w-full h-full bg-black">
                                                    <div className="flex flex-col items-center gap-2 p-2 text-center">
                                                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                                                        <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Generando...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-zinc-600 font-bold">No hay imagen</div>
                                            )}
                                        </div>
                                    )}

                                    {/* VERTICAL IMAGE (9:16): Meta Stories, Snapchat — Solo si NO es video */}
                                    {assets.type !== 'video' && ['meta_ads', 'snapchat_ads'].includes(platform.id) && (
                                        <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                            {(assets.images?.vertical?.startsWith('http') || (assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...')) ? (
                                                <>
                                                    <img src={assets.images?.vertical || assets.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => downloadAsset(assets.images?.vertical || assets.imageUrl, `${platform.id}-story.jpg`)}
                                                            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] text-white">9:16</div>
                                                </>
                                            ) : (assets.images?.vertical === 'PENDING...' || assets.imagePendingIds?.vertical) ? (
                                                <div className="flex flex-col items-center justify-center relative w-full h-full bg-black">
                                                    {(assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...') && (
                                                        <img src={assets.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                                                    )}
                                                    <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                                                        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                                                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Generando...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-zinc-600 font-bold">No hay Historia</div>
                                            )}
                                        </div>
                                    )}

                                    {/* PORTRAIT IMAGE (4:5): Meta Feed, LinkedIn — HIGH CONVERSION */}
                                    {assets.type !== 'video' && ['meta_ads', 'linkedin'].includes(platform.id) && (
                                        <div className="aspect-[4/5] rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                            {(assets.images?.portrait?.startsWith('http') || assets.images?.square?.startsWith('http') || (assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...')) ? (
                                                <>
                                                    <img src={assets.images?.portrait || assets.images?.square || assets.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => downloadAsset(assets.images?.portrait || assets.images?.square || assets.imageUrl, `${platform.id}-portrait.jpg`)}
                                                            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] text-white">
                                                        {assets.images?.portrait ? '4:5 (Portrait)' : '1:1 (Fallback)'}
                                                    </div>
                                                </>
                                            ) : (assets.images?.portrait === 'PENDING...' || assets.imagePendingIds?.portrait || assets.imagePendingIds?.square) ? (
                                                <div className="flex flex-col items-center justify-center relative w-full h-full bg-black">
                                                    <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                                                        <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />
                                                        <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest text-center">Generando<br />Portrait 4:5...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-zinc-600 font-bold">No hay Portrait</div>
                                            )}
                                        </div>
                                    )}

                                    {/* HORIZONTAL IMAGE: Google, X — Solo si NO es video */}
                                    {assets.type !== 'video' && ['google_ads', 'twitter_x'].includes(platform.id) && (
                                        <div className="col-span-2 sm:col-span-1 aspect-video rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                            {(assets.images?.horizontal?.startsWith('http') || assets.images?.square?.startsWith('http') || (assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...')) ? (
                                                <>
                                                    <img src={assets.images?.horizontal || assets.images?.square || assets.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => downloadAsset(assets.images?.horizontal || assets.images?.square || assets.imageUrl, `${platform.id}-landscape.jpg`)}
                                                            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] text-white">
                                                        {assets.images?.horizontal ? '16:9' : '1:1 (Fallback)'}
                                                    </div>
                                                </>
                                            ) : (assets.images?.horizontal === 'PENDING...' || assets.imagePendingIds?.horizontal || assets.imagePendingIds?.square) ? (
                                                <div className="flex flex-col items-center justify-center relative w-full h-full bg-black">
                                                    {(assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...') && (
                                                        <img src={assets.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                                                    )}
                                                    <div className="relative z-10 flex flex-col items-center gap-2 p-2 text-center">
                                                        <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
                                                        <span className="text-[9px] font-black uppercase text-green-400 tracking-widest">Generando...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-zinc-600 font-bold">No hay imagen</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GOOGLE ADS SPECIAL RENDER */}
                            {platform.id === 'google_ads' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Headlines (Títulos)</h4>
                                        <div className="space-y-2">
                                            {data.headlines?.map((h: string, i: number) => (
                                                <CopyableRow key={i} text={h} id={`gh-${i}`} onCopy={handleCopy} copiedKey={copiedKey} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Descriptions</h4>
                                        <div className="space-y-2">
                                            {data.descriptions?.map((d: string, i: number) => (
                                                <CopyableRow key={i} text={d} id={`gd-${i}`} onCopy={handleCopy} copiedKey={copiedKey} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* STANDARD PLATFORM RENDER */
                                <>
                                    {/* TITLES / HEADLINES */}
                                    {(data.title || data.headline) && (
                                        <CopyableBlock
                                            label="Título / Headline"
                                            content={data.title || data.headline}
                                            id={`${platform.id}-title`}
                                        />
                                    )}

                                    {/* PRIMARY TEXT / DESCRIPTION / TWEETS */}
                                    {data.primary_text && (
                                        <CopyableBlock label="Texto Principal (Primary Text)" content={data.primary_text} id={`${platform.id}-primary`} />
                                    )}
                                    {data.description && platform.id !== 'facebook_marketplace' && (
                                        <CopyableBlock label="Descripción" content={data.description} id={`${platform.id}-desc`} />
                                    )}
                                    {platform.id === 'facebook_marketplace' && data.description && (
                                        <CopyableBlock label="Descripción para Marketplace" content={data.description} id={`${platform.id}-desc`} isLong={true} />
                                    )}
                                    {data.tweets && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hilo de Tweets</label>
                                            {data.tweets.map((t: string, i: number) => (
                                                <CopyableRow key={i} text={t} id={`tweet-${i}`} onCopy={handleCopy} copiedKey={copiedKey} />
                                            ))}
                                        </div>
                                    )}
                                    {data.caption && (
                                        <CopyableBlock label="Caption / Pie de foto" content={data.caption} id={`${platform.id}-caption`} isLong={true} />
                                    )}
                                    {data.script_notes && (
                                        <CopyableBlock label="Notas Visuales" content={data.script_notes} id={`${platform.id}-notes`} />
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CopyableBlock({ label, content, id, isLong, truncate }: any) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{label}</label>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            </div>
            <div className={`bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 font-mono leading-relaxed relative overflow-hidden ${truncate ? 'max-h-24' : ''}`}>
                {content}
                {truncate && <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />}
            </div>
        </div>
    )
}

function CopyableRow({ text, id, onCopy, copiedKey }: any) {
    return (
        <div className="flex gap-2 items-center">
            <div className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 font-mono">{text}</div>
            <button
                onClick={() => onCopy(text, id)}
                className={`p-2 rounded-lg transition shrink-0 ${copiedKey === id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
                {copiedKey === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    )
}

// Sub-Components


function CampaignModal({ isOpen, onClose, campaign, onSuccess }: any) {
    if (!isOpen) return null
    const isEditing = !!campaign
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(event.currentTarget)

        try {
            if (isEditing) {
                const data: any = {}
                formData.forEach((value, key) => data[key] = value)
                data.socialMediaEnabled = formData.get('socialMediaEnabled') === 'on'

                // Fix: Cast dates to Date objects for Prisma
                if (data.startDate) data.startDate = new Date(data.startDate)
                if (data.endDate) data.endDate = new Date(data.endDate)

                await updatePublicityCampaign(campaign.id, data)
            } else {
                await createPublicityCampaign(null, formData)
            }
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error al guardar')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111114] w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isEditing ? 'Editar Campaña' : 'Nueva Campaña'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form id="campaign-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase">Título</label>
                            <input name="title" defaultValue={campaign?.title} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase">Cliente</label>
                            <input name="clientName" defaultValue={campaign?.clientName || ''} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase">Imagen URL</label>
                            <input name="imageUrl" defaultValue={campaign?.imageUrl} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase">Inicio</label>
                                <input type="date" name="startDate" defaultValue={campaign?.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : ''} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase">Fin</label>
                                <input type="date" name="endDate" defaultValue={campaign?.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : ''} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none" />
                            </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-white/5">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" name="socialMediaEnabled" defaultChecked={campaign?.socialMediaEnabled} className="w-4 h-4 rounded border-white/20 bg-black/20 text-primary-600 focus:ring-primary-500 focus:ring-offset-0" />
                                <span className="text-sm font-medium text-white">Activar Social Media</span>
                            </label>
                        </div>
                    </form>
                </div>
                <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
                    <button type="submit" form="campaign-form" disabled={isSubmitting} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-900/20 transition disabled:opacity-50">
                        {isSubmitting ? 'Guardando...' : 'Guardar Campaña'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function GalleryImageItem({ id, pId, onStatusUpdate, campaignId, index, clipStatus, onOpenEditChat, onCloseModal, onViewFullscreen }: { id: string, pId: string, onStatusUpdate?: () => void, campaignId?: string, index?: number, clipStatus?: string, onOpenEditChat?: () => void, onCloseModal?: () => void, onViewFullscreen?: (url: string, id: string) => void }) {
    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!pId) return;

        if (pId.startsWith('http')) {
            setStatus('success')
            setUrl(pId)
            return
        }

        if (pId.startsWith('DONE|')) {
            const rawUrl = pId.split('DONE|')[1]
            setStatus('success')
            setUrl(rawUrl)
            if (campaignId) saveAIAssetUrl(campaignId, id, rawUrl).catch(() => { })
            return
        }

        if (pId === 'PENDING...') {
            setStatus('pending')
            return
        }

        let isMounted = true
        const checkStatus = async () => {
            try {
                const res = await checkAIAssetStatus(pId)
                if (!isMounted) return

                if (res.status === 'succeeded' && res.url) {
                    const finalUrl = Array.isArray(res.url) ? res.url[0] : res.url
                    setUrl(finalUrl)
                    setStatus('success')
                    if (campaignId && finalUrl) {
                        try {
                            await saveAIAssetUrl(campaignId, id, finalUrl)
                        } catch (e) { /* silent fail on save */ }
                    }
                    onStatusUpdate?.()
                } else if (res.status === 'failed') {
                    setStatus('failed')
                } else {
                    setTimeout(checkStatus, 3000)
                }
            } catch (error) {
                console.error('Error checking asset status:', error)
                if (isMounted) setStatus('failed')
            }
        }

        checkStatus()
        return () => { isMounted = false }
    }, [pId, id, campaignId])

    if (status === 'success' && url) {
        return (
            <div className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black">
                <img src={url} alt={`Campaña ${index !== undefined ? index + 1 : ''}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    {onOpenEditChat && (
                        <button
                            onClick={() => {
                                if (onCloseModal) onCloseModal();
                                onOpenEditChat();
                            }}
                            className="p-2 bg-purple-500/80 text-white rounded-lg hover:bg-purple-600 backdrop-blur-md transition shadow-lg shadow-purple-900/50"
                            title="Editar con IA"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onViewFullscreen ? onViewFullscreen(url, id) : window.open(url, '_blank')}
                        className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/40 backdrop-blur-md transition"
                        title="Ver completa"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => downloadAsset(url, `campaña-${id}.jpg`)}
                        className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                        title="Descargar"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
                {index !== undefined && (
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-md">
                        {index + 1}
                    </div>
                )}
            </div>
        )
    }

    if (status === 'failed' || clipStatus === 'failed' || clipStatus === 'error') {
        return (
            <div className="aspect-square rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center p-2 text-center">
                <XCircle className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-[8px] font-bold text-red-400 uppercase">Error</span>
            </div>
        )
    }

    return (
        <div className="aspect-square rounded-xl border border-white/5 bg-white/5 flex flex-col items-center justify-center p-2 text-center animate-pulse">
            {clipStatus === 'pending' ? (
                <>
                    <Clock className="w-5 h-5 text-zinc-500 mb-1" />
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">En cola</span>
                </>
            ) : (
                <>
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mb-1" />
                    <span className="text-[8px] font-bold text-blue-400 uppercase">Generando...</span>
                </>
            )}
        </div>
    )
}

function CampaignGallery({ assets, campaignId, onOpenEditChat, onViewFullscreen }: { assets: any, campaignId?: string, onOpenEditChat?: () => void, onViewFullscreen?: (url: string, id: string) => void }) {
    const activeClips: any[] = [] // Image production context removed

    // Look for all img_X in pendingIds or assets.images
    const pendingIds = assets.imagePendingIds || {}
    const finalUrls = assets.images || {}

    // Combine all unique keys that look like img_X
    const keys = Array.from(new Set([
        ...Object.keys(pendingIds).filter(k => k.startsWith('img_')),
        ...Object.keys(finalUrls).filter(k => k.startsWith('img_'))
    ])).sort()

    if (keys.length === 0) return null

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1 px-1">
                <ImageIcon className="w-3 h-3" /> Galería de la Campaña ({keys.length} fotos)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {keys.map((key, index) => {
                    const liveClip = activeClips.find(c => c.imageId === key)
                    return (
                        <GalleryImageItem
                            key={key}
                            id={key}
                            pId={finalUrls[key] || pendingIds[key]}
                            campaignId={campaignId}
                            index={index}
                            clipStatus={liveClip?.status}
                            onOpenEditChat={onOpenEditChat}
                            onCloseModal={() => window.dispatchEvent(new CustomEvent('close-campaign-assets'))}
                            onViewFullscreen={onViewFullscreen}
                        />
                    )
                })}
            </div>
        </div>
    )
}
