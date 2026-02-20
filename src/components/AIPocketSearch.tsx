'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, X, ChevronRight, Search, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface AIPocketSearchProps {
    context: 'MARKET' | 'MAP'
    onFilterChange?: (filters: any) => void
    onResultsFound?: (results: any[]) => void
    placeholder?: string
}

export const AIPocketSearch: React.FC<AIPocketSearchProps> = ({
    context,
    onFilterChange,
    onResultsFound,
    placeholder = "Dime qué buscas..."
}) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputValue.trim()) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsTyping(true)

        try {
            // 1. Interpretación / Diálogo
            const apiPath = context === 'MARKET' ? '/api/ai/search' : '/api/ai/analyze-problem'
            const response = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    context, // Solo para market
                    categories: context === 'MAP' ? [] : undefined, // Esto se llenará en el cliente si es necesario
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            })

            const data = await response.json()

            if (data.isConversational && data.nextQuestion) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion }])
            } else {
                // Encontró filtros finales o es una respuesta directa
                if (data.aiReasoning) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.aiReasoning }])
                }

                // Si es Deep Search, llamar al otro endpoint
                if (data.isDeepSearch) {
                    const deepRes = await fetch('/api/ai/deep-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: userMessage, context })
                    })
                    const deepData = await deepRes.json()
                    if (onResultsFound) onResultsFound(deepData.results)
                }

                if (onFilterChange) onFilterChange(data)

                // Auto-cerrar después de un momento si ya terminó
                setTimeout(() => setIsOpen(false), 3000)
            }

        } catch (error) {
            console.error('Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, tuve un problema analizando eso. ¿Puedes repetirlo?" }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <div className={`relative w-full max-w-2xl mx-auto transition-all duration-300 ${isOpen ? 'z-50' : 'z-10'}`}>
            <div
                className={`bg-white/10 Backdrop-blur-xl border border-white/20 rounded-full shadow-2xl overflow-hidden flex items-center p-1 transition-all ${isOpen ? 'rounded-2xl' : 'rounded-full'}`}
            >
                <div className="pl-4 text-blue-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-white/50 text-lg"
                />

                <button
                    onClick={() => handleSend()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-transform active:scale-90"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-4 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <span className="text-sm font-medium text-white/70 flex items-center gap-2 uppercase tracking-widest">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Asesor Experto CarMatch
                            </span>
                            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[100px]"
                        >
                            {messages.length === 0 && (
                                <div className="text-center py-8 opacity-40">
                                    <Search className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">Inicia una charla para encontrar tu nave ideal</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${m.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                                        }`}>
                                        {m.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none animate-pulse">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-blue-600/10 text-blue-400 text-[10px] text-center uppercase tracking-tighter">
                            Diseñado para encontrar resultados inteligentes en segundos
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
