'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Sparkles, User, Send, ImageIcon, ImagePlus, Zap,
    Type, Video, Hash, MousePointer2, Copy, Check, Star,
    MessageSquare, Plus, Trash2, History, RefreshCw
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
                        content: `✅ ¡Campaña creada exitosamente!\n\n📋 **${campaignRes.campaign.title}**\n\n🎯 Ahora puedes verla en la sección Campañas.\n💡 Desde ahí puedes editar cualquier elemento con IA.`
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
                const detailsMsg = res.details ? `\n\nDetalles técnicos: ${res.details}` : ''
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Error al generar assets.\n\n${errorMsg}${detailsMsg}\n\n💡 Intenta:\n• Ser más específico en tu descripción\n• Usar un mensaje más corto\n• Intentar de nuevo en unos segundos`
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
    }

    const handleSelectSession = async (sessionId: string) => {
        if (currentSessionId === sessionId) return

        setIsLoadingHistory(true)
        setCurrentSessionId(sessionId)

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
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/5">
            {/* Sidebar Tools */}
            <div className="w-16 md:w-64 border-r border-white/5 bg-zinc-900/50 flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm hidden md:block tracking-wide">AI Studio</span>
                    </div>

                </div>

                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <Plus className="w-3.5 h-3.5" /> <span>Nuevo Chat</span>
                    </button>
                </div>

                <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Historial</div>
                        <button
                            onClick={() => loadSessions()}
                            disabled={isLoadingHistory}
                            className={`p-1 hover:bg-white/10 rounded transition ${isLoadingHistory ? 'animate-spin' : ''}`}
                            title="Actualizar historial"
                        >
                            <RefreshCw className="w-3 h-3 text-zinc-500 hover:text-white" />
                        </button>
                    </div>
                    {loadError && (
                        <div className="px-2 py-2 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 flex items-center gap-2">
                            <span>Error al cargar</span>
                            <button onClick={() => loadSessions()} className="underline hover:text-red-300">Reintentar</button>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => handleSelectSession(session.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-left transition-all group relative ${currentSessionId === session.id
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <History className="w-3.5 h-3.5 shrink-0 opacity-50" />
                                <span className="truncate flex-1">{session.name}</span>
                                <div
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition"
                                    title="Eliminar chat"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </div>
                            </button>
                        ))}
                        {sessions.length === 0 && !isLoadingHistory && !loadError && (
                            <div className="text-center py-4 text-[10px] text-zinc-600 italic">
                                Sin historial reciente
                            </div>
                        )}
                        {isLoadingHistory && sessions.length === 0 && (
                            <div className="text-center py-4 text-[10px] text-zinc-600 animate-pulse">
                                Cargando...
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleAutoPilot}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-orange-900/20"
                    >
                        <Zap className="w-4 h-4" />
                        <span>Piloto Automático</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115]">
                {/* Top Bar / Filters */}
                <div className="h-14 border-b border-white/5 flex items-center justify-end px-4 bg-zinc-900/30 backdrop-blur-sm">
                    {isLoadingHistory && <span className="text-xs text-zinc-500 animate-pulse">Cargando...</span>}
                </div>

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
                    <div className="relative flex items-end gap-2 bg-[#1A1D21] border border-white/10 rounded-2xl p-2 focus-within:border-purple-500/50 transition-all shadow-inner">
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

function SidebarItem({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${active
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <span className={active ? 'text-purple-400' : 'text-zinc-400'}>{icon}</span>
            <span className="hidden md:inline">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] hidden md:block" />}
        </button>
    )
}

function SelectPill({ label, value, options, onChange }: any) {
    return (
        <div className="flex items-center gap-2 bg-[#1A1D21] border border-white/5 pl-3 pr-1 py-1 rounded-lg shrink-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-white appearance-none outline-none cursor-pointer hover:bg-white/5 rounded px-2 py-1"
            >
                {options.map((opt: string) => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
            </select>
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
