'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Sparkles, Camera, Video, ChevronRight, LayoutGrid,
    Zap, Palette, PlayCircle, Star
} from 'lucide-react'
import ImageChat from '@/components/admin/ImageChat'

type PublicityView = 'HUB' | 'PHOTO_CHAT' | 'VIDEO_CHAT' | 'CAMPAIGNS'

import { getCampaigns } from '@/app/admin/actions/image-chat-actions'
import { useEffect } from 'react'

export default function PublicityTab() {
    const [viewMode, setViewMode] = useState<PublicityView>('HUB')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (viewMode === 'CAMPAIGNS') {
            loadCampaigns()
        }
    }, [viewMode])

    async function loadCampaigns() {
        setLoading(true)
        const res = await getCampaigns()
        if (res.success) setCampaigns(res.campaigns)
        setLoading(false)
    }

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

    if (viewMode === 'CAMPAIGNS') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500 bg-black/20">
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
                    <button
                        onClick={() => setViewMode('HUB')}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Volver al Hub
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                        <LayoutGrid className="w-3 h-3" /> Galería de Campañas IA
                    </div>
                    <button onClick={loadCampaigns} className="p-2 text-zinc-500 hover:text-white active:rotate-180 transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {campaigns.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <Megaphone className="w-12 h-12 text-zinc-800 mb-4" />
                            <h3 className="text-xl font-black text-zinc-600 uppercase italic">No hay campañas activas</h3>
                            <p className="text-xs text-zinc-700 font-bold uppercase mt-2">Inicia una "Campaña Automática" en el Estudio de Fotos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campaigns.map((camp: any) => (
                                <div key={camp.id} className="bg-[#111114] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-emerald-500/30 transition-all shadow-2xl">
                                    <div className="aspect-[16/9] bg-black relative overflow-hidden">
                                        {camp.posts?.[0]?.imageUrl ? (
                                            <img src={camp.posts[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={camp.title} />
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
                                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">{camp.title}</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider line-clamp-3">{camp.posts?.[0]?.content}</p>
                                        
                                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                            {camp.posts?.map((p: any) => (
                                                <div key={p.id} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                    <span className="text-[8px] font-black text-emerald-400">{p.platform}</span>
                                                    {p.imageUrl && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95">
                                            Ver Detalles del Pack
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
            {/* Hub Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => setViewMode('CAMPAIGNS')}
                    className="md:col-span-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 p-6 rounded-[2.5rem] flex items-center justify-between group shadow-2xl shadow-emerald-500/10"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <LayoutGrid className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Historial de Campañas</h3>
                            <p className="text-[10px] text-emerald-400/70 font-black uppercase tracking-[0.2em]">Gestiona tus activos virales generados</p>
                        </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-emerald-500 group-hover:translate-x-2 transition-transform" />
                </motion.button>
            </div>

            {/* Hub Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Image Studio Card */}
                <motion.button
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('PHOTO_CHAT')}
                    className="relative group h-[450px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all"
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
                                Genera packs de redes sociales con IA y descarga HD instantánea.
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
                    className="relative group h-[450px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all"
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
        </div>
    )

}
