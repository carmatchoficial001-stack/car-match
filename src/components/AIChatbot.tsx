'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageCircle, Users, ChevronRight, Headset } from 'lucide-react'
import { findBestResponse } from '@/lib/chatbot-data'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    actionLink?: string
    actionText?: string
    timestamp: Date
}

export default function AIChatbot() {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: t('chat.welcome'),
            sender: 'bot',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!inputValue.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsTyping(true)

        setTimeout(() => {
            const response = findBestResponse(userMsg.text)

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.response,
                sender: 'bot',
                actionLink: response.actionLink,
                actionText: response.actionText,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botMsg])
            setIsTyping(false)
        }, 1000 + Math.random() * 1000)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend()
    }

    useEffect(() => {
        const handleOpen = () => setIsOpen(true)
        window.addEventListener('open-chatbot', handleOpen)
        return () => window.removeEventListener('open-chatbot', handleOpen)
    }, [])

    return (
        <>
            {/* El botón flotante ha sido removido por solicitud del usuario */}
            {/* para integrarse en el menú desplegable */}

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="fixed bottom-24 md:bottom-6 right-6 z-50 w-[calc(100vw-3rem)] md:w-[400px] h-[500px] max-h-[calc(100vh-14rem)] bg-background border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="bg-surface p-4 flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-700/20 p-2 rounded-full">
                                <Users className="text-primary-700" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary text-sm">{t('common.support')}</h3>
                                <p className="text-xs text-primary-700 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary-700 rounded-full"></span>
                                    {t('common.online_team')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-text-primary transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                        ? 'bg-primary-700 text-text-primary rounded-br-none'
                                        : 'bg-surface text-text-secondary rounded-bl-none border border-white/10'
                                        }`}
                                >
                                    <p className="whitespace-pre-line">{msg.text}</p>

                                    {msg.actionLink && (
                                        <a
                                            href={msg.actionLink}
                                            className="mt-3 flex items-center justify-between bg-black/20 hover:bg-black/40 p-2 rounded-lg transition text-xs font-medium text-primary-700 border border-primary-700/20"
                                        >
                                            {msg.actionText}
                                            <ChevronRight size={14} />
                                        </a>
                                    )}

                                    <span className="text-[10px] opacity-50 block mt-1 text-right">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface p-3 rounded-2xl rounded-bl-none border border-white/10 flex gap-1">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-surface border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('common.typing_placeholder')}
                                className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-700 transition placeholder:text-gray-600"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary p-2 rounded-xl transition"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
