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


// 🛡️ FIN DE COMPONENTE - LIMPIEZA COMPLETADA
{ copiedKey === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" /> }
            </button >
        </div >
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
