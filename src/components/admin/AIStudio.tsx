import { useState, useRef, useEffect, memo, useMemo } from 'react'
import {
    Sparkles, User, Send, ImageIcon, ImagePlus, Zap,
    Type, Video, Hash, MousePointer2, Copy, Check, Star,
    MessageSquare, Plus, Trash2, History, RefreshCw,
    Menu, X, ChevronDown, LayoutGrid, Bot
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createAISession, getAISession, getAISessions, deleteAISession, saveAIMessage, AIStudioSessionWithMessages } from '@/app/admin/actions/ai-studio-actions'
import { generateCampaignAssets, suggestCampaignFromInventory, checkAIAssetStatus, chatWithPublicityAgent } from '@/app/admin/actions/ai-content-actions'
import { saveAIAssetUrl } from '@/app/admin/actions/publicity-actions'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'VIDEO_GEN' | 'STRATEGY'

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

const ERROR_MAP: Record<string, string> = {
    'REPLICATE_PAYMENT_REQUIRED': '❌ Tu cuenta de Replicate no tiene créditos o requiere un método de pago activo. Por favor, revisa tu cuenta en replicate.com.',
    'REPLICATE_AUTH_FAILED': '❌ Error de autenticación con Replicate. Verifica que REPLICATE_API_TOKEN sea correcta en el archivo .env.',
    'MISSING_API_KEY': '❌ No se encontró la llave de API (REPLICATE_API_TOKEN). Contáctate con el administrador.',
    'TIMEOUT_REACHED': '⌛ La generación tardó más de lo esperado (timeout). Intenta con un prompt más simple.',
    'INVALID_OUTPUT_URL': '❌ La IA generó un archivo pero el formato no es válido. Intenta de nuevo.'
};

