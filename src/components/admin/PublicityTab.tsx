// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Megaphone, Plus, Search, Filter, MoreVertical,
    Calendar, Globe, Share2, Trash2, Edit, CheckCircle2,
    XCircle, Clock, ExternalLink, Image as ImageIcon, Sparkles, RefreshCw, Zap
} from 'lucide-react'
import {
    getPublicityCampaigns,
    createPublicityCampaign,
    updatePublicityCampaign,
    deletePublicityCampaign,
    togglePublicityStatus,
    manualTriggerSocialPost
} from '@/app/admin/actions/publicity-actions'
import { generateSocialCaption, generateImagePrompt, generateVideoScript, suggestCampaignFromInventory } from '@/app/admin/actions/ai-content-actions'
import SocialQueue from '@/components/admin/SocialQueue'

interface PublicityCampaign {
    id: string
    title: string
    clientName: string | null
    imageUrl: string
    targetUrl: string | null
    startDate: Date
    endDate: Date
    isActive: boolean
    impressionCount: number
    clickCount: number
    socialMediaEnabled: boolean
    lastSocialPost: Date | null
    postingFrequencyHours: number
}

export default function PublicityTab() {
    const [campaigns, setCampaigns] = useState<PublicityCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showAIModal, setShowAIModal] = useState(false)
    const [viewMode, setViewMode] = useState<'STUDIO' | 'QUEUE'>('QUEUE')
    const [selectedCampaign, setSelectedCampaign] = useState<PublicityCampaign | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        setLoading(true)
        const res = await getPublicityCampaigns()
        if (res.success && res.data) {
            setCampaigns(res.data)
        }
        setLoading(false)
    }

    const handleCreate = () => {
        setSelectedCampaign(null)
        setShowModal(true)
    }

    const handleEdit = (campaign: PublicityCampaign) => {
        setSelectedCampaign(campaign)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta campaña?')) {
            await deletePublicityCampaign(id)
            fetchCampaigns()
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        await togglePublicityStatus(id, currentStatus)
        fetchCampaigns()
    }

    const handleManualPost = async (id: string) => {
        const res = await manualTriggerSocialPost(id)
        if (res.success) {
            alert('Publicado exitosamente (Simulación)')
            fetchCampaigns()
        } else {
            alert('Error al publicar')
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5 shrink-0">
                        <button
                            onClick={() => setViewMode('STUDIO')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${viewMode === 'STUDIO' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-white/40 hover:text-white'}`}
                        >
                            ✨ AI Studio
                        </button>
                        <button
                            onClick={() => setViewMode('QUEUE')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${viewMode === 'QUEUE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-white/40 hover:text-white'}`}
                        >
                            🕒 Drafts
                        </button>
                    </div>
                    {/* Botón Crear Campaña en Header Móvil */}
                    <button
                        onClick={handleCreate}
                        className="md:hidden p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-900/20 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {viewMode === 'STUDIO' && (
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="hidden md:flex px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all items-center gap-2"
                        >
                            <Zap className="w-3 h-3" />
                            AI Gen
                        </button>
                    )}
                    <button
                        onClick={handleCreate}
                        className="hidden md:flex px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-primary-900/20 items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Campaña
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-3xl overflow-hidden relative backdrop-blur-sm">
                {viewMode === 'QUEUE' ? (
                    <SocialQueue />
                ) : (
                    <>
                        {/* Search Bar & Filters */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Buscar campaña..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500 text-white"
                                />
                            </div>
                            <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-primary-500 transition text-text-secondary">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Campaign List - Responsive Layout */}
                        {loading ? (
                            <div className="p-12 text-center text-text-secondary animate-pulse">Cargando campañas...</div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-12 text-center text-text-secondary flex flex-col items-center">
                                <Megaphone className="w-12 h-12 mb-4 opacity-20" />
                                <p>No hay campañas activas</p>
                                <button onClick={handleCreate} className="mt-4 text-primary-400 font-bold text-sm">Crear la primera</button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View (Hidden on Mobile) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Campaña</th>
                                                <th className="px-6 py-4 text-left">Estado</th>
                                                <th className="px-6 py-4 text-left">Duración</th>
                                                <th className="px-6 py-4 text-left">Redes Sociales</th>
                                                <th className="px-6 py-4 text-left">Rendimiento</th>
                                                <th className="px-6 py-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {campaigns.map(campaign => (
                                                <tr key={campaign.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/10 relative">
                                                                <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-white">{campaign.title}</p>
                                                                <p className="text-xs text-text-secondary">{campaign.clientName || 'Interno'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleToggleStatus(campaign.id, campaign.isActive)}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${campaign.isActive
                                                                ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                                                                : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                                                }`}
                                                        >
                                                            {campaign.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            <span className="text-[10px] font-black uppercase">{campaign.isActive ? 'Activa' : 'Pausada'}</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1 text-xs text-text-secondary">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-text-secondary">
                                                                    Redes Sociales
                                                                </span>
                                                            </div>
                                                            {campaign.socialMediaEnabled && (
                                                                <div className="text-[10px] text-text-secondary pl-4">
                                                                    Ult: {campaign.lastSocialPost
                                                                        ? new Date(campaign.lastSocialPost).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                        : 'Pendiente'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-4">
                                                            <div className="text-center">
                                                                <p className="text-xs font-bold text-white">{campaign.impressionCount}</p>
                                                                <p className="text-[9px] text-text-secondary uppercase">Vistas</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs font-bold text-primary-400">{campaign.clickCount}</p>
                                                                <p className="text-[9px] text-text-secondary uppercase">Clics</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">

                                                            <button
                                                                onClick={() => handleEdit(campaign)}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-white transition"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(campaign.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View (Visible on Mobile) */}
                                <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                                    {campaigns.map(campaign => (
                                        <div key={campaign.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                                            {/* Header: Image & Title */}
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-black overflow-hidden border border-white/10 shrink-0">
                                                    <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white truncate">{campaign.title}</h3>
                                                    <p className="text-xs text-text-secondary mb-2">{campaign.clientName || 'Interno'}</p>
                                                    <button
                                                        onClick={() => handleToggleStatus(campaign.id, campaign.isActive)}
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${campaign.isActive
                                                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                            }`}
                                                    >
                                                        {campaign.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        <span className="text-[10px] font-black uppercase">{campaign.isActive ? 'Activa' : 'Pausada'}</span>
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => handleEdit(campaign)}
                                                        className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-2 bg-white/5 rounded-xl p-3">
                                                <div className="text-center border-r border-white/5">
                                                    <p className="text-lg font-black text-white">{campaign.impressionCount}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase tracking-wider">Vistas</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-primary-400">{campaign.clickCount}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase tracking-wider">Clics</p>
                                                </div>
                                            </div>

                                            {/* Footer: Date & Social Actions */}
                                            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {campaign.socialMediaEnabled && (
                                                        <button
                                                            onClick={() => handleManualPost(campaign.id)}
                                                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition flex items-center gap-2"
                                                        >
                                                            <Share2 className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold">Publicar</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(campaign.id)}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )
                        }
                    </>
                )
                }
            </div>
        </div>
    )
}

function AIStudioModal({ isOpen, onClose }: any) {
    const [topic, setTopic] = useState("")
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text')
    const [generatedContent, setGeneratedContent] = useState("")
    const [loading, setLoading] = useState(false)
    const [autoPilotData, setAutoPilotData] = useState<any>(null)

    // Country / Market Target
    const [targetCountry, setTargetCountry] = useState("MX")

    // Text Options
    const [tone, setTone] = useState("professional")

    // Image Options
    const [style, setStyle] = useState("realistic")

    // Video Options
    const [duration, setDuration] = useState("15 seconds")
    const [videoStyle, setVideoStyle] = useState("showcase")

    const handleGenerate = async () => {
        if (!topic) return
        setLoading(true)
        setGeneratedContent("")

        try {
            let res;
            if (activeTab === 'text') {
                res = await generateSocialCaption(topic, tone, 'general', targetCountry)
            } else if (activeTab === 'image') {
                res = await generateImagePrompt(topic, style, targetCountry)
            } else {
                res = await generateVideoScript(topic, duration, targetCountry, videoStyle)
            }

            if (res.success && res.content) {
                setGeneratedContent(res.content || "")
            } else {
                setGeneratedContent(res.error || "Error al generar contenido.")
            }
        } catch (e) {
            console.error(e)
            setGeneratedContent("Error de conexión.")
        } finally {
            setLoading(false)
        }
    }

    const handleAutoPilot = async () => {
        setLoading(true)
        setGeneratedContent("")
        setAutoPilotData(null)
        try {
            const res = await suggestCampaignFromInventory(targetCountry)
            if (res.success) {
                setAutoPilotData(res)
                setGeneratedContent(res.campaignData.caption)
                setTopic(`Promoción Automática de ${res.vehicle?.title || 'Vehículo'}`)
            } else {
                setGeneratedContent(res.error || "No se pudo generar campaña automática.")
            }
        } catch (e) {
            setGeneratedContent("Error en piloto automático.")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCampaign = () => {
        // Logic to close this modal and open the campaign modal with pre-filled data
        // For now, valid copy to clipboard
        navigator.clipboard.writeText(generatedContent)
        alert("Contenido copiado al portapapeles. Ahora puedes crear la campaña.")
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111114] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-900/10 to-transparent">
                    <h3 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" /> AI Content Studio
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full ml-2">Global Agent</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Controls Sidebar */}
                    <div className="w-full md:w-80 p-6 border-r border-white/5 bg-black/20 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">

                            {/* Country Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Mercado Objetivo
                                </label>
                                <select
                                    value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none font-bold"
                                >
                                    <option value="MX">🇲🇽 México</option>
                                    <option value="CO">🇨🇴 Colombia</option>
                                    <option value="US">🇺🇸 USA (Latino)</option>
                                    <option value="ES">🇪🇸 España</option>
                                    <option value="AR">🇦🇷 Argentina</option>
                                </select>
                            </div>

                            {/* Auto Pilot Section */}
                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-4 rounded-2xl border border-white/10">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-yellow-400" /> Piloto Automático
                                </h4>
                                <p className="text-[10px] text-text-secondary mb-3">Genera una campaña viral para {targetCountry === 'MX' ? 'México' : targetCountry} automáticamente.</p>
                                <button
                                    onClick={handleAutoPilot}
                                    disabled={loading}
                                    className="w-full py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-lg font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    ¡Sorpréndeme!
                                </button>
                            </div>

                            <hr className="border-white/5" />

                            <div>
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Creación Manual</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'text', icon: Megaphone, label: 'Post' },
                                        { id: 'image', icon: ImageIcon, label: 'Imagen' },
                                        { id: 'video', icon: Share2, label: 'Video' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setActiveTab(type.id as any)
                                                setGeneratedContent(
                                                    autoPilotData
                                                        ? (type.id === 'text' ? autoPilotData.campaignData.caption
                                                            : type.id === 'image' ? autoPilotData.campaignData.imagePrompt
                                                                : autoPilotData.campaignData.videoScript)
                                                        : ""
                                                )
                                            }}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${activeTab === type.id
                                                ? 'bg-purple-600 border-purple-500 text-white'
                                                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                                                }`}
                                        >
                                            <type.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tema / Auto / Producto</label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ej. Venta de Ford Mustang 2024..."
                                    className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none resize-none"
                                />
                            </div>

                            {/* Dynamic Options based on Tab */}
                            {activeTab === 'text' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tono</label>
                                    <select
                                        value={tone} onChange={(e) => setTone(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="professional">Profesional</option>
                                        <option value="funny">Divertido / Viral</option>
                                        <option value="urgent">Urgente / Oferta</option>
                                        <option value="luxury">Lujo / Elegante</option>
                                    </select>
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Estilo Visual</label>
                                    <select
                                        value={style} onChange={(e) => setStyle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="realistic">Fotorealista (8k)</option>
                                        <option value="studio">Estudio Automotriz</option>
                                        <option value="cyberpunk">Cyberpunk / Neón</option>
                                        <option value="minimalist">Minimalista</option>
                                    </select>
                                </div>
                            )}

                            {activeTab === 'video' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Estilo de Video</label>
                                    <select
                                        value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none mb-2"
                                    >
                                        <option value="showcase">🔥 Showcase (Cinemático)</option>
                                        <option value="funny">🎭 Sketch Gracioso</option>
                                        <option value="emotional">🥺 Reflexivo / Emocional</option>
                                        <option value="educational">💡 Consejo / Tutorial</option>
                                        <option value="versus">🆚 Versus / Batalla</option>
                                        <option value="myths">🕵️‍♂️ Desmintiendo Mitos</option>
                                        <option value="trivia">❓ Trivia / Adivinanza</option>
                                        <option value="safety">🆘 Seguridad Vial (SOS)</option>
                                        <option value="security">🛡️ Anti-Estafa / Compra Segura</option>
                                        <option value="success">🤝 Historia de Éxito</option>
                                        <option value="dreams">🤩 Aspiracional / Sueños</option>
                                        <option value="future">🔮 Futuro (Concepto)</option>
                                    </select>

                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Duración</label>
                                    <select
                                        value={duration} onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="15 seconds">15 Segundos (Stories)</option>
                                        <option value="30 seconds">30 Segundos (Reels)</option>
                                        <option value="60 seconds">1 Minuto (TikTok)</option>
                                    </select>
                                </div>
                            )}

                            {/* Generate Button (only show if not autopilot data or if topic is manually entered) */}
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !topic}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                Generar con IA
                            </button>
                        </div>
                    </div>

                    {/* Content Display Area */}
                    <div className="flex-1 bg-black/40 p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Contenido Generado</h4>
                            {generatedContent && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedContent)
                                            alert("Copiado al portapapeles")
                                        }}
                                        className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
                                    >
                                        <Share2 className="w-3 h-3" /> Copiar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-6 overflow-y-auto whitespace-pre-wrap text-sm text-text-secondary font-mono leading-relaxed custom-scrollbar">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                                    <p className="text-xs uppercase tracking-widest animate-pulse">Creando contenido viral para {targetCountry}...</p>
                                </div>
                            ) : generatedContent ? (
                                generatedContent
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                                    <Sparkles className="w-12 h-12" />
                                    <p>Selecciona una opción o usa el piloto automático para comenzar.</p>
                                </div>
                            )}
                        </div>

                        {generatedContent && (
                            <div className="pt-4">
                                <button
                                    onClick={handleCreateCampaign}
                                    className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear Campaña con este Contenido
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function CampaignModal({ isOpen, onClose, campaign, onSuccess }: any) {
    const isEditing = !!campaign

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        // Handle logic via server actions
        let res;
        if (isEditing) {
            // Convert formData to object for update
            const data: any = {}
            formData.forEach((value, key) => data[key] = value)
            data.socialMediaEnabled = formData.get('socialMediaEnabled') === 'on'
            res = await updatePublicityCampaign(campaign.id, data)
        } else {
            res = await createPublicityCampaign(null, formData)
        }

        if (res.success) {
            onSuccess()
        } else {
            alert(res.error)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111114] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        {isEditing ? 'Editar Campaña' : 'Nueva Campaña Publicitaria'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Título Campaña</label>
                        <input name="title" required defaultValue={campaign?.title} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" placeholder="Ej. Promoción Verano 2026" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Cliente</label>
                            <input name="clientName" defaultValue={campaign?.clientName} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" placeholder="Opcional" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">URL Destino</label>
                            <input name="targetUrl" defaultValue={campaign?.targetUrl} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" placeholder="https://..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">URL Imagen / Banner</label>
                        <div className="flex gap-2">
                            <input name="imageUrl" required defaultValue={campaign?.imageUrl} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" placeholder="https://..." />
                            <button type="button" className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10">
                                <ImageIcon className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Inicio</label>
                            <input type="date" name="startDate" required defaultValue={campaign?.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : ''} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Fin</label>
                            <input type="date" name="endDate" required defaultValue={campaign?.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : ''} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 outline-none" />
                        </div>
                    </div>



                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-primary-900/20">
                            {isEditing ? 'Guardar Cambios' : 'Lanzar Campaña'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
