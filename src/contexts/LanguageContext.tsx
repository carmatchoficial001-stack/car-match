"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Locale = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'zh' | 'ja' | 'ru' | 'ko' | 'ar' | 'hi'
    | 'tr' | 'nl' | 'pl' | 'sv' | 'id' | 'th' | 'vi' | 'ur' | 'he'

interface LanguageContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
    isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Cache for loaded translations to avoid re-fetching
const translationCache: Partial<Record<Locale, any>> = {}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('es')
    const [translations, setTranslations] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadTranslations = useCallback(async (targetLocale: Locale) => {
        setIsLoading(true)
        try {
            if (translationCache[targetLocale]) {
                setTranslations(translationCache[targetLocale])
            } else {
                const dictionary = await import(`@/locales/${targetLocale}.json`)
                translationCache[targetLocale] = dictionary.default
                setTranslations(dictionary.default)
            }
            setLocaleState(targetLocale)
        } catch (error) {
            console.error(`Error loading translations for ${targetLocale}:`, error)
            // Fallback to ES if target fails
            if (targetLocale !== 'es') {
                await loadTranslations('es')
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const initLanguage = async () => {
            // 1. Check LocalStorage (User Preference)
            let initialLocale = localStorage.getItem('carmatch-locale') as Locale

            if (!initialLocale) {
                // 2. Check Browser Languages
                const browserLangs = navigator.languages ? navigator.languages : [navigator.language]
                const supportedLocales: Locale[] = ['es', 'en', 'pt', 'fr', 'de', 'it', 'zh', 'ja', 'ru', 'ko', 'ar', 'hi', 'tr', 'nl', 'pl', 'sv', 'id', 'th', 'vi', 'ur', 'he']

                for (const lang of browserLangs) {
                    if (!lang) continue
                    const code = lang.toLowerCase()

                    if (code.startsWith('es')) {
                        initialLocale = 'es'
                        break
                    }

                    const found = supportedLocales.find(key => code === key || code.startsWith(key + '-'))
                    if (found) {
                        initialLocale = found
                        break
                    }
                }
            }

            // Fallback
            if (!initialLocale) initialLocale = 'es'

            await loadTranslations(initialLocale)
        }

        initLanguage()
    }, [loadTranslations])

    const setLocale = async (newLocale: Locale) => {
        await loadTranslations(newLocale)
        localStorage.setItem('carmatch-locale', newLocale)
    }

    const t = useCallback((path: string, params?: Record<string, string>): string => {
        if (!translations) return path

        const keys = path.split('.')
        let current: any = translations

        for (const key of keys) {
            if (!current || current[key] === undefined) {
                // Durante el desarrollo, avisar de traducciones faltantes
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`Missing translation for key: ${path} in locale: ${locale}`)
                }
                return path
            }
            current = current[key]
        }

        if (typeof current !== 'string') return path

        let translated = current
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                translated = translated.replace(new RegExp(`{${key}}`, 'g'), value)
            })
        }

        return translated
    }, [translations, locale])

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, isLoading }}>
            {/* Opcional: mostrar un loader o simplemente nada hasta que las traducciones iniciales carguen */}
            {!translations && isLoading ? (
                <div className="fixed inset-0 bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
