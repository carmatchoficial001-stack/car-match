"use client"

import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'

const LANGUAGES = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'nah', name: 'Náhuatl', flag: '🦅' },
    { code: 'myn', name: 'Maya', flag: '🐆' },
]

export default function LanguageSelectorPublic() {
    const { locale, setLocale } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0]

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition text-sm font-medium"
            >
                <span className="text-xl">{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.name}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface/95 backdrop-blur-xl border border-surface-highlight rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLocale(lang.code as any)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition hover:bg-primary-700/20 ${locale === lang.code
                                    ? 'bg-primary-700/30 text-primary-400'
                                    : 'text-text-primary hover:text-primary-300'
                                    }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="font-medium">{lang.name}</span>
                                {locale === lang.code && (
                                    <svg className="w-5 h-5 ml-auto text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
