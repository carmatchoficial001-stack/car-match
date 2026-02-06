"use client"

import { Logo } from "@/components/Logo"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { signOut, useSession } from "next-auth/react"
import { useLanguage } from "@/contexts/LanguageContext"
import PWAInstallModal from "@/components/PWAInstallModal"
import NotificationsDropdown from "@/components/NotificationsDropdown"
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { getWeightedHomePath } from "@/lib/navigation"
import { ThumbsUp, Headset, Flame, CarFront, Map, Bell, BellOff, Settings, ShieldCheck, Coins, Heart, MessageSquare, Briefcase, Smartphone } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { BUSINESS_CATEGORIES } from "@/lib/businessCategories"
import { useRestoreSessionModal } from "@/hooks/useRestoreSessionModal"

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, status, update } = useSession()
    const { t, locale, setLocale } = useLanguage()
    const isAdmin = (session?.user as any)?.isAdmin
    const [showMenu, setShowMenu] = useState<boolean | 'lang' | 'notifications' | 'user' | 'lang_inner'>(false)
    const [isSoftLogout, setIsSoftLogout] = useState(false)
    const { openModal } = useRestoreSessionModal()

    useEffect(() => {
        const hasCookie = document.cookie.includes('soft_logout=true')
        const hasStorage = localStorage.getItem('soft_logout') === 'true'
        const currentSoftLogout = hasCookie || hasStorage

        // 🔥 MODAL CONFIRMATION: Mostrar modal de confirmación si intenta acceder a rutas protegidas
        const protectedPaths = ['/profile', '/settings', '/messages', '/my-businesses', '/publish', '/admin', '/favorites', '/credits'];
        const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

        if (session && currentSoftLogout && isProtectedPath) {
            // En lugar de auto-restaurar, mostrar modal
            openModal(
                "Cerraste sesión hace un momento. ¿Deseas volver a activar tu cuenta para acceder a esta sección?",
                () => { /* La lógica de restauración ya está en el modal global */ }
            )
            setIsSoftLogout(true)
        } else {
            setIsSoftLogout(currentSoftLogout)
        }

    }, [pathname, session])


    // 🔥 ESCUCHAR RESTAURACIÓN MANUAL
    useEffect(() => {
        const handleRestore = () => {
            setIsSoftLogout(false)
        }
        window.addEventListener('session-restored', handleRestore)
        return () => window.removeEventListener('session-restored', handleRestore)
    }, [])


    const [ctaIndex, setCtaIndex] = useState(0)
    const ctas = useMemo(() => {
        if (!t || !locale) return []

        // 🗺️ MAPSTORE CONTEXT: Show Category-Specific Business Onboarding CTAs
        if (pathname?.startsWith('/map') || pathname?.startsWith('/map-store')) {
            // 1. Identificar servicios públicos para excluir
            const publicIds = ['caseta', 'hospital', 'policia', 'aeropuerto', 'estacion_tren'];

            // 2. Filtrar y mapear TODAS las categorías de negocio
            const businessCats = BUSINESS_CATEGORIES
                .filter(cat => !publicIds.includes(cat.id))
                .map(cat => cat.label.toUpperCase());

            // 3. Generar mensajes específicos (~33 mensajes)
            const specific = businessCats.map(cat => `¿TIENES UN ${cat}? | SÚBELO GRATIS`);

            // 4. Agregar ganchos genéricos y de marketing para superar los 50
            const marketingHooks = [
                "¿NECESITAS CLIENTES? | ¡SÚBETE AL MAPA!",
                "MÁS CLIENTES = MÁS LANA | ¡REGÍSTRATE YA!",
                "¿QUIERES MÁS DINERO? | ¡SUBE TU NEGOCIO!",
                "AUMENTA TUS VENTAS | ¡LLÉNATE DE CLIENTES!",
                "CLIENTES BUSCÁNDOTE | ¡APARECE EN EL MAPA!",
                "¿TALLER VACÍO? | ¡GENERA DINERO YA!",
                "GENERA MÁS INGRESOS | ¡SÚBELO GRATIS!",
                "TU NEGOCIO 24/7 | ¡MÁS LLAMADAS = MÁS DINERO!",
                "CLIENTES CERCA DE TI | ¡COBRA MÁS HOY!",
                "¿BUSCAS CRECER? | ¡LLÉNATE DE CLIENTES!",
                "MÁS TRABAJO, MÁS LANA | ¡SÚBETE AL MAPA!",
                "PARA EL QUE TRABAJA | ¡GENERA MÁS DINERO!",
                "¿QUIERES MÁS JALE? | ¡COBRA MÁS!",
                "IMPULSA TUS VENTAS | ¡MÁS DINERO DIARIO!",
                "CLIENTES TODO EL DÍA | ¡FACTURA MÁS!",
                "¿NECESITAS CHAMBAS? | ¡LLÉNATE DE TRABAJO!",
                "ATRAE MÁS CLIENTES | ¡GENERA MÁS LANA!",
                "¿NEGOCIO LENTO? | ¡LLÉNALO DE DINERO!",
                "POSICIONA TU MARCA | ¡VENDE MÁS HOY!",
                "NO TE QUEDES SIN JALE | ¡GENERA INGRESOS YA!",
                "¿NEGOCIO DIGITAL? | ¡PRESENCIA EN MAPA!",
                "GANA LA COMPETENCIA | ¡SÚBETE PRIMERO!",
                "¿CLIENTES NUEVOS? | ¡AQUÍ TE ENCUENTRAN!",
                "MAPA EN VIVO | ¡TU NEGOCIO EN TIEMPO REAL!",
                "¿BAJAS VENTAS? | ¡IMPULSA TU TALLER!",
                "DIRECTO A TU WHATSAPP | ¡CLIENTES REALES!",
                "COMUNIDAD AUTOMOTRIZ | ¡SÉ PARTE AHORA!",
                "¿BUSCAS SOCIOS? | ¡ESTÁS EN EL LUGAR!"
            ];

            return [
                ...marketingHooks,
                ...specific
            ].sort(() => Math.random() - 0.5);
        }

        const raw = t('common.dynamic_ctas.vehicles', { returnObjects: true })
        return Array.isArray(raw) ? raw : []
    }, [t, locale, pathname])

    useEffect(() => {
        if (ctas.length > 0) {
            const interval = setInterval(() => {
                setCtaIndex((prev) => (prev + 1) % ctas.length)
            }, 10000) // ✅ 10 segundos (6 mensajes por minuto)
            return () => clearInterval(interval)
        }
    }, [ctas])

    const [unreadMessages, setUnreadMessages] = useState(0)
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const [favoritesCount, setFavoritesCount] = useState(0)
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'auto'>('auto')
    const { triggerInstall, isInstallable, isStandalone } = usePWAInstall()
    const { isSubscribed, subscribe, permission } = usePushNotifications()

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

    const handleSignOut = async (hard: boolean = false) => {
        try {
            if (hard) {
                // 🔥 CIERRE DE SESIÓN REAL (Para pruebas de invitado)
                await signOut({ redirect: true, callbackUrl: '/' })
                return
            }

            // 🔥 CIERRE DE SESIÓN SIMULADO (Soft Logout)
            document.cookie = "soft_logout=true; Path=/; Max-Age=315360000" // 10 años
            localStorage.setItem('soft_logout', 'true')

            window.location.href = '/'
        } catch (error) {
            console.error("Error durante el cierre de sesión:", error)
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
                // Silent fail
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

        // 🚀 REAL-TIME UPDATES (Socket.IO)
        // 💰 Eliminamos polling de 10s para ahorrar $$$ en DB
        import('@/lib/socket').then(({ socket }) => {
            if (!socket.connected) {
                socket.connect()
            }

            // Join user channel
            if (session?.user?.id) {
                socket.emit('join-user', session.user.id)
            }

            socket.on('notification-update', () => {
                fetchCounts() // Fetch only when notified
            })

            socket.on('message-update', () => {
                fetchCounts()
            })
        })

        // Escuchar actualizaciones inmediatas (desde Swipe)
        const handleFavUpdate = () => fetchCounts()
        window.addEventListener('favoriteUpdated', handleFavUpdate)

        // Escuchar actualizaciones de perfil
        const handleProfileUpdate = () => {
            update()
            router.refresh()
        }
        window.addEventListener('profileUpdated', handleProfileUpdate)

        // Fallback: Low frequency polling (every 5 mins instead of 10s) just in case
        const interval = setInterval(fetchCounts, 300000)

        return () => {
            import('@/lib/socket').then(({ socket }) => {
                socket.off('notification-update')
                socket.off('message-update')
            })
            clearInterval(interval)
            window.removeEventListener('favoriteUpdated', handleFavUpdate)
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [status, update, router, session?.user?.id])

    const totalUnread = unreadMessages + unreadNotifications

    return (
        <header className="relative w-full z-[100] bg-slate-900 border-b border-white/5 shadow-lg shrink-0">
            <div className="container mx-auto px-2 md:px-4 py-2 md:py-4">
                <div className="flex items-center justify-between gap-2">
                    {/* LEFT GROUP: Logo + Platform Badges */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
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
                                className="w-10 h-10 md:w-14 md:h-14"
                                showText={false}
                                textClassName="hidden"
                            />
                        </div>

                        {/* Download Buttons - Now next to Logo */}
                        {!isStandalone && (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-700">
                                {/* Desktop/Tablet Buttons (Explicit iOS/Android) */}
                                <div className="hidden lg:flex items-center gap-1.5">
                                    <button
                                        onClick={handleIOSClick}
                                        className="flex items-center gap-1 px-2 py-1 bg-black/40 border border-white/10 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition active:scale-95"
                                        title="Instalar en iOS"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                        </svg>
                                        <span>{t('common.ios')}</span>
                                    </button>
                                    <button
                                        onClick={handleAndroidClick}
                                        className="flex items-center gap-1 px-2 py-1 bg-black/40 border border-white/10 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition active:scale-95"
                                        title="Instalar en Android"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                        </svg>
                                        <span>{t('common.android')}</span>
                                    </button>
                                </div>

                                {/* Mobile Button (Generic "Descargar App") */}
                                <button
                                    onClick={handleAndroidClick}
                                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-full text-[10px] font-bold backdrop-blur-sm active:bg-white/20 transition-all shine-effect"
                                >
                                    <Smartphone className="w-3.5 h-3.5 text-primary-400" />
                                    <span>Descargar App</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CENTER GROUP: Navegación - Centrada en Desktop */}
                    <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <Link
                            href="/swipe"
                            className={`px-4 py-2 rounded-lg font-medium transition ${isActive("/swipe") ? "bg-primary-700 text-white" : "text-text-secondary hover:text-white"}`}
                        >
                            {t('nav.carmatch')}
                        </Link>
                        <Link
                            href="/market"
                            className={`px-4 py-2 rounded-lg font-medium transition ${isActive("/market") ? "bg-primary-700 text-white" : "text-text-secondary hover:text-white"}`}
                        >
                            {t('nav.marketcar')}
                        </Link>
                        <Link
                            href="/map"
                            className={`px-4 py-2 rounded-lg font-medium transition ${isActive("/map") ? "bg-primary-700 text-white" : "text-text-secondary hover:text-white"}`}
                        >
                            {t('nav.mapstore')}
                        </Link>
                    </nav>

                    {/* RIGHT GROUP: CTA + Profile/Auth */}
                    <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end min-w-0 shrink-0">
                        {/* 🚀 DYNAMIC CTA: Adaptive Layout */}
                        {session && !isSoftLogout ? (
                            /* COMPACT STYLE: For Authenticated Users (Less Space) */
                            <div
                                onClick={(e) => {
                                    const isMapContext = pathname?.startsWith('/map') || pathname?.startsWith('/map-store')
                                    const publishVehiclePath = "/publish"
                                    const publishBusinessPath = "/my-businesses?action=new"
                                    const targetPath = isMapContext ? publishBusinessPath : publishVehiclePath

                                    router.push(targetPath)
                                }}
                                className="flex flex-col items-end cursor-pointer group active:scale-95 transition-transform"
                            >
                                <AnimatePresence mode="wait">
                                    {(ctas[ctaIndex] || "").includes(' | ') && (
                                        <div className="flex flex-col items-end">
                                            <motion.span
                                                key={`hook-auth-${ctaIndex}`}
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="text-[10px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5"
                                            >
                                                {(ctas[ctaIndex] || "").split(' | ')[0]}
                                            </motion.span>
                                            <motion.span
                                                key={`action-auth-${ctaIndex}`}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="text-xs lg:text-sm font-black text-accent-500 uppercase tracking-tight leading-none group-hover:text-accent-400 transition-colors"
                                            >
                                                {(ctas[ctaIndex] || "").split(' | ')[1]}
                                            </motion.span>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* PROMINENT BUTTON STYLE: For Guests (More Space) */
                            <div className="flex flex-col xl:flex-row items-end xl:items-center gap-1 xl:gap-3 justify-end overflow-visible">
                                <AnimatePresence mode="wait">
                                    {(ctas[ctaIndex] || "").includes(' | ') && (
                                        <motion.div
                                            key={`hook-guest-${ctaIndex}`}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 5 }}
                                            className="block text-white/90 font-bold text-[9px] md:text-[10px] uppercase tracking-wide leading-tight text-right max-w-[120px] md:max-w-none mb-0.5"
                                        >
                                            {(ctas[ctaIndex] || "").split(' | ')[0]}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        const isMapContext = pathname?.startsWith('/map') || pathname?.startsWith('/map-store')
                                        const targetPath = isMapContext ? "/my-businesses?action=new" : "/auth"
                                        console.log("Redirecting guest to:", targetPath)
                                        router.push(targetPath)
                                    }}
                                    className="relative group shrink-0 flex items-center cursor-pointer z-20"
                                >
                                    <div className="px-4 py-2 lg:px-6 lg:py-2.5 bg-accent-600 rounded-lg shadow-lg group-hover:bg-accent-500 transition-all active:scale-95 ring-1 ring-accent-500/30 flex items-center gap-2 pointer-events-none">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={`action-guest-${ctaIndex}`}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="text-white font-black text-xs sm:text-sm lg:text-base whitespace-nowrap uppercase tracking-wide truncate max-w-[160px] sm:max-w-none"
                                            >
                                                {(ctas[ctaIndex] || t('common.login_vehicle')).split(' | ')[1] || t('common.login_vehicle')}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Bell */}
                        {session && !isSoftLogout && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(showMenu === 'notifications' ? false : 'notifications')}
                                    className="p-2 rounded-lg hover:bg-surface-highlight transition"
                                >
                                    <Bell className="w-6 h-6 text-text-secondary hover:text-text-primary" />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </span>
                                    )}
                                </button>
                                <NotificationsDropdown isOpen={showMenu === 'notifications'} onClose={() => setShowMenu(false)} />
                            </div>
                        )}

                        {/* User Profile */}
                        {status === 'authenticated' && !isSoftLogout && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(showMenu === 'user' ? false : 'user')}
                                    className="flex items-center gap-2 hover:bg-surface-highlight px-2 py-1.5 rounded-lg transition"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="User" className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                                            {session.user?.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-text-primary font-medium hidden xl:block">{session.user?.name}</span>
                                </button>
                                {showMenu === 'user' && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-2xl border border-surface-highlight overflow-hidden z-50 py-2">
                                            {/* Profile */}
                                            <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <CarFront className="w-5 h-5 text-primary-500" />
                                                <span className="font-medium">{t('nav.profile')}</span>
                                            </Link>

                                            {/* Install App - Prominent positioning */}
                                            {!isStandalone && (
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false)
                                                        handleAndroidClick()
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-500/10 text-primary-400 transition-colors animate-pulse"
                                                >
                                                    <Smartphone className="w-5 h-5" />
                                                    <span className="font-black uppercase tracking-tight text-sm">{t('common.install_app') || 'Instalar CarMatch App'}</span>
                                                </button>
                                            )}

                                            {/* Admin Panel */}
                                            {isAdmin && (
                                                <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-primary-500/10 text-primary-400 font-bold transition-colors" onClick={() => setShowMenu(false)}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span>{t('nav.admin_panel')}</span>
                                                </Link>
                                            )}

                                            <div className="border-t border-surface-highlight/50 my-1" />

                                            {/* Messages */}
                                            <Link href="/messages" className="flex items-center justify-between px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                                    <span className="font-medium">{t('nav.messages')}</span>
                                                </div>
                                                {unreadMessages > 0 && (
                                                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {unreadMessages}
                                                    </span>
                                                )}
                                            </Link>

                                            {/* Favorites */}
                                            <Link href="/favorites" className="flex items-center justify-between px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <div className="flex items-center gap-3">
                                                    <ThumbsUp className="w-5 h-5 text-primary-500" />
                                                    <span className="font-medium">{t('nav.favorites')}</span>
                                                </div>
                                                {favoritesCount > 0 && (
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {favoritesCount}
                                                    </span>
                                                )}
                                            </Link>

                                            {/* My Businesses */}
                                            <Link href="/my-businesses" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <Briefcase className="w-5 h-5 text-green-500" />
                                                <span className="font-medium">{t('nav.my_businesses')}</span>
                                            </Link>

                                            {/* Credits */}
                                            <Link href="/credits" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <Coins className="w-5 h-5 text-amber-500" />
                                                <span className="font-medium">{t('nav.credits')}</span>
                                            </Link>

                                            <div className="border-t border-surface-highlight/50 my-1" />

                                            {/* Settings */}
                                            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-highlight transition-colors" onClick={() => setShowMenu(false)}>
                                                <Settings className="w-5 h-5 text-slate-400" />
                                                <span className="font-medium">{t('nav.settings' as any) || 'Configuración'}</span>
                                            </Link>


                                        </div>
                                    </>
                                )}
                            </div>
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
