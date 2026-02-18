'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Sparkles, User, Send, ImageIcon, ImagePlus, Zap,
    Type, Video, Hash, MousePointer2, Copy, Check, Star,
    MessageSquare, Plus, Trash2, History, RefreshCw,
    Menu, X, ChevronDown, LayoutGrid
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { chatWithPublicityAgent, suggestCampaignFromInventory, generateCampaignAssets } from '@/app/admin/actions/ai-content-actions'
import { getAISessions, getAISession, createAISession, saveAIMessage, deleteAISession, AIStudioSessionWithMessages } from '@/app/admin/actions/ai-studio-actions'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'STRATEGY'

export default function AIStudio() {
    const router = useRouter()
    const [mode, setMode] = useState<AIMode>('CHAT')
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: '¡Hola! Soy tu Director Creativo de IA. ¿En qué trabajamos hoy? 🚀' }
    ])
    const [isGenerating, setIsGenerating] = useState(false)

    // Persistence State
    const [sessions, setSessions] = useState<any[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [showHistory, setShowHistory] = useState(false) // 🆕 Control visual del historial

    const handleUseInCampaign = async (history: any[]) => {
        setIsGenerating(true)
        setMessages(prev => [...prev, { role: 'assistant', content: '🎨 Generando Assets Reales (Imagen Flux + Copy + Script Veo)... Espera un momento.' }])

        try {
            const res = await generateCampaignAssets(history, 'MX')
            if (res.success && res.assets) {
                // ✨ AUTO-GUARDAR CAMPAÑA
                setMessages(prev => [...prev, { role: 'assistant', content: '💾 Guardando campaña automáticamente...' }])

                const { createCampaignFromAssets } = await import('@/app/admin/actions/publicity-actions')
                const campaignRes = await createCampaignFromAssets(res.assets)

                if (campaignRes.success && campaignRes.campaign) {
                    // Dispatch event to switch to CAMPAIGNS tab
                    const event = new CustomEvent('campaign-created', { detail: campaignRes.campaign });
                    window.dispatchEvent(event);

                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `✅ ¡Campaña creada exitosamente!\n\n📋 **${campaignRes.campaign.title}**\n\n🎯 Ahora puedes verla en la sección Campañas.\n💡 Aquí tienes una vista previa del video generado:`,
                        videoUrl: res.assets.videoUrl // Pass the video URL to the message component
                    }])
                } else {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `✅ Assets generados, pero no pude guardar la campaña automáticamente.\n\n${campaignRes.error || 'Error desconocido'}`
                    }])
                }
            } else {
                // Show detailed error message
                const errorMsg = res.error || 'Error desconocido al generar assets.'
                // Try to extract more info if available
                const details = res.details || ''

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Error al generar assets.\n\n${errorMsg}\n${details ? `\nDetalles: ${details}` : ''}\n\n💡 Intenta:\n• Ser más específico en tu descripción\n• Usar un mensaje más corto`
                }])
            }
        } catch (error: any) {
            console.error('Error en handleUseInCampaign:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error crítico en generación.\n\nError: ${error.message || 'Desconocido'}\n\n💡 Por favor intenta de nuevo o contacta soporte si el problema persiste.`
            }])
        } finally {
            setIsGenerating(false)
        }
    }


    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Load sessions on mount
    useEffect(() => {
        loadSessions()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const loadSessions = async () => {
        setIsLoadingHistory(true)
        setLoadError(false)
        try {
            const res = await getAISessions()
            if (res.success && res.chats) {
                setSessions(res.chats)
            } else {
                console.error('Error loading sessions:', res.error)
                setLoadError(true)
            }
        } catch (error) {
            console.error('Exception loading sessions:', error)
            setLoadError(true)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([{ role: 'assistant', content: '¡Hola! Soy tu Director Creativo de IA. ¿En qué trabajamos hoy? 🚀' }])
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
            // Convert DB messages to UI messages
            const uiMessages = res.chat.messages.map((m: any) => ({
                role: m.role,
                content: m.content
            }))
            setMessages(uiMessages.length > 0 ? uiMessages : [{ role: 'assistant', content: 'Sesión vacía.' }])
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
        if (!prompt.trim()) return

        const userText = prompt
        const userMsg = { role: 'user', content: userText }

        // Optimistic update
        setMessages(prev => [...prev, userMsg])
        setPrompt('')
        setIsGenerating(true)

        try {
            // 1. Ensure Session Exists
            let sessionId = currentSessionId
            if (!sessionId) {
                const newSessionRes = await createAISession(mode, userText)
                if (newSessionRes.success && newSessionRes.chat) {
                    sessionId = newSessionRes.chat.id
                    setCurrentSessionId(sessionId)
                    loadSessions() // Refresh list to show new chat
                } else {
                    console.error('Error creating session:', newSessionRes.error)
                    // Optional: Show error to user via toast or message
                }
            }

            // 2. Save User Message (background)
            if (sessionId) {
                saveAIMessage(sessionId, 'user', userText)
            }

            // 3. Get AI Response
            // Only send recent history to AI to save tokens context
            const historyForAI = messages.slice(-10)

            const response = await chatWithPublicityAgent([...historyForAI, { role: 'user', content: userText }], 'MX')

            let aiContent = 'Tuve un problema. Intenta de nuevo.'
            if (response.success && response.message) {
                aiContent = response.message
            }

            // 4. Update UI with AI Response
            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }])

            // 5. Save AI Message
            if (sessionId) {
                await saveAIMessage(sessionId, 'assistant', aiContent)
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.' }])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAutoPilot = async () => {
        setIsGenerating(true)
        setMessages(prev => [...prev, { role: 'user', content: '✨ Generando Campaña Viral Automática...' }])

        // Create session if needed
        let sessionId = currentSessionId
        if (!sessionId) {
            const newSessionRes = await createAISession('STRATEGY', 'Piloto Automático')
            if (newSessionRes.success && newSessionRes.chat) {
                sessionId = newSessionRes.chat.id
                setCurrentSessionId(sessionId)
                loadSessions()
            }
        }

        try {
            const res = await suggestCampaignFromInventory('MX')
            if (res.success && res.campaignData) {
                const data = res.campaignData
                const content = `**Estrategia Viral Detectada:** ${data.strategy}\n\n**Copy Sugerido:**\n"${data.caption}"\n\n**Script de Video:**\n${data.videoScript}`

                setMessages(prev => [...prev, { role: 'assistant', content }])

                if (sessionId) {
                    await saveAIMessage(sessionId, 'user', 'Generar Campaña Automática')
                    await saveAIMessage(sessionId, 'assistant', content)
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'No pude generar la campaña automática.' }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error en Piloto Automático.' }])
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/5 flex-col relative">

            {/* 🆕 TOP NAVBAR */}
            <div className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    {/* Brand */}


                    {/* Navigation Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNewChat}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition border border-white/5"
                        >
                            <Plus className="w-3.5 h-3.5" /> Nuevo Chat
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-white/5 ${showHistory ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-white/5 hover:bg-white/10 text-zinc-300'}`}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Historial</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                            </button>

                            {/* 📂 HISTORY DROPDOWN (Floating) */}
                            {showHistory && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1D21] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Chats Recientes</span>
                                        <button onClick={() => loadSessions()} className="p-1 hover:text-white text-zinc-500 rounded"><RefreshCw className="w-3 h-3" /></button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                        {sessions.length === 0 && !isLoadingHistory && (
                                            <div className="p-4 text-center text-xs text-zinc-600">No hay historial</div>
                                        )}
                                        {sessions.map(session => (
                                            <button
                                                key={session.id}
                                                onClick={() => handleSelectSession(session.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left transition group ${currentSessionId === session.id ? 'bg-purple-500/10 text-purple-300' : 'hover:bg-white/5 text-zinc-400'}`}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                                                <span className="truncate flex-1">{session.name}</span>
                                                <div onClick={(e) => handleDeleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">
                                                    <Trash2 className="w-3 h-3" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAutoPilot}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-95 transition"
                    >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Campaña Automática
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115] relative z-0">
                {/* Chat/Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
                                {msg.role === 'user' ? <User className='w-4 h-4 text-white' /> : <Sparkles className="w-4 h-4 text-white" />}
                            </div>
                            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-[#1A1D21] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                                    {msg.content}
                                    {/* 🎬 VIDEO PREVIEW */}
                                    {msg.videoUrl && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 relative group/video">
                                            <video
                                                src={msg.videoUrl}
                                                controls
                                                className="w-full aspect-video object-cover bg-black"
                                                poster="/placeholder-video.jpg" // Optional
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] text-white backdrop-blur-sm">
                                                AI Video (Preview)
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'assistant' && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                        <ActionButton icon={<Copy className="w-3 h-3" />} label="Copiar" onClick={() => navigator.clipboard.writeText(msg.content)} />
                                        <ActionButton
                                            icon={<Check className="w-3 h-3" />}
                                            label="Usar en Campaña"
                                            onClick={() => handleUseInCampaign(messages)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
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

                {/* Input Area */}
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
                        <button
                            onClick={handleSend}
                            disabled={!prompt.trim() || isGenerating}
                            className={`p-2 rounded-xl transition shrink-0 ${prompt.trim() && !isGenerating ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
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
