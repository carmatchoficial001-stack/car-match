'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, X, Search, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface MarketChatProps {
    onFilterChange?: (filters: any) => void
    onResultsFound?: (results: any[]) => void
    placeholder?: string
}

export const MarketChat: React.FC<MarketChatProps> = ({
    onFilterChange,
    onResultsFound,
    placeholder
}) => {
    const { t } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
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
            const response = await fetch('/api/ai/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    context: 'MARKET',
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    turn: turnCount + 1
                })
            })

            const data = await response.json()

            if (data.isConversational && data.nextQuestion && turnCount < 4) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion }])
            } else {
                if (data.aiReasoning) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.aiReasoning }])
                }

                if (onFilterChange) onFilterChange(data)

                if (data.isDeepSearch) {
                    const deepRes = await fetch('/api/ai/deep-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: userMessage, context: 'MARKET' })
                    })
                    const deepData = await deepRes.json()
                    if (onResultsFound) onResultsFound(deepData.results)
                }

                setMessages(prev => [...prev, { role: 'assistant', content: "¡Hecho! He actualizado tu búsqueda. 🚗✨" }])
                setTurnCount(0)
            }

        } catch (error) {
            console.error('Market Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Ups, algo salió mal. ¿Podrías decirme de nuevo qué buscas?" }])
        } finally {
            setIsTyping(false)
        }
    }

    const suggestions = [
        "Camioneta familiar",
        "Primer carro barato",
        "Pickup 4x4 diesel",
        "Auto para Uber"
    ]

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
                {/* History */}
                <div
                    ref={scrollRef}
                    className="h-[140px] overflow-y-auto p-4 space-y-3 custom-scrollbar"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-2 space-y-4">
                            <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                                {t('market.filters.ai_pocket_title') || 'Asesor Inteligente'}
                            </p>

                            <div className="flex flex-wrap justify-center gap-1.5">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            setInputValue(suggestion)
                                            inputRef.current?.focus()
                                        }}
                                        className="text-[9px] bg-white/10 hover:bg-blue-600 border border-white/10 px-3 py-1 rounded-full text-white transition-colors uppercase font-black tracking-tighter"
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
                            <div className={`max-w-[90%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                                : 'bg-white/10 text-white border border-white/10 rounded-tl-none font-medium'
                                }`}>
                                {m.content}
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10">
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
                        placeholder={placeholder || t('market.search_placeholder') || "Dime qué buscas..."}
                        className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-white placeholder-white/30 text-sm font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-white/10 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-lg shadow-blue-500/40 border border-white/20"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    )
}
