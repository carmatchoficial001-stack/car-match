'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, X, ChevronRight, Search, MapPin, User, Bot, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface MapStoreChatProps {
    onFilterChange?: (filters: any) => void
    onResultsFound?: (results: any[]) => void
    placeholder?: string
    userCity?: string
}

export const MapStoreChat: React.FC<MapStoreChatProps> = ({
    onFilterChange,
    onResultsFound,
    placeholder,
    userCity
}) => {
    const { t } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [turnCount, setTurnCount] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputValue.trim() || isTyping) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsTyping(true)
        setTurnCount(prev => prev + 1)

        try {
            const response = await fetch('/api/ai/analyze-problem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    categories: [], // El backend los inyecta si le pasamos la taxonomía o los conoce
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    turn: turnCount + 1
                })
            })

            const data = await response.json()

            if (data.isConversational && data.nextQuestion && turnCount < 4) {
                // Sigue la charla
                setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion }])
            } else {
                // Resultados finales
                if (data.explanation) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.explanation }])
                } else if (data.aiReasoning) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.aiReasoning }])
                }

                if (onFilterChange) onFilterChange(data)

                // Si hay resultados de Deep Search (opcional)
                if (data.isDeepSearch) {
                    const deepRes = await fetch('/api/ai/deep-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: userMessage, context: 'MAP' })
                    })
                    const deepData = await deepRes.json()
                    if (onResultsFound) onResultsFound(deepData.results)
                }

                // Dar un feedback de éxito
                setMessages(prev => [...prev, { role: 'assistant', content: "¡Listo! He filtrado el mapa para ti. 📍" }])

                // Reset turns if finished
                setTurnCount(0)
            }

        } catch (error) {
            console.error('Map Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Ups, algo salió mal. ¿Podrías decirme de nuevo qué necesitas?" }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <div className="w-full flex flex-col gap-4">


            {/* 💬 Chat Container */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">

                {/* Historial */}
                <div
                    ref={scrollRef}
                    className="h-[200px] overflow-y-auto p-4 space-y-4 custom-scrollbar"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                            <HelpCircle className="w-12 h-12 text-blue-400" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">¿En qué te puedo ayudar hoy?</p>
                                <p className="text-xs text-white/60">Describe un problema mecánico, busca un servicio o pide una recomendación.</p>
                            </div>

                            {/* Sugerencias rápidas */}
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                {['Mi carro no prende', 'Busco desponchadora', 'Taller de frenos', 'Ruido al frenar'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            setInputValue(suggestion)
                                            inputRef.current?.focus()
                                        }}
                                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white/70 transition-colors uppercase font-bold tracking-tighter"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={i}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                                : 'bg-white/10 text-white border border-white/10 rounded-tl-none'
                                }`}>
                                {m.content}
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 px-4 py-4 rounded-2xl rounded-tl-none border border-white/10">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSend}
                    className="p-3 border-t border-white/10 bg-white/5 flex items-center gap-2"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={placeholder || "Cuéntame tu problema..."}
                        className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-white placeholder-white/30 text-sm font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-white/10 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-lg shadow-blue-900/20"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>


        </div>
    )
}
