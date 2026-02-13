'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Sparkles, User, Send, ImageIcon, ImagePlus, Zap,
    Type, Video, Hash, MousePointer2, Copy, Check, Star
} from 'lucide-react'
import { chatWithPublicityAgent, suggestCampaignFromInventory } from '@/app/admin/actions/ai-content-actions'

type AIMode = 'CHAT' | 'COPYWRITER' | 'IMAGE_GEN' | 'STRATEGY'

export default function AIStudio() {
    const [mode, setMode] = useState<AIMode>('CHAT')
    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: '¡Hola! Soy tu Director Creativo de IA. ¿En qué trabajamos hoy? 🚀' }
    ])
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedTone, setSelectedTone] = useState('Professional')
    const [selectedPlatform, setSelectedPlatform] = useState('Instagram')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!prompt.trim()) return

        const userMsg = { role: 'user', content: prompt }
        setMessages(prev => [...prev, userMsg])
        setPrompt('')
        setIsGenerating(true)

        try {
            // Enhanced context based on selected tools
            const contextPrompt = `[Context: Tone=${selectedTone}, Platform=${selectedPlatform}, Mode=${mode}] ${userMsg.content}`
            const apiMsg = { role: 'user', content: contextPrompt }

            const response = await chatWithPublicityAgent([...messages, apiMsg], 'MX')

            if (response.success && response.message) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.message }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Tuve un problema. Intenta de nuevo.' }])
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
        try {
            const res = await suggestCampaignFromInventory('MX')
            if (res.success && res.campaignData) {
                const data = res.campaignData
                const content = `**Estrategia Viral Detectada:** ${data.strategy}\n\n**Copy Sugerido:**\n"${data.caption}"\n\n**Script de Video:**\n${data.videoScript}`
                setMessages(prev => [...prev, { role: 'assistant', content }])
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
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm hidden md:block tracking-wide">AI Studio Pro</span>
                </div>

                <div className="p-2 space-y-1 overflow-y-auto flex-1">
                    <SidebarItem
                        icon={<Sparkles />}
                        label="Chat Creativo"
                        active={mode === 'CHAT'}
                        onClick={() => setMode('CHAT')}
                    />
                    <SidebarItem
                        icon={<Type />}
                        label="Copywriter"
                        active={mode === 'COPYWRITER'}
                        onClick={() => setMode('COPYWRITER')}
                    />
                    <SidebarItem
                        icon={<ImageIcon />}
                        label="Generador Imagen"
                        active={mode === 'IMAGE_GEN'}
                        onClick={() => setMode('IMAGE_GEN')}
                    />
                    <SidebarItem
                        icon={<Hash />}
                        label="Estrategia"
                        active={mode === 'STRATEGY'}
                        onClick={() => setMode('STRATEGY')}
                    />
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleAutoPilot}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-orange-900/20"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="hidden md:inline">Piloto Automático</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115]">
                {/* Top Bar / Filters */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                        <SelectPill
                            label="Tono"
                            value={selectedTone}
                            options={['Professional', 'Viral', 'Funny', 'Luxury', 'Urgent']}
                            onChange={setSelectedTone}
                        />
                        <SelectPill
                            label="Plataforma"
                            value={selectedPlatform}
                            options={['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email']}
                            onChange={setSelectedPlatform}
                        />
                    </div>
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
                                        <ActionButton icon={<Check className="w-3 h-3" />} label="Usar en Campaña" onClick={() => alert('Próximamente: Crear campaña desde respuesta')} />
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
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
