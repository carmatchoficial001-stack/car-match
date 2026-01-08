"use client"

import { Logo } from "@/components/Logo"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useLanguage } from "@/contexts/LanguageContext"
import PWAInstallModal from "@/components/PWAInstallModal"
import NotificationsDropdown from "@/components/NotificationsDropdown"
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { getWeightedHomePath } from "@/lib/navigation"
import { ThumbsUp, Headset } from "lucide-react"

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, status } = useSession()
    const { t, locale, setLocale } = useLanguage()
    const [showMenu, setShowMenu] = useState<boolean | string>(false)
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const [favoritesCount, setFavoritesCount] = useState(0)
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'auto'>('auto')
    const { triggerInstall, isInstallable, isStandalone } = usePWAInstall()

    const handleIOSClick = () => {
        setSelectedPlatform('ios')
        setShowInstallModal(true)
    }

    const handleAndroidClick = async () => {
        // Intentar instalación nativa "Magic Install"
        const installed = await triggerInstall()

        // Si no se pudo (o es iOS/Desktop sin soporte), mostrar manual
        if (!installed) {
            setSelectedPlatform('android')
            setShowInstallModal(true)
        }
    }

    const isActive = (path: string) => pathname === path

    const handleSignOut = async () => {
        try {
            // Un cierre de sesión limpio y redirección forzada
            await signOut({
                callbackUrl: '/',
                redirect: true
            })
        } catch (error) {
            console.error("Error durante el cierre de sesión:", error)
            // Fallback agresivo: Borrado manual y recarga
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            window.location.href = '/'
        }
    }

    // Fetch badges logic (Moved from HeaderBadges)
    useEffect(() => {
        if (status !== 'authenticated') return

        const fetchCounts = async () => {
            // 1. Notificaciones
            try {
                const resNotifs = await fetch('/api/notifications?unreadOnly=true')
                if (resNotifs.ok) {
                    const notifs = await resNotifs.json()
                    setUnreadNotifications(notifs.length)
                }
            } catch (error) {
                // Silent fail for network errors during navigation
                if (process.env.NODE_ENV === 'development') {
                    // console.warn('Silent fetch error (Notifs):', error)
                }
            }

            // 2. Mensajes
            try {
                const resChats = await fetch('/api/chats')
                if (resChats.ok) {
                    const chats = await resChats.json()
                    const count = chats.filter((chat: any) =>
                        chat.lastMessage &&
                        !chat.lastMessage.isRead &&
                        chat.lastMessage.senderId === chat.otherUser.id
                    ).length
                    setUnreadMessages(count)
                }
            } catch (error) {
                // Silent fail
            }

            // 3. Favoritos
            try {
                const resFavs = await fetch('/api/favorites')
                if (resFavs.ok) {
                    const data = await resFavs.json()
                    setFavoritesCount(data.favorites?.length || 0)
                }
            } catch (error) {
                // Silent fail
            }
        }

        fetchCounts()

        // Escuchar actualizaciones inmediatas (desde Swipe)
        const handleFavUpdate = () => fetchCounts()
        window.addEventListener('favoriteUpdated', handleFavUpdate)

        const interval = setInterval(fetchCounts, 10000) // Polling cada 10s
        return () => {
            clearInterval(interval)
            window.removeEventListener('favoriteUpdated', handleFavUpdate)
        }
    }, [status])

    const totalUnread = unreadMessages + unreadNotifications

    return (
        <header className="sticky top-0 z-50 bg-surface border-b border-surface-highlight shadow-lg">
            <div className="container mx-auto px-2 md:px-4 py-2 md:py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div
                        onClick={() => {
                            if (session) {
                                router.push(getWeightedHomePath())
                            } else {
                                router.push('/')
                            }
                        }}
                        className="hover:opacity-80 transition cursor-pointer"
                    >
                        <Logo
                            className="w-12 h-12 md:w-20 md:h-20"
                            showText={false}
                            textClassName="text-3xl font-bold text-white hidden sm:block"
                        />
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Navegación - Oculta en móvil para usar MobileNav */}
                        <nav className="hidden md:flex items-center gap-1 md:gap-2">
                            <Link
                                href="/swipe"
                                className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition flex items-center gap-2 ${isActive("/swipe")
                                    ? "bg-primary-700 text-text-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-highlight"
                                    }`}
                            >
                                <span className="text-lg md:hidden">🔥</span>
                                <span className="hidden md:block">{t('nav.carmatch')}</span>
                            </Link>
                            <Link
                                href="/market"
                                className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition flex items-center gap-2 ${isActive("/market")
                                    ? "bg-primary-700 text-text-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-highlight"
                                    }`}
                            >
                                <span className="text-xl md:hidden">🚘</span>
                                <span className="hidden md:block">{t('nav.marketcar')}</span>
                            </Link>
                            <Link
                                href="/map"
                                className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition flex items-center gap-2 ${isActive("/map")
                                    ? "bg-primary-700 text-text-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-highlight"
                                    }`}
                            >
                                <span className="text-xl md:hidden">🗺️</span>
                                <span className="hidden md:block">{t('nav.mapstore')}</span>
                            </Link>
                        </nav>

                        {/* Download Buttons - Modern pill design */}
                        {!isStandalone && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleIOSClick}
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black border border-surface-highlight text-text-primary rounded-full text-xs font-semibold hover:bg-gray-800 transition shadow-lg active:scale-95"
                                    title="Instalar en iOS"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                    </svg>
                                    <span>{t('common.ios')}</span>
                                </button>
                                <button
                                    onClick={handleAndroidClick}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-surface-highlight text-text-primary rounded-full text-xs font-semibold hover:bg-gray-800 transition shadow-lg active:scale-95"
                                    title="Instalar en Android"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                    </svg>
                                    <span>{t('common.android')}</span>
                                </button>
                            </div>
                        )}

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(showMenu === 'lang' ? false : 'lang')}
                                className="p-1 md:p-2 rounded-lg hover:bg-surface-highlight text-text-secondary hover:text-text-primary transition"
                                title="Cambiar idioma"
                            >
                                <span className="text-xl leading-none">
                                    {
                                        {
                                            es: '🇪🇸', en: '🇺🇸', pt: '🇧🇷', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
                                            zh: '🇨🇳', ja: '🇯🇵', ru: '🇷🇺', ko: '🇰🇷', ar: '🇸🇦', hi: '🇮🇳',
                                            tr: '🇹🇷', nl: '🇳🇱', pl: '🇵🇱', sv: '🇸🇪', id: '🇮🇩', th: '🇹🇭',
                                            vi: '🇻🇳', ur: '🇵🇰', he: '🇮🇱'
                                        }[locale] || '🌐'
                                    }
                                </span>
                            </button>

                            {showMenu === 'lang' && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-[300px] md:w-[480px] bg-surface rounded-xl shadow-xl border border-surface-highlight overflow-hidden z-50">
                                        <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-1 max-h-[500px] overflow-y-auto">
                                            {[
                                                { code: 'es', flag: '🇪🇸', name: 'Español' },
                                                { code: 'en', flag: '🇺🇸', name: 'English' },
                                                { code: 'pt', flag: '🇧🇷', name: 'Português' },
                                                { code: 'fr', flag: '🇫🇷', name: 'Français' },
                                                { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
                                                { code: 'it', flag: '🇮🇹', name: 'Italiano' },
                                                { code: 'ru', flag: '🇷🇺', name: 'Русский' },
                                                { code: 'zh', flag: '🇨🇳', name: '中文' },
                                                { code: 'ja', flag: '🇯🇵', name: '日本語' },
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
                                            ].map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => { setLocale(lang.code as any); setShowMenu(false) }}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-highlight transition text-left
                                                        ${locale === lang.code ? 'bg-primary-700/10 text-primary-400' : 'text-text-primary'}
                                                    `}
                                                >
                                                    <span className="text-xl">{lang.flag}</span>
                                                    <span className="font-medium text-sm truncate">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Notifications Bell (Independent from user menu) */}
                        {session && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(showMenu === 'notifications' ? false : 'notifications')}
                                    className="relative p-1 md:p-2 rounded-lg hover:bg-surface-highlight transition"
                                    title="Notificaciones"
                                >
                                    <svg className="w-6 h-6 text-text-secondary hover:text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {/* Badge de notificaciones no leídas */}
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                <NotificationsDropdown
                                    isOpen={showMenu === 'notifications'}
                                    onClose={() => setShowMenu(false)}
                                />
                            </div>
                        )}

                        {/* User Profile */}
                        {status === 'loading' ? (
                            <div className="w-8 h-8 bg-surface-highlight rounded-lg animate-pulse" />
                        ) : session ? (
                            <div className="flex items-center">
                                {/* Quitamos HeaderBadges, ahora está integrado en el menú */}

                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(showMenu === 'user' ? false : 'user')}
                                        className="flex items-center gap-1 md:gap-2 hover:bg-surface-highlight px-1.5 py-1 md:px-3 md:py-2 rounded-lg transition relative"
                                    >
                                        {/* Avatar con punto indicador de notificaciones */}
                                        <div className="relative">
                                            {session.user?.image ? (
                                                <img
                                                    src={session.user.image}
                                                    alt={session.user.name || "Usuario"}
                                                    className="w-8 h-8 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-sm font-bold text-text-primary">
                                                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                            {/* Indicador General (Solo si el menú está cerrado) */}
                                            {showMenu !== 'user' && totalUnread > 0 && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-surface rounded-full"></span>
                                            )}
                                        </div>

                                        <span className="text-text-primary font-medium hidden md:block">
                                            {session.user?.name}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-text-secondary transition-transform ${showMenu === 'user' ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showMenu === 'user' && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowMenu(false)}
                                            />

                                            <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-2xl border border-surface-highlight overflow-hidden z-50">
                                                <div className="py-2">
                                                    <Link
                                                        href="/profile"
                                                        className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface-highlight transition"
                                                        onClick={() => setShowMenu(false)}
                                                    >
                                                        <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span className="font-medium">{t('nav.profile')}</span>
                                                    </Link>

                                                    {/* 👑 PANEL DE ADMINISTRADOR */}
                                                    {(session.user as any).isAdmin && (
                                                        <Link
                                                            href="/admin"
                                                            className="flex items-center gap-3 px-4 py-3 bg-primary-900/10 text-primary-400 hover:bg-primary-900/20 transition"
                                                            onClick={() => setShowMenu(false)}
                                                        >
                                                            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <span className="font-bold">Panel de Control</span>
                                                        </Link>
                                                    )}

                                                    <Link
                                                        href="/my-businesses"
                                                        className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface-highlight transition"
                                                        onClick={() => setShowMenu(false)}
                                                    >
                                                        <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span className="font-medium">{t('nav.my_businesses')}</span>
                                                    </Link>

                                                    <Link
                                                        href="/messages"
                                                        className="flex items-center justify-between px-4 py-3 text-text-primary hover:bg-surface-highlight transition"
                                                        onClick={() => setShowMenu(false)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                            </svg>
                                                            <span className="font-medium">{t('nav.messages')}</span>
                                                        </div>
                                                        {unreadMessages > 0 && (
                                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                                {unreadMessages}
                                                            </span>
                                                        )}
                                                    </Link>

                                                    <Link
                                                        href="/favorites"
                                                        className="flex items-center justify-between px-4 py-3 text-text-primary hover:bg-surface-highlight transition"
                                                        onClick={() => setShowMenu(false)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg
                                                                className={`w-5 h-5 transition-colors ${favoritesCount > 0 ? 'text-primary-500 fill-primary-500' : 'text-primary-700'}`}
                                                                fill={favoritesCount > 0 ? 'currentColor' : 'none'}
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                            </svg>
                                                            <span className={`font-medium ${favoritesCount > 0 ? 'text-primary-500' : ''}`}>{t('nav.favorites')}</span>
                                                        </div>
                                                        {favoritesCount > 0 && (
                                                            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                                {favoritesCount}
                                                            </span>
                                                        )}
                                                    </Link>

                                                    <div className="border-t border-surface-highlight my-2"></div>

                                                    <Link
                                                        href="/credits"
                                                        className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface-highlight transition"
                                                        onClick={() => setShowMenu(false)}
                                                    >
                                                        <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium">{t('nav.credits')}</span>
                                                    </Link>

                                                    <button
                                                        onClick={() => {
                                                            window.dispatchEvent(new CustomEvent('open-chatbot'));
                                                            setShowMenu(false);
                                                        }}
                                                        className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface-highlight transition w-full"
                                                    >
                                                        <Headset size={20} className="text-primary-700" />
                                                        <span className="font-medium text-left">Soporte CarMatch</span>
                                                    </button>

                                                    <div className="border-t border-surface-highlight my-2"></div>

                                                    {!isStandalone && (
                                                        <button
                                                            onClick={() => {
                                                                const ua = navigator.userAgent.toLowerCase();
                                                                if (/iphone|ipad|ipod/.test(ua)) handleIOSClick();
                                                                else handleAndroidClick();
                                                                setShowMenu(false);
                                                            }}
                                                            className="flex items-center gap-3 px-4 py-3 text-primary-400 hover:bg-surface-highlight transition w-full md:hidden"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            <span className="font-bold whitespace-nowrap text-left text-sm">📥 Instalar CarMatch App</span>
                                                        </button>
                                                    )}

                                                    <div className="border-t border-surface-highlight my-2"></div>

                                                    <button
                                                        onClick={handleSignOut}
                                                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition w-full"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        <span className="font-medium">{t('common.logout')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="px-4 py-2 bg-primary-700 text-text-primary rounded-lg font-medium hover:bg-primary-600 transition"
                            >
                                {t('common.login')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* PWA Installation Modal */}
            <PWAInstallModal
                isOpen={showInstallModal}
                onClose={() => setShowInstallModal(false)}
                platform={selectedPlatform}
            />
        </header>
    )
}
