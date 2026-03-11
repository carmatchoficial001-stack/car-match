'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Sparkles, Camera, Video, ChevronRight, LayoutGrid, 
    Zap, Palette, PlayCircle, Star, History, MessageSquare, 
    Trash2, Megaphone, Check, Copy, RefreshCw, X 
} from 'lucide-react'
import ImageChat from '@/components/admin/ImageChat'
import { getCampaigns } from '@/app/admin/actions/image-chat-actions'
import { getStudioConversations, deleteStudioConversation } from '@/app/admin/actions/studio-history-actions'

type PublicityView = 'HUB' | 'PHOTO_CHAT' | 'VIDEO_CHAT' | 'CAMPAIGNS'
type CampaignSubType = 'PUBLISHED' | 'DRAFTS'

export default function PublicityTab() {
    const [viewMode, setViewMode] = useState<PublicityView>('HUB')
    const [subView, setSubView] = useState<CampaignSubType>('PUBLISHED')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [drafts, setDrafts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined)

    // Load data when entering CAMPAIGNS or HUB
    useEffect(() => {
        if (viewMode === 'CAMPAIGNS' || viewMode === 'HUB') {
            loadAllData()
        }
    }, [viewMode])

    async function loadAllData() {
        setLoading(true)
        try {
            const [campsRes, draftsRes] = await Promise.all([
                getCampaigns(),
                getStudioConversations()
            ])
            if (campsRes.success) setCampaigns(campsRes.campaigns)
            if (draftsRes.success) setDrafts(draftsRes.conversations)
        } catch (error) {
            console.error("Error loading publicity data:", error)
        }
        setLoading(false)
    }

    const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('¿Eliminar este borrador?')) return
        const res = await deleteStudioConversation(id)
        if (res.success) {
            setDrafts(prev => prev.filter(d => d.id !== id))
        }
    }

    // --- RENDERERS ---

    if (viewMode === 'PHOTO_CHAT') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={() => {
                            setViewMode('CAMPAIGNS')
                            setSubView('DRAFTS')
                            setActiveDraftId(undefined)
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Volver al Historial
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                        <Camera className="w-3 h-3" /> Estudio de Fotos AI
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ImageChat initialConversationId={activeDraftId} />
                </div>
            </div>
        )
    }

    if (viewMode === 'CAMPAIGNS') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500 bg-black/20">
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('HUB')}
                            className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Hub
                        </button>
                        <div className="h-4 w-px bg-white/10 hidden md:block" />
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                            <LayoutGrid className="w-3 h-3" /> Historial de Campañas
                        </div>
                    </div>

                    {/* Sub-view Toggle */}
                    <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10 self-center">
                        <button
                            onClick={() => setSubView('PUBLISHED')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                subView === 'PUBLISHED' 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            Publicadas
                        </button>
                        <button
                            onClick={() => setSubView('DRAFTS')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                subView === 'DRAFTS' 
                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            Borradores
                        </button>
                    </div>

                    <button 
                        onClick={loadAllData} 
                        className="hidden md:flex p-2 text-zinc-500 hover:text-white active:rotate-180 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {subView === 'PUBLISHED' ? (
                        campaigns.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 grayscale opacity-40">
                                <Megaphone className="w-16 h-16 text-zinc-600 mb-6" />
                                <h3 className="text-xl font-black text-zinc-400 uppercase italic">No hay campañas activas</h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase mt-2 tracking-widest">Inicia una "Campaña Automática" en el Estudio.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                                {campaigns.map((camp) => (
                                    <div key={camp.id} className="bg-[#111114] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-emerald-500/30 transition-all shadow-2xl relative">
                                        <div className="aspect-[16/9] bg-black relative overflow-hidden">
                                            {camp.posts?.[0]?.imageUrl ? (
                                                <img src={camp.posts[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" alt={camp.title} />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                    <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Generando Visuales...</span>
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
                                                {new Date(camp.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">{camp.title}</h3>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(camp.posts?.[0]?.content || '');
                                                        alert('¡Texto Viral Copiado!');
                                                    }}
                                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors shrink-0"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                    <Sparkles className="w-3 h-3 text-emerald-500" /> Descripción Viral
                                                </p>
                                                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed line-clamp-4 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                                                    {camp.posts?.[0]?.content}
                                                </p>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                                {camp.posts?.map((p: any) => (
                                                    <div key={p.id} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                        <span className="text-[8px] font-black text-emerald-400">{p.platform}</span>
                                                        {p.imageUrl && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-95">
                                                Ver Detalles del Pack
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* DRAFTS VIEW */
                        drafts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 grayscale opacity-40">
                                <History className="w-16 h-16 text-zinc-600 mb-6" />
                                <h3 className="text-xl font-black text-zinc-400 uppercase italic">Historial Vacío</h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase mt-2 tracking-widest">Tus conversaciones aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                {drafts.map((draft) => (
                                    <div 
                                        key={draft.id}
                                        className="group bg-[#111114] border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between hover:border-violet-500/30 transition-all shadow-xl hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl -mr-16 -mt-16" />
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/10">
                                                    <MessageSquare className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-white uppercase truncate">{draft.title || "Nueva Idea"}</h4>
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                                        {new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteDraft(e, draft.id)}
                                                className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                setActiveDraftId(draft.id)
                                                setViewMode('PHOTO_CHAT')
                                            }}
                                            className="w-full py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[10px] font-black text-violet-400 uppercase tracking-widest group-hover:bg-violet-500 group-hover:text-white transition-all active:scale-95"
                                        >
                                            Continuar Edición
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
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
                        <Video className="w-3 h-3" /> Estudio de Video AI
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
        <div className="h-full flex flex-col p-4 md:p-8 space-y-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
            {/* Main Hub Section */}
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                        Centro de <span className="text-emerald-500">Publicidad</span>
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-500 font-bold uppercase tracking-[0.3em] mt-4">Ecosistema Creativo CarMatch AI</p>
                </div>

                {/* Historial Card - Consolidado */}
                <motion.button
                    whileHover={{ scale: 1.01, y: -4 }}
                    onClick={() => setViewMode('CAMPAIGNS')}
                    className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-[#111114] to-black border border-white/10 p-8 rounded-[3rem] flex items-center justify-between group shadow-2xl transition-all"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center gap-8 text-left">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-emerald-500/10">
                            <LayoutGrid className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Historias de Campañas</h3>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">Gestión de Publicadas y Borradores</p>
                            <div className="flex gap-4 mt-4">
                                <div className="text-center">
                                    <div className="text-xs font-black text-white">{campaigns.length}</div>
                                    <div className="text-[7px] text-zinc-500 tracking-widest uppercase">Packs</div>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div className="text-center">
                                    <div className="text-xs font-black text-white">{drafts.length}</div>
                                    <div className="text-[7px] text-zinc-500 tracking-widest uppercase">Ideas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="relative z-10 w-10 h-10 text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-3 transition-all" />
                </motion.button>

                {/* Studios Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photo Studio */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => {
                            setActiveDraftId(undefined)
                            setViewMode('PHOTO_CHAT')
                        }}
                        className="bg-[#111114] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-start gap-6 group relative overflow-hidden shadow-xl"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-violet-600/10 transition-colors" />
                        <div className="w-16 h-16 rounded-[1.5rem] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:rotate-6 transition-transform">
                            <Camera className="w-8 h-8 text-violet-400" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Estudio de Imágenes</h4>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 leading-relaxed">Generación de carruseles, memes y contenido viral 9:16.</p>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                            <div className="w-full h-full bg-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                        </div>
                    </motion.button>

                    {/* Video Studio */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => setViewMode('VIDEO_CHAT')}
                        className="bg-[#111114] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-start gap-6 group relative overflow-hidden shadow-xl opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all border-dashed"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 blur-[80px] -mr-20 -mt-20" />
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Video className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Estudio de Video</h4>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 leading-relaxed">Edición dinámica y piezas de video con IA (Próximamente).</p>
                        </div>
                        <div className="bg-indigo-500/20 px-3 py-1 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-widest absolute top-8 right-8">Beta</div>
                    </motion.button>
                </div>
            </div>
        </div>
    )
}