export default function AIStudio({ defaultMode }: { defaultMode?: AIMode }) {
    const router = useRouter()
    const [mode, setMode] = useState<AIMode>(defaultMode || 'CHAT') // 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'VIDEO_GEN' | 'STRATEGY'
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    // ... persistence state ...
    const [sessions, setSessions] = useState<any[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [pendingAssets, setPendingAssets] = useState<{ id: string, type: string, campaignId?: string }[]>([]);

    useEffect(() => {
        if (pendingAssets.length === 0) return;
        const interval = setInterval(async () => {
            const { checkAIAssetStatus } = await import('@/app/admin/actions/ai-content-actions');
            const results = await Promise.all(pendingAssets.map(async (asset) => {
                try {
                    const status = await checkAIAssetStatus(asset.id);
                    return { ...asset, ...status };
                } catch (err) { return { ...asset, status: 'error' }; }
            }));

            let anyFinished = false;
            results.forEach(res => {
                if (res.status === 'succeeded' && res.url) {
                    anyFinished = true;
                    setMessages(prev => prev.map(msg => {
                        if (res.type === 'video' && msg.videoPendingId === res.id) {
                            return { ...msg, videoUrl: res.url, content: msg.content.replace('PENDING...', res.url) };
                        }
                        if (res.type.startsWith('image') && msg.imagePendingIds?.[res.type.split('_')[1]] === res.id) {
                            const type = res.type.split('_')[1];
                            return {
                                ...msg,
                                images: { ...(msg.images || {}), [type]: res.url },
                                imageUrl: type === 'square' ? res.url : msg.imageUrl,
                                content: msg.content.replace('PENDING...', res.url)
                            };
                        }
                        return msg;
                    }));
                } else if (res.status === 'failed') anyFinished = true;
            });

            if (anyFinished) {
                setPendingAssets(prev => prev.filter(p => !results.some(r => r.id === p.id && (r.status === 'succeeded' || r.status === 'failed'))));
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [pendingAssets]);
    // Fetch history based on mode
    useEffect(() => {
        const fetchSessionsForMode = async () => {
            setIsLoadingHistory(true);
            try {
                const res = await getAISessions(mode);
                if (res.success && res.chats) setSessions(res.chats);
            } catch { setLoadError(true); }
            finally { setIsLoadingHistory(false); }
        }
        fetchSessionsForMode();

        // Reset messages if no session active
        if (!currentSessionId) {
            const initialContent = mode === 'IMAGE_GEN'
                ? '🎨 **Estudio de Imágenes Virales**\n\n¿Qué tipo de arte quieres crear hoy? Puedo ayudarte con:\n• Memes de autos\n• Trivias visuales\n• Arte conceptual fotorrealista'
                : mode === 'VIDEO_GEN'
                    ? '🎥 **Productora de Video Viral**\n\n¡Hagamos el próximo gran video! Pídeme un guion para:\n• Review rápida de vehículo\n• Anuncio dinámico para FB/TikTok\n• Storytelling emocional'
                    : '¡Hola! Soy tu Director Creativo de IA. ¿Creamos algo viral hoy? 🚀'

            setMessages([{ id: 'initial', role: 'assistant', content: initialContent }])
        }
    }, [mode, currentSessionId]);


    const handleUseInCampaign = async (history: any[]) => {
        setIsGenerating(true)
        const thinkingId = Date.now().toString();

        let thinkingText = '🧠 Diseñando estrategia viral...';
        if (mode === 'IMAGE_GEN') thinkingText = '🎨 Diseñando imagen viral (Meme/Trivia)...';
        if (mode === 'VIDEO_GEN') thinkingText = '🎬 Escribiendo guion y planeando video...';

        setMessages(prev => [...prev, { id: thinkingId, role: 'assistant', content: thinkingText }])

        try {
            const { generateCampaignStrategy, generateImageStrategy, generateVideoStrategy, launchAssetPredictions, launchImageOnlyPrediction, launchVideoOnlyPrediction } = await import('@/app/admin/actions/ai-content-actions')

            let resultAssets;
            let campaignRes = { success: false, campaign: null, error: '' };
            const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions');

            if (mode === 'IMAGE_GEN') {
                const strat = await generateImageStrategy(history, 'MX');
                if (!strat.success) throw new Error(strat.error);
                setMessages(prev => [...prev.filter(m => m.id !== thinkingId), { id: Date.now() + 'p', role: 'assistant', content: '🎨 Generando imagen...' }]);

                const prediction = await launchImageOnlyPrediction(strat.strategy);
                if (!prediction.success) throw new Error(prediction.error);

                resultAssets = prediction.assets;
                // Auto-save campaign? Maybe just show it first. Let's save to have ID for persistence where usually needed
                campaignRes = await createCampaignFromAssets(resultAssets);

            } else if (mode === 'VIDEO_GEN') {
                const strat = await generateVideoStrategy(history, 'MX');
                if (!strat.success) throw new Error(strat.error);
                setMessages(prev => [...prev.filter(m => m.id !== thinkingId), { id: Date.now() + 'p', role: 'assistant', content: '🎬 Produciendo video...' }]);

                const prediction = await launchVideoOnlyPrediction(strat.strategy);
                if (!prediction.success) throw new Error(prediction.error);

                resultAssets = prediction.assets;
                campaignRes = await createCampaignFromAssets(resultAssets);

            } else {
                // FALLBACK / FULL MODE
                const strat = await generateCampaignStrategy(history, 'MX');
                if (!strat.success) throw new Error(strat.error);
                const prediction = await launchAssetPredictions(strat.strategy, 'MX');
                if (!prediction.success) throw new Error(prediction.error);
                resultAssets = prediction.assets;
                campaignRes = await createCampaignFromAssets(resultAssets);
            }

            if (campaignRes.success && campaignRes.campaign) {
                const content = mode === 'IMAGE_GEN'
                    ? `✅ ¡Imagen Viral Creada!\n\n"${campaignRes.campaign.title}"\n[IMAGE_PREVIEW]: PENDING...`
                    : mode === 'VIDEO_GEN'
                        ? `✅ ¡Video Viral Iniciado!\n\n"${campaignRes.campaign.title}"\n[VIDEO_PREVIEW]: PENDING...`
                        : `✅ ¡Campaña Completa!\n[IMAGE_PREVIEW]: PENDING...`;

                const newMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: content.replace('PENDING...', (resultAssets.imageUrl || resultAssets.videoUrl || 'PENDING...')),
                    campaignId: campaignRes.campaign.id,
                    videoPendingId: resultAssets.videoPendingId,
                    imagePendingIds: resultAssets.imagePendingIds,
                    imageUrl: resultAssets.imageUrl,
                    videoUrl: resultAssets.videoUrl,
                    images: {}
                };
                setMessages(prev => [...prev.filter(m => m.id !== thinkingId && !m.id.endsWith('p')), newMessage]);

                const toPoll: any[] = [];
                if (resultAssets.videoPendingId) toPoll.push({ id: resultAssets.videoPendingId, type: 'video', campaignId: campaignRes.campaign.id });
                if (resultAssets.imagePendingIds?.square) toPoll.push({ id: resultAssets.imagePendingIds.square, type: 'image_square', campaignId: campaignRes.campaign.id });
                if (resultAssets.imagePendingIds?.vertical) toPoll.push({ id: resultAssets.imagePendingIds.vertical, type: 'image_vertical', campaignId: campaignRes.campaign.id });

                addPendingAssets(toPoll);
            }

        } catch (error: any) {
            const mappedMessage = ERROR_MAP[error.message] || `❌ Error: ${error.message}`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: mappedMessage }]);
        } finally {
            setIsGenerating(false)
        }
    }

    // ... helper functions ...
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    useEffect(() => { loadSessions() }, [])
    useEffect(() => { scrollToBottom() }, [messages])

    // ... loadSessions, handleNewChat, handleSelectSession, handleDeleteSession same as before ... 
    // BUT update handleSelectSession to set correct MODE
    // ... handleSend same as before ...
    const loadSessions = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await getAISessions(mode);
            if (res.success && res.chats) setSessions(res.chats);
        } catch { setLoadError(true); }
        finally { setIsLoadingHistory(false); }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([]) // useEffect handles the rest
        setShowHistory(false)
    }

    const handleSelectSession = async (sessionId: string) => {
        if (currentSessionId === sessionId) return;
        setIsLoadingHistory(true);
        setCurrentSessionId(sessionId);
        setShowHistory(false);
        const res = await getAISession(sessionId);
        if (res.success && res.chat) {
            const uiMessages = res.chat.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content }));
            setMessages(uiMessages);
            setMode((res.chat.mode as AIMode) || 'CHAT');
        }
        setIsLoadingHistory(false);
    }

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (confirm('¿Eliminar este chat?')) {
            await deleteAISession(sessionId);
            loadSessions();
        }
    }

    const handleSend = async () => {
        if (!prompt.trim() || isGenerating) return
        const userText = prompt
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }])
        setPrompt('')
        setIsGenerating(true)

        try {
            let sessionId = currentSessionId
            if (!sessionId) {
                const newSessionRes = await createAISession(mode, userText) // Pass current mode!
                if (newSessionRes.success && newSessionRes.chat) {
                    sessionId = newSessionRes.chat.id
                    setCurrentSessionId(sessionId)
                    loadSessions()
                }
            }
            if (sessionId) saveAIMessage(sessionId, 'user', userText)

            // Context logic
            const historyForAI = messages.slice(-10)
            const response = await chatWithPublicityAgent([...historyForAI, { role: 'user', content: userText }], 'MX')

            let aiContent = 'Error.'
            if (response.success) aiContent = response.message!

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiContent }])
            if (sessionId) await saveAIMessage(sessionId, 'assistant', aiContent)
        } catch (e: any) {
            const mappedMessage = ERROR_MAP[e.message] || `❌ Error al procesar solicitud: ${e.message}`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: mappedMessage }]);
        } finally {
            setIsGenerating(false)
        }
    }

    const addPendingAssets = (assets: any[]) => setPendingAssets(prev => [...prev, ...assets]);

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/5 flex-col relative">
            {/* HEADER CON TABS DE MODO */}
            <div className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    <button onClick={handleNewChat} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition">
                        <Plus className="w-4 h-4" />
                    </button>

                    <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 shadow-lg">
                        <button
                            onClick={() => { setMode('IMAGE_GEN'); setCurrentSessionId(null); setMessages([]); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'IMAGE_GEN' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">IMÁGENES</span>
                        </button>
                        <button
                            onClick={() => { setMode('VIDEO_GEN'); setCurrentSessionId(null); setMessages([]); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'VIDEO_GEN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Video className="w-4 h-4" />
                            <span className="hidden sm:inline">VIDEO</span>
                        </button>
                        <button
                            onClick={() => { setMode('CHAT'); setCurrentSessionId(null); setMessages([]); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'CHAT' ? 'bg-zinc-700 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
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
                    {/* History Dropdown (same as before) */}
                    {showHistory && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1A1D21] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-[300px] overflow-y-auto p-1">
                                {sessions.map(session => (
                                    <button key={session.id} onClick={() => handleSelectSession(session.id)} className="w-full text-left p-2 hover:bg-white/5 rounded text-xs text-zinc-400 truncate">
                                        {session.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115] relative z-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {messages.map((msg) => (
                        <MessageItem key={msg.id || msg.content} msg={msg} isGenerating={isGenerating} />
                    ))}
                    {isGenerating && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                            <div className="bg-[#1A1D21] px-4 py-3 rounded-2xl text-sm text-indigo-300">Creando magia viral...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-zinc-900/50 border-t border-white/5 backdrop-blur-md">
                    <div className="relative flex items-end gap-2 bg-[#1A1D21] border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-all shadow-inner max-w-4xl mx-auto">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={mode === 'IMAGE_GEN' ? "Describe el meme, trivia o imagen viral que quieres..." : mode === 'VIDEO_GEN' ? "Describe la idea para el video de TikTok/Reels..." : "Escribe un mensaje..."}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-zinc-500 min-h-[44px] max-h-[160px] py-3 px-2 resize-none custom-scrollbar"
                        />
                        <button onClick={handleSend} disabled={!prompt.trim() || isGenerating} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shrink-0 disabled:opacity-50">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ACCIÓN PRINCIPAL: GENERAR */}
                    {messages.length > 0 && !isGenerating && mode !== 'CHAT' && (
                        <div className="flex justify-center mt-3 animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => handleUseInCampaign(messages)}
                                className={`group relative flex items-center gap-3 px-8 py-3 text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 ${mode === 'IMAGE_GEN' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-cyan-900/40' : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-900/40'}`}
                            >
                                {mode === 'IMAGE_GEN' ? <ImageIcon className="w-4 h-4 fill-current text-white" /> : <Video className="w-4 h-4 fill-current text-white" />}
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {mode === 'IMAGE_GEN' ? 'Generar Imagen Viral' : 'Producir Video Viral'}
                                </span>
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
