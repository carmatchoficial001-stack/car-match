import { useState, useRef, useEffect, memo, useMemo } from 'react'
import {
    Sparkles, User, Send, ImageIcon, ImagePlus, Zap,
    Type, Video, Hash, MousePointer2, Copy, Check, Star,
    MessageSquare, Plus, Trash2, History, RefreshCw,
    Menu, X, ChevronDown, LayoutGrid
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createAISession, getAISession, getAISessions, deleteAISession, saveAIMessage, AIStudioSessionWithMessages } from '@/app/admin/actions/ai-studio-actions'
import { generateCampaignAssets, suggestCampaignFromInventory, checkAIAssetStatus, chatWithPublicityAgent } from '@/app/admin/actions/ai-content-actions'
import { saveAIAssetUrl } from '@/app/admin/actions/publicity-actions'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'STRATEGY'

// 🚀 Memoized Message Item to prevent re-renders when typing
const MessageItem = memo(({ msg, isGenerating }: { msg: any; isGenerating: boolean }) => {
    // Memoize the content cleanup and regex matches
    const { cleanContent, videoUrl, imageUrl } = useMemo(() => {
        const cleaned = msg.content.replace(/\[VIDEO_PREVIEW\]:.*\n?|\[IMAGE_PREVIEW\]:.*\n?/g, '');
        const vUrl = msg.videoUrl || (msg.content.match(/\[VIDEO_PREVIEW\]:\s*(http\S+)/)?.[1]);
        const iUrl = msg.imageUrl || (msg.content.match(/\[IMAGE_PREVIEW\]:\s*(http\S+)/)?.[1]);
        return { cleanContent: cleaned, videoUrl: vUrl, imageUrl: iUrl };
    }, [msg.content, msg.videoUrl, msg.imageUrl]);

    return (
        <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
                {msg.role === 'user' ? <User className='w-4 h-4 text-white' /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-[#1A1D21] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                    {cleanContent}

                    {/* 🎬 VIDEO PREVIEW */}
                    {(videoUrl || msg.videoPendingId) && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 relative group/video bg-black/40 min-h-[100px] flex items-center justify-center">
                            {(videoUrl && videoUrl !== 'PENDING...') ? (
                                <video
                                    src={videoUrl}
                                    controls
                                    className="w-full aspect-video object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-500 p-8">
                                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                                    <span className="text-xs font-medium animate-pulse">Generando Video Único...</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] text-white backdrop-blur-sm">
                                AI Video
                            </div>
                        </div>
                    )}

                    {/* 🖼️ IMAGE PREVIEW */}
                    {(imageUrl || msg.imagePendingIds) && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 relative bg-black/40 min-h-[100px] flex items-center justify-center">
                            {(imageUrl && imageUrl !== 'PENDING...') ? (
                                <img
                                    src={imageUrl}
                                    className="w-full h-auto object-cover"
                                    alt="AI Generated"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-500 p-8">
                                    <ImageIcon className="w-8 h-8 animate-pulse text-indigo-500" />
                                    <span className="text-xs font-medium animate-pulse">Generando Imagen Principal...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {msg.role === 'assistant' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        <ActionButton icon={<Copy className="w-3 h-3" />} label="Copiar" onClick={() => navigator.clipboard.writeText(msg.content)} />
                    </div>
                )}
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default function AIStudio() {
    const router = useRouter()
    const [mode, setMode] = useState<AIMode>('CHAT')
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([
        { id: 'initial', role: 'assistant', content: '¡Hola! Soy tu Director Creativo de IA. ¿En qué trabajamos hoy? 🚀' }
    ])
    const [isGenerating, setIsGenerating] = useState(false)

    // Persistence State
    const [sessions, setSessions] = useState<any[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    // ⏳ ASSET POLLING STATE
    const [pendingAssets, setPendingAssets] = useState<{ id: string, type: string, campaignId?: string }[]>([]);

    useEffect(() => {
        if (pendingAssets.length === 0) return;

        const interval = setInterval(async () => {
            const results = await Promise.all(pendingAssets.map(async (asset) => {
                try {
                    const { checkAIAssetStatus } = await import('@/app/admin/actions/ai-content-actions');
                    const status = await checkAIAssetStatus(asset.id);
                    return { ...asset, ...status };
                } catch (err) {
                    return { ...asset, status: 'error' };
                }
            }));

            let anyFinished = false;
            results.forEach(res => {
                if (res.status === 'succeeded' && res.url) {
                    anyFinished = true;
                    if (res.campaignId) {
                        import('@/app/admin/actions/publicity-actions').then(({ saveAIAssetUrl }) => {
                            saveAIAssetUrl(res.campaignId!, res.type, res.url);
                        });
                    }

                    setMessages(prev => prev.map(msg => {
                        if (res.type === 'video' && msg.videoPendingId === res.id) {
                            if (res.campaignId || msg.campaignId) {
                                saveAIAssetUrl(res.campaignId || msg.campaignId, 'video', res.url);
                            }
                            return {
                                ...msg,
                                videoUrl: res.url,
                                content: msg.content.replace('PENDING...', res.url)
                            };
                        }
                        if (res.type.startsWith('image') && msg.imagePendingIds?.[res.type.split('_')[1]] === res.id) {
                            const type = res.type.split('_')[1];
                            let newContent = msg.content;
                            if (type === 'square') {
                                newContent = newContent.replace(/\[IMAGE_PREVIEW\]: PENDING.../, `[IMAGE_PREVIEW]: ${res.url}`);
                            }
                            if (res.campaignId) {
                                saveAIAssetUrl(res.campaignId, res.type, res.url);
                            }
                            return {
                                ...msg,
                                images: { ...(msg.images || {}), [type]: res.url },
                                imageUrl: type === 'square' ? res.url : msg.imageUrl,
                                content: newContent
                            };
                        }
                        return msg;
                    }));
                } else if (res.status === 'failed') {
                    anyFinished = true;
                }
            });

            if (anyFinished) {
                setPendingAssets(prev => prev.filter(p => !results.some(r => r.id === p.id && (r.status === 'succeeded' || r.status === 'failed'))));
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pendingAssets]);

    const addPendingAssets = (assets: { id: string, type: any, campaignId?: string }[]) => {
        setPendingAssets(prev => [...prev, ...assets.filter(a => a.id)]);
    };

    const handleUseInCampaign = async (history: any[]) => {
        setIsGenerating(true)
        const thinkingId = Date.now().toString();
        setMessages(prev => [...prev, { id: thinkingId, role: 'assistant', content: '🧠 Analizando historial y diseñando estrategia omnicanal...' }])

        try {
            const { generateCampaignStrategy, launchAssetPredictions } = await import('@/app/admin/actions/ai-content-actions')
            const strategyRes = await generateCampaignStrategy(history, 'MX')
            if (!strategyRes.success || !strategyRes.strategy) throw new Error(strategyRes.error || 'Error al generar la estrategia.')

            setMessages(prev => [...prev.filter(m => m.id !== thinkingId), { id: Date.now() + 1 + '', role: 'assistant', content: '🚀 Estrategia lista. Lanzando generación de imágenes y video (Omni-Format)...' }])

            const predictionRes = await launchAssetPredictions(strategyRes.strategy, 'MX')
            if (!predictionRes.success || !predictionRes.assets) throw new Error(predictionRes.error || 'Error al iniciar las predicciones.')

            const assets = predictionRes.assets;
            const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions')
            const campaignRes = await createCampaignFromAssets(assets)

            if (campaignRes.success && campaignRes.campaign) {
                const event = new CustomEvent('campaign-created', { detail: campaignRes.campaign });
                window.dispatchEvent(event);

                const content = `✅ ¡Campaña **"${campaignRes.campaign.title}"** creada exitosamente!\n\n🎯 **Estrategia Omni-Formato**: Se han lanzado tareas para generar:\n- 🎥 Video Viral (9:16)\n- 🖼️ Imagen Cuadrada (Instagram/FB Feed)\n- 📱 Imagen Vertical (Stories/TikTok)\n- 🖥️ Imagen Horizontal (Google Ads/YouTube)\n\n[VIDEO_PREVIEW]: PENDING...\n[IMAGE_PREVIEW]: PENDING...`

                const newMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: content,
                    campaignId: campaignRes.campaign.id,
                    videoPendingId: assets.videoPendingId,
                    imagePendingIds: assets.imagePendingIds,
                    images: {}
                };

                setMessages(prev => [...prev, newMessage])

                const toPoll: any[] = [];
                if (assets.videoPendingId) toPoll.push({ id: assets.videoPendingId, type: 'video', campaignId: campaignRes.campaign.id });
                if (assets.imagePendingIds?.square) toPoll.push({ id: assets.imagePendingIds.square, type: 'image_square', campaignId: campaignRes.campaign.id });
                if (assets.imagePendingIds?.vertical) toPoll.push({ id: assets.imagePendingIds.vertical, type: 'image_vertical', campaignId: campaignRes.campaign.id });
                if (assets.imagePendingIds?.horizontal) toPoll.push({ id: assets.imagePendingIds.horizontal, type: 'image_horizontal', campaignId: campaignRes.campaign.id });

                addPendingAssets(toPoll);
            } else {
                throw new Error(campaignRes.error || 'No pude guardar la campaña en la base de datos.')
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Hubo un problema: ${error.message || 'Error desconocido'}.` }])
        } finally {
            setIsGenerating(false)
        }
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => { loadSessions() }, [])
    useEffect(() => { scrollToBottom() }, [messages])

    const loadSessions = async () => {
        setIsLoadingHistory(true)
        try {
            const res = await getAISessions()
            if (res.success && res.chats) setSessions(res.chats)
        } catch (error) {
            setLoadError(true)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([{ id: 'initial', role: 'assistant', content: '¡Hola! Soy tu Director Creativo de IA. ¿En qué trabajamos hoy? 🚀' }])
        setMode('CHAT')
        setShowHistory(false)
    }

    const handleSelectSession = async (sessionId: string) => {
        if (currentSessionId === sessionId) return
        setIsLoadingHistory(true)
        setCurrentSessionId(sessionId)
        setShowHistory(false)
        const res = await getAISession(sessionId)
        if (res.success && res.chat) {
            const uiMessages = res.chat.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content
            }))
            setMessages(uiMessages.length > 0 ? uiMessages : [{ id: 'empty', role: 'assistant', content: 'Sesión vacía.' }])
            setMode((res.chat.mode as AIMode) || 'CHAT')
        }
        setIsLoadingHistory(false)
    }

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation()
        if (confirm('¿Eliminar este chat?')) {
            await deleteAISession(sessionId)
            if (currentSessionId === sessionId) handleNewChat()
            loadSessions()
        }
    }

    const handleSend = async () => {
        if (!prompt.trim() || isGenerating) return
        const userText = prompt
        const userMsgId = Date.now().toString()
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userText }])
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

            let aiContent = 'Tuve un problema. Intenta de nuevo.'
            if (response.success && response.message) aiContent = response.message

            const aiMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: aiContent }])
            if (sessionId) await saveAIMessage(sessionId, 'assistant', aiContent)
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Error de conexión.' }])
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/5 flex-col relative">
            <div className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handleNewChat} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition border border-white/5">
                            <Plus className="w-3.5 h-3.5" /> Nuevo Chat
                        </button>
                        <div className="relative">
                            <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-white/5 ${showHistory ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-white/5 hover:bg-white/10 text-zinc-300'}`}>
                                <History className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Historial</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                            </button>
                            {showHistory && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1D21] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Chats Recientes</span>
                                        <button onClick={() => loadSessions()} className="p-1 hover:text-white text-zinc-500 rounded"><RefreshCw className="w-3 h-3" /></button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                        {sessions.length === 0 && !isLoadingHistory && <div className="p-4 text-center text-xs text-zinc-600">No hay historial</div>}
                                        {sessions.map(session => (
                                            <button key={session.id} onClick={() => handleSelectSession(session.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left transition group ${currentSessionId === session.id ? 'bg-purple-500/10 text-purple-300' : 'hover:bg-white/5 text-zinc-400'}`}>
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                                                <span className="truncate flex-1">{session.name}</span>
                                                <div onClick={(e) => handleDeleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"><Trash2 className="w-3 h-3" /></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115] relative z-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {messages.map((msg) => (
                        <MessageItem key={msg.id || msg.content} msg={msg} isGenerating={isGenerating} />
                    ))}
                    {isGenerating && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-[#1A1D21] px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2 text-sm text-purple-300">
                                <span className="animate-pulse">Pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-zinc-900/50 border-t border-white/5 backdrop-blur-md">
                    <div className="relative flex items-end gap-2 bg-[#1A1D21] border border-white/10 rounded-2xl p-2 focus-within:border-purple-500/50 transition-all shadow-inner max-w-4xl mx-auto">
                        <button className="p-2 text-zinc-400 hover:text-white transition rounded-xl hover:bg-white/5 shrink-0" title="Subir Imagen de Referencia">
                            <ImagePlus className="w-5 h-5" />
                        </button>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder={mode === 'CHAT' ? "Escribe un mensaje..." : `Describe lo que quieres generar (${mode})...`}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-zinc-500 min-h-[44px] max-h-[160px] py-3 px-2 resize-none custom-scrollbar"
                        />
                        <div className="flex items-center gap-2 shrink-0 pr-2">
                            <button onClick={handleSend} disabled={!prompt.trim() || isGenerating} className={`p-2 rounded-xl transition shrink-0 ${prompt.trim() && !isGenerating ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <div className="flex justify-center mt-3 animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => handleUseInCampaign(messages)} disabled={isGenerating} className="group relative flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                                <Zap className="w-4 h-4 fill-current text-amber-300 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">{isGenerating ? 'Generando Pack...' : 'Convertir a Campaña Viral'}</span>
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ActionButton({ icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white transition">
            {icon}
            {label}
        </button>
    )
}
