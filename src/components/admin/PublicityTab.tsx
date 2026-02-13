// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Megaphone, Plus, Search, Filter, MoreVertical,
    Calendar, Globe, Share2, Trash2, Edit, CheckCircle2,
    XCircle, Clock, ExternalLink, Image as ImageIcon, Sparkles, RefreshCw, Zap,
    Bot, User, Download, ImagePlus, Send, Save, X
} from 'lucide-react'
import {
    getPublicityCampaigns,
    createPublicityCampaign,
    updatePublicityCampaign,
    deletePublicityCampaign,
    togglePublicityStatus,
    manualTriggerSocialPost
} from '@/app/admin/actions/publicity-actions'
import {
    generateSocialCaption, generateImagePrompt, generateVideoScript, suggestCampaignFromInventory,
    chatWithPublicityAgent
} from '@/app/admin/actions/ai-content-actions'
import AIStudio from '@/components/admin/AIStudio'

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
    copywriting?: string
    priority?: number
    budget?: number
    displayPriority?: number
    socialPlatforms?: string[]
    interests?: string[]
    locations?: string[]
    targetAudience?: string
    redirectUrl?: string
}

export default function PublicityTab() {
    const [campaigns, setCampaigns] = useState<PublicityCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [viewMode, setViewMode] = useState<'CAMPAIGNS' | 'AI_STUDIO' | 'QUEUE'>('CAMPAIGNS')
    const [selectedCampaign, setSelectedCampaign] = useState<PublicityCampaign | null>(null)

    // Assets Generation State
    const [generatedAssets, setGeneratedAssets] = useState<any>(null)
    const [showAssetsModal, setShowAssetsModal] = useState(false)

    useEffect(() => {
        const handleOpenAssets = (e: any) => {
            setGeneratedAssets(e.detail)
            setShowAssetsModal(true)
            // Switch to CAMPAIGNS view if needed, but the modal overlays everything so it's fine
        }
        window.addEventListener('open-campaign-assets', handleOpenAssets)
        return () => window.removeEventListener('open-campaign-assets', handleOpenAssets)
    }, [])

    useEffect(() => {
        if (viewMode === 'CAMPAIGNS') {
            fetchCampaigns()
        }
    }, [viewMode])

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
                            onClick={() => setViewMode('CAMPAIGNS')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${viewMode === 'CAMPAIGNS' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-white/40 hover:text-white'}`}
                        >
                            <Megaphone className="w-4 h-4" />
                            Campañas
                        </button>
                        <button
                            onClick={() => setViewMode('AI_STUDIO')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${viewMode === 'AI_STUDIO' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-white/40 hover:text-white'}`}
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Studio
                        </button>
                        <button
                            onClick={() => setViewMode('QUEUE')}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${viewMode === 'QUEUE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-white/40 hover:text-white'}`}
                        >
                            <Clock className="w-4 h-4" />
                            Borradores
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="flex px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs transition shadow-lg border border-white/10 items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Nueva Manual</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-3xl overflow-hidden relative backdrop-blur-sm flex flex-col">
                {viewMode === 'QUEUE' ? (
                    <SocialQueue />
                ) : viewMode === 'AI_STUDIO' ? (
                    <AIStudio />
                ) : (
                    <>
                        {/* Search Bar & Filters */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-4 shrink-0">
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

                        {/* Campaign List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
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
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[#0f172a] text-[10px] font-black uppercase tracking-widest text-text-secondary sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-left">Campaña</th>
                                                    <th className="px-6 py-4 text-left">Estado</th>
                                                    <th className="px-6 py-4 text-left">Estadísticas</th>
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
                                                            <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                                                                <div className="flex items-center gap-1" title="Impresiones">
                                                                    <Globe className="w-3 h-3" /> {campaign.impressionCount}
                                                                </div>
                                                                <div className="flex items-center gap-1" title="Clics">
                                                                    <ExternalLink className="w-3 h-3" /> {campaign.clickCount}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleManualPost(campaign.id)} className="p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-500 rounded-lg transition" title="Publicar ahora">
                                                                    <Share2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleEdit(campaign)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition" title="Editar">
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(campaign.id)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition" title="Eliminar">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-4 p-4">
                                        {campaigns.map(campaign => (
                                            <div key={campaign.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="w-16 h-16 rounded-lg bg-black overflow-hidden border border-white/10">
                                                            <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{campaign.title}</h4>
                                                            <p className="text-xs text-text-secondary">{campaign.clientName || 'Interno'}</p>
                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    onClick={() => handleToggleStatus(campaign.id, campaign.isActive)}
                                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${campaign.isActive ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}
                                                                >
                                                                    {campaign.isActive ? 'ACTIVA' : 'PAUSADA'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                                    <div className="flex gap-4 text-xs font-mono text-text-secondary">
                                                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {campaign.impressionCount}</span>
                                                        <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {campaign.clickCount}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleManualPost(campaign.id)} className="p-2 bg-white/5 rounded-lg">
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleEdit(campaign)} className="p-2 bg-white/5 rounded-lg">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            <CampaignModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                campaign={selectedCampaign}
                onSuccess={() => {
                    fetchCampaigns()
                    setShowModal(false)
                }}
            />

            <CampaignAssetsModal
                isOpen={showAssetsModal}
                onClose={() => setShowAssetsModal(false)}
                assets={generatedAssets}
                onSuccess={() => {
                    fetchCampaigns()
                    setShowAssetsModal(false)
                }}
            />
        </div>
    )
}

function CampaignAssetsModal({ isOpen, onClose, assets, onSuccess }: any) {
    if (!isOpen || !assets) return null
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async () => {
        setIsSubmitting(true)
        try {
            // Append Video Script/Prompt to description or notes
            const fullDescription = `${assets.caption}\n\n[VIDEO SCRIPT]\n${assets.videoScript}\n\n[VEO PROMPT]\n${assets.videoPrompt}`

            // Create FormData to reuse existing action
            const formData = new FormData()
            formData.append('title', assets.title)
            formData.append('imageUrl', assets.imageUrl)
            formData.append('copywriting', fullDescription) // We might need to handle this in the backend action if it expects specific field
            // Mock required fields
            formData.append('startDate', new Date().toISOString())
            formData.append('endDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
            formData.append('clientName', 'AI Generated')

            // Note: The createPublicityCampaign action might need adjustment if it doesn't accept 'copywriting' directly in FormData
            // or we map it correctly. For now assuming basic fields.

            await createPublicityCampaign(null, formData)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert('Error al guardar campaña')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#111114] w-full max-w-4xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-xl font-black text-white flex items-center gap-2 italic">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        CAMPAÑA GENERADA (GRAVITY)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual Asset Column */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Imagen (Flux Realism)</label>
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
                                <img src={assets.imageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <a href={assets.imageUrl} download target="_blank" className="px-4 py-2 bg-white text-black rounded-lg font-bold text-xs flex items-center gap-2 hover:scale-105 transition">
                                        <Download className="w-4 h-4" /> Descargar 4K
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                <label className="text-xs font-bold text-purple-300 uppercase tracking-widest">Video (Gravity / Veo 3)</label>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-purple-500/10">
                                <p className="text-[10px] text-purple-200 font-mono mb-2">PROMPT TÉCNICO VEO 3:</p>
                                <p className="text-xs text-text-secondary italic leading-relaxed select-all cursor-text mb-4">
                                    {assets.videoPrompt}
                                </p>
                                <button className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transition">
                                    <Zap className="w-3 h-3" /> Renderizar en Gravity Cloud
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Text Assets Column */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Título Interno</label>
                            <input readOnly value={assets.title} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-bold" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Copy Instagram / Facebook</label>
                            <textarea readOnly value={assets.caption} className="w-full h-40 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-secondary resize-none custom-scrollbar leading-relaxed" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Guion de Video (Script)</label>
                            <textarea readOnly value={assets.videoScript} className="w-full h-40 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-text-secondary resize-none custom-scrollbar" />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-black shadow-lg shadow-white/10 transition disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? 'Guardando...' : 'GUARDAR CAMPAÑA'} <Save className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Sub-Components

const SocialQueue = () => (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
        <Clock className="w-12 h-12 mb-4" />
        <p>Cola de publicaciones (Próximamente)</p>
    </div>
)

// AIStudio is now imported from @/components/admin/AIStudio


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
