'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import {
    Settings,
    ChevronLeft,
    Globe,
    Headset,
    Bell,
    BellOff,
    LogOut,
    Check
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { locale, setLocale, t } = useLanguage()
    const { isSubscribed, subscribe, permission } = usePushNotifications()

    if (status === 'unauthenticated') {
        router.push('/auth')
        return null
    }

    const handleSignOut = async () => {
        try {
            // 🔥 CIERRE DE SESIÓN SIMULADO (Soft Logout)
            document.cookie = "soft_logout=true; Path=/; Max-Age=31536000" // 1 año
            localStorage.setItem('soft_logout', 'true')
            window.location.href = '/'
        } catch (error) {
            console.error("Error during soft sign out:", error)
            window.location.href = '/'
        }
    }

    const languages = [
        { code: 'es', flag: '🇪🇸', name: 'Español' },
        { code: 'en', flag: '🇺🇸', name: 'English' },
        { code: 'pt', flag: '🇧🇷', name: 'Português' },
        { code: 'fr', flag: '🇫🇷', name: 'Français' },
        { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
        { code: 'it', flag: '🇮🇹', name: 'Italiano' },
        { code: 'zh', flag: '🇨🇳', name: '中文' },
        { code: 'ja', flag: '🇯🇵', name: '日本語' },
        { code: 'ru', flag: '🇷🇺', name: 'Русский' },
        { code: 'ko', flag: '🇰🇷', name: '한국어' },
        { code: 'ar', flag: '🇸🇦', name: 'العربية' },
        { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
        { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
        { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
        { code: 'pl', flag: '🇵🇱', name: 'Polski' },
        { code: 'sv', flag: '🇸🇪', name: 'Svenska' },
        { code: 'id', flag: '🇮🇩', name: 'Bahasa' },
        { code: 'th', flag: '🇹🇭', name: 'ไทย' },
        { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
        { code: 'ur', flag: '🇵🇰', name: 'اردو' },
        { code: 'he', flag: '🇮🇱', name: 'עברית' },
    ]

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header / Navigation */}
            <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-surface-highlight px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black italic tracking-tight uppercase flex items-center gap-2">
                        <Settings className="text-primary-500" size={20} />
                        {t('settings.title')}
                    </h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            <main className="max-w-2xl mx-auto p-4 space-y-8 mt-4">
                {/* Idiomas */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Globe size={18} className="text-primary-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary opacity-60">{t('settings.select_language')}</h2>
                    </div>
                    {/* Vertical scrollable language list */}
                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLocale(lang.code as any)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${locale === lang.code
                                    ? 'bg-primary-900/20 border-primary-500 text-primary-400 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                                    : 'bg-surface border-surface-highlight text-text-primary hover:border-text-secondary/30 hover:bg-white/5 active:scale-[0.98]'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{lang.flag}</span>
                                    <span className={`font-bold ${locale === lang.code ? 'text-primary-400' : 'text-text-primary'}`}>
                                        {lang.name}
                                    </span>
                                </div>
                                {locale === lang.code && <Check size={20} className="text-primary-500" />}
                            </button>
                        ))}
                    </div>

                    <style jsx>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 5px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.02);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(var(--primary-rgb), 0.2);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(var(--primary-rgb), 0.4);
                        }
                    `}</style>
                </section>

                {/* Notificaciones y Soporte */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Settings size={18} className="text-primary-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary opacity-60">{t('settings.preferences_help')}</h2>
                    </div>
                    <div className="space-y-2">
                        <button
                            onClick={() => subscribe()}
                            disabled={isSubscribed || permission === 'denied'}
                            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isSubscribed
                                ? 'bg-green-900/10 border-green-500/30 text-green-400'
                                : 'bg-surface border-surface-highlight text-text-primary hover:border-text-secondary/30'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${isSubscribed ? 'bg-green-500/20' : 'bg-primary-500/10'}`}>
                                    {isSubscribed ? <Bell size={22} /> : <BellOff size={22} className="text-primary-500" />}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">{t('settings.push_notifications')}</p>
                                    <p className="text-xs text-text-secondary">
                                        {isSubscribed ? t('settings.push_active') : t('settings.push_inactive')}
                                    </p>
                                </div>
                            </div>
                            {!isSubscribed && permission !== 'denied' && (
                                <span className="text-xs font-black uppercase tracking-tighter bg-primary-600 text-white px-3 py-1 rounded-full">{t('settings.activate')}</span>
                            )}
                        </button>

                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-surface-highlight bg-surface text-text-primary hover:border-text-secondary/30 transition-all"
                        >
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Headset size={22} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold">{t('settings.support_title')}</p>
                                <p className="text-xs text-text-secondary">
                                    {t('settings.support_desc')}
                                </p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Account Section */}
                <section className="pt-4 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <LogOut size={18} className="text-red-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary opacity-60">{t('settings.account_section')}</h2>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <div className="p-2 rounded-xl bg-red-500/10">
                            <LogOut size={22} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold">{t('common.logout')}</p>
                            <p className="text-xs opacity-60">Cerrar sesión de forma segura</p>
                        </div>
                    </button>
                </section>

                {/* Footer Info */}
                <div className="text-center pt-8 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">CarMatch v0.1.2</p>
                    <p className="text-[10px] text-text-secondary opacity-40">© 2026 Todos los derechos reservados</p>
                </div>
            </main>
        </div>
    )
}
