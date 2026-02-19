// 🚀 FORCE BUILD: 2026-02-18 11:41 (Fix platforms and unique context)
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
    Bot, User, Download, ImagePlus, Send, Save, X, Copy, Check, Video, ArrowRight, Info, Type as TypeIcon, Loader2
} from 'lucide-react'
import {
    getPublicityCampaigns,
    createPublicityCampaign,
    updatePublicityCampaign,
    deletePublicityCampaign,
    togglePublicityStatus,
    manualTriggerSocialPost,
    createCampaignFromAssets,
    saveAIAssetUrl
} from '@/app/admin/actions/publicity-actions'
import {
    generateSocialCaption, generateImagePrompt, generateVideoScript, suggestCampaignFromInventory,
    chatWithPublicityAgent, generateCampaignAssets, checkAIAssetStatus
} from '@/app/admin/actions/ai-content-actions'
import AIStudio from '@/components/admin/AIStudio'

// Helper for MX Date
const formatDateMX = (date: Date | string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

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
    metadata?: any
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

    // Campaign Edit Chat State
    const [showEditChat, setShowEditChat] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState<PublicityCampaign | null>(null)
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [chatInput, setChatInput] = useState('')

    useEffect(() => {
        const handleOpenAssets = (e: any) => {
            setGeneratedAssets(e.detail)
            setShowAssetsModal(true)
            // Automatically switch to CAMPAIGNS view so user sees where the campaign will be saved
            setViewMode('CAMPAIGNS')
        }
        window.addEventListener('open-campaign-assets', handleOpenAssets)
        return () => window.removeEventListener('open-campaign-assets', handleOpenAssets)
    }, [])

    // Listen for campaign created event from AI Studio
    useEffect(() => {
        const handleCampaignCreated = (e: any) => {
            // Automatically switch to CAMPAIGNS view
            setViewMode('CAMPAIGNS')
            // Refresh campaigns list
            fetchCampaigns()

            // ✨ AUTO-OPEN AD PACK for instant gratification
            if (e.detail) {
                try {
                    // e.detail is the campaign object
                    // We need to parse metadata to get assets
                    const campaign = e.detail
                    if (campaign.metadata) {
                        let meta = typeof campaign.metadata === 'string'
                            ? JSON.parse(campaign.metadata)
                            : campaign.metadata

                        let assets = meta.assets
                        if (typeof assets === 'string') {
                            try {
                                assets = JSON.parse(assets)
                            } catch (e) {
                                console.error('Error parsing nested assets string in auto-open', e)
                            }
                        }

                        if (assets) {
                            setGeneratedAssets(assets)
                            setShowAssetsModal(true)
                        }
                    }
                } catch (error) {
                    console.error('Error auto-opening campaign assets:', error)
                }
            }
        }
        window.addEventListener('campaign-created', handleCampaignCreated)
        return () => window.removeEventListener('campaign-created', handleCampaignCreated)
    }, [])

    useEffect(() => {
        if (viewMode === 'CAMPAIGNS') {
            fetchCampaigns()
        }
    }, [viewMode])


    const fetchCampaigns = async () => {
        setLoading(true)
        const res = await getPublicityCampaigns()
        if (res.success) {
            setCampaigns(res.data as PublicityCampaign[])
        }
        setLoading(false)
    }

    // Proactive polling for pending assets
    useEffect(() => {
        if (!showAssetsModal || !generatedAssets) return;

        const pIds: any[] = [];
        if (generatedAssets.videoPendingId) pIds.push({ id: generatedAssets.videoPendingId, type: 'video' });
        if (generatedAssets.imagePendingIds?.square) pIds.push({ id: generatedAssets.imagePendingIds.square, type: 'image_square' });
        if (generatedAssets.imagePendingIds?.vertical) pIds.push({ id: generatedAssets.imagePendingIds.vertical, type: 'image_vertical' });
        if (generatedAssets.imagePendingIds?.horizontal) pIds.push({ id: generatedAssets.imagePendingIds.horizontal, type: 'image_horizontal' });

        if (pIds.length === 0) return;

        console.log('[POLL-ADPACK] Monitoreando assets pendientes...', pIds);

        const interval = setInterval(async () => {
            const results = await Promise.all(pIds.map(async (p) => {
                const res = await checkAIAssetStatus(p.id);
                return { ...p, ...res };
            }));

            results.forEach(async (res) => {
                if (res.status === 'succeeded' && res.url) {
                    console.log(`[POLL-ADPACK] Asset ${res.type} listo!`, res.url);

                    // Find campaign ID to persist
                    const campaignId = campaigns.find(c => {
                        try {
                            const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
                            return meta?.assets?.videoPendingId === generatedAssets.videoPendingId ||
                                meta?.assets?.imagePendingIds?.square === generatedAssets.imagePendingIds?.square;
                        } catch { return false; }
                    })?.id;

                    if (campaignId) {
                        await saveAIAssetUrl(campaignId, res.type, res.url);
                    }

                    // Refresh UI
                    setGeneratedAssets((prev: any) => {
                        if (!prev) return prev;
                        const next = { ...prev };
                        if (res.type === 'video') { next.videoUrl = res.url; next.videoPendingId = null; }
                        else if (res.type.startsWith('image_')) {
                            const imgType = res.type.split('_')[1];
                            if (!next.images) next.images = {};
                            next.images[imgType] = res.url;
                            if (next.imagePendingIds) next.imagePendingIds[imgType] = null;
                            if (imgType === 'square') next.imageUrl = res.url;
                        }
                        return next;
                    });
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [showAssetsModal, generatedAssets, campaigns]);

    useEffect(() => {
        fetchCampaigns()
    }, [])

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
            alert('✅ Publicado en redes sociales (simulado)')
            fetchCampaigns()
        } else {
            alert('Error al publicar')
        }
    }

    const handleOpenAdPack = (campaign: PublicityCampaign) => {
        // Safe metadata handling
        const rawMetadata = (campaign as any).metadata
        if (!rawMetadata) {
            alert('Esta campaña no tiene assets de IA generados.')
            return
        }

        try {
            let meta = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata

            // Handle double-stringified assets if they exist
            let assets = meta.assets
            if (typeof assets === 'string') {
                try {
                    assets = JSON.parse(assets)
                } catch (e) {
                    console.error('Error parsing nested assets string', e)
                }
            }

            if (assets) {
                setGeneratedAssets(assets)
                setShowAssetsModal(true)
            } else {
                alert('Esta campaña no tiene assets de IA generados.')
            }
        } catch (e) {
            console.error('Error parsing campaign metadata', e)
            alert('Error al leer los assets de la campaña.')
        }
    }

    // Campaign Edit Chat Functions
    const handleOpenEditChat = (campaign: PublicityCampaign) => {
        setEditingCampaign(campaign)
        setChatMessages([{
            role: 'assistant',
            content: `¡Hola! Soy tu asistente de edición para la campaña **${campaign.title}**.\n\n✨ Puedo ayudarte a:\n• "Mejora el video"\n• "Cambia la imagen a un auto rojo"\n• "Haz el copy más corto"\n\n¿Qué quieres editar?`
        }])
        setShowEditChat(true)
    }

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !editingCampaign || isRegenerating) return

        const userMessage = chatInput.trim()
        setChatInput('')

        // Add user message to chat
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsRegenerating(true)

        try {
            // Get current campaign metadata
            const metadata = (editingCampaign as any).metadata ? JSON.parse((editingCampaign as any).metadata as any) : {}
            const currentAssets = metadata.assets || {}

            // Call regenerate API
            const { regenerateCampaignElement } = await import('@/app/admin/actions/ai-content-actions')
            const result = await regenerateCampaignElement(editingCampaign.id, userMessage, currentAssets)

            if (result.success) {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.message + '\n\n✅ La campaña ha sido actualizada. Los cambios ya están guardados.'
                }])
                // Refresh campaigns to show updated data
                fetchCampaigns()
            } else {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Error: ${result.error}\n\nIntenta ser más específico o usa instrucciones más simples.`
                }])
            }
        } catch (error: any) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${error.message || 'Error desconocido'}`
            }])
        } finally {
            setIsRegenerating(false)
        }
    }

    const handleCloseEditChat = () => {
        setShowEditChat(false)
        setEditingCampaign(null)
        setChatMessages([])
        setChatInput('')
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
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        {/* Manual creation button removed */}
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-3xl overflow-hidden relative backdrop-blur-sm flex flex-col">
                {viewMode === 'AI_STUDIO' ? (
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
                                                                    <img
                                                                        src={campaign.imageUrl}
                                                                        alt={campaign.title}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?auto=format&fit=crop&q=80&w=1000'
                                                                        }}
                                                                    />
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
                                                                <button onClick={() => handleOpenAdPack(campaign)} className="p-2 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 rounded-lg transition" title="Ver Global Ad Pack">
                                                                    <Globe className="w-4 h-4" />
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
                                                            <img
                                                                src={campaign.imageUrl}
                                                                alt={campaign.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?auto=format&fit=crop&q=80&w=1000'
                                                                }}
                                                            />
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
                                                        <button onClick={() => handleManualPost(campaign.id)} className="p-3 min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl transition flex items-center justify-center">
                                                            <Share2 className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleOpenAdPack(campaign)} className="p-3 min-h-[44px] min-w-[44px] bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 text-purple-400 rounded-xl transition flex items-center justify-center" title="Global Ad Pack">
                                                            <Globe className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleEdit(campaign)} className="p-3 min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl transition flex items-center justify-center">
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleOpenEditChat(campaign)} className="p-3 min-h-[44px] min-w-[44px] bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 text-purple-400 rounded-xl transition flex items-center justify-center" title="Editar con IA">
                                                            <Sparkles className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(campaign.id)} className="p-3 min-h-[44px] min-w-[44px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-500 rounded-xl transition flex items-center justify-center">
                                                            <Trash2 className="w-5 h-5" />
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

            {/* Campaign Edit Chat Modal */}
            <AnimatePresence>
                {showEditChat && editingCampaign && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
                        onClick={handleCloseEditChat}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-[90vh] bg-gradient-to-b from-[#1a1a2e] to-black rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-lg text-white">Editar con IA</h2>
                                        <p className="text-xs text-purple-300 font-medium">{editingCampaign.title}</p>
                                    </div>
                                </div>
                                <button onClick={handleCloseEditChat} className="p-3 hover:bg-white/10 rounded-xl transition">
                                    <X className="w-6 h-6 text-white/70" />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
                                            {msg.role === 'user' ? <User className='w-5 h-5 text-white' /> : <Sparkles className="w-5 h-5 text-white" />}
                                        </div>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-[#1A1D21] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isRegenerating && (
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-[#1A1D21] px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2 text-sm text-purple-300">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Regenerando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area - Táctil */}
                            <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-xl">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isRegenerating && handleSendChatMessage()}
                                        placeholder="Ej: Mejora el video, Cambia la imagen..."
                                        disabled={isRegenerating}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 text-base min-h-[52px]"
                                    />
                                    <button
                                        onClick={handleSendChatMessage}
                                        disabled={!chatInput.trim() || isRegenerating}
                                        className="min-w-[52px] min-h-[52px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40 transition"
                                    >
                                        <Send className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const PLATFORMS = [
    { id: 'meta_ads', label: 'Meta Ads (FB/IG)', icon: <img src="https://cdn-icons-png.flaticon.com/512/6033/6033716.png" className="w-5 h-5 invert" />, color: 'bg-blue-600' },
    { id: 'facebook_marketplace', label: 'Marketplace', icon: <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" className="w-5 h-5 invert" />, color: 'bg-blue-700' },
    { id: 'google_ads', label: 'Google Ads', icon: <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" className="w-5 h-5 invert" />, color: 'bg-green-600' },
    { id: 'tiktok_ads', label: 'TikTok Ads', icon: <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="w-5 h-5 invert" />, color: 'bg-black' },
    { id: 'youtube_shorts', label: 'YouTube Shorts', icon: <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" className="w-5 h-5 invert" />, color: 'bg-red-600' },
    { id: 'twitter_x', label: 'X (Twitter)', icon: <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" className="w-5 h-5 invert" />, color: 'bg-slate-800' },
    { id: 'threads', label: 'Threads', icon: <span className="font-bold text-lg select-none leading-none">@</span>, color: 'bg-black' },
    { id: 'snapchat_ads', label: 'Snapchat', icon: <img src="https://cdn-icons-png.flaticon.com/512/3670/3670166.png" className="w-5 h-5 invert" />, color: 'bg-yellow-400 text-black' },
]

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

function CampaignAssetsModal({ isOpen, onClose, assets, onSuccess }: any) {
    if (!isOpen || !assets) return null

    // Determine title
    const campaignTitle = assets.internal_title || assets.title || 'Campaña Generada'

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="bg-[#111114] w-full max-w-2xl h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                {/* HEADER */}
                <div className="p-5 border-b border-white/5 bg-zinc-900/50 flex justify-between items-start shrink-0 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                Global Ad Pack
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight">{campaignTitle}</h2>
                        <p className="text-xs text-zinc-500 mt-1">Campaña única optimizada por IA</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">

                    {/* PLATFORMS ACCORDION - NOW CONTAINS MEDIA */}
                    {
                        PLATFORMS.map(platform => (
                            <PlatformAccordionItem
                                key={platform.id}
                                platform={platform}
                                data={assets.platforms?.[platform.id]}
                                assets={assets}
                            />
                        ))
                    }
                </div >

                {/* FOOTER ACTIONS */}
                < div className="p-4 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md shrink-0 safe-area-bottom" >
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition shadow-lg shadow-white/5 active:scale-[0.98]"
                    >
                        Listo, Cerrar
                    </button>
                </div >
            </motion.div >
        </div >
    )
}

function PlatformAccordionItem({ platform, data, assets }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    if (!data) return null // Don't show platforms without data

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
                        <h3 className={`font-bold text-sm ${isOpen ? 'text-white' : 'text-zinc-300'}`}>{platform.label}</h3>
                        {!isOpen && <p className="text-[10px] text-zinc-500">Click para ver contenido</p>}
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
                                    {/* VIDEO LOGIC: Meta, TikTok, Shorts, Snapchat */}
                                    {['meta_ads', 'tiktok_ads', 'youtube_shorts', 'snapchat_ads'].includes(platform.id) && (
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

                                    {/* SQUARE IMAGE: Meta, Marketplace, Google, Threads */}
                                    {['meta_ads', 'facebook_marketplace', 'google_ads', 'threads'].includes(platform.id) && (
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

                                    {/* VERTICAL IMAGE: Meta, Snapchat */}
                                    {['meta_ads', 'snapchat_ads'].includes(platform.id) && (
                                        <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/10 relative group bg-black flex flex-col items-center justify-center">
                                            {(assets.images?.vertical?.startsWith('http') || assets.images?.square?.startsWith('http') || (assets.imageUrl?.startsWith('http') && assets.imageUrl !== 'PENDING...')) ? (
                                                <>
                                                    <img src={assets.images?.vertical || assets.images?.square || assets.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => downloadAsset(assets.images?.vertical || assets.images?.square || assets.imageUrl, `${platform.id}-story.jpg`)}
                                                            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] text-white">
                                                        {assets.images?.vertical ? '9:16' : '1:1 (Fallback)'}
                                                    </div>
                                                </>
                                            ) : (assets.images?.vertical === 'PENDING...' || assets.imagePendingIds?.vertical || assets.imagePendingIds?.square) ? (
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
                                                <div className="text-[10px] text-zinc-600 font-bold">No hay imagen</div>
                                            )}
                                        </div>
                                    )}

                                    {/* HORIZONTAL IMAGE: Google, X */}
                                    {['google_ads', 'twitter_x'].includes(platform.id) && (
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
