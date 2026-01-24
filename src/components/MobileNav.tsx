"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
    Flame,
    Car,
    Map as MapIcon,
    User
} from "lucide-react"

export default function MobileNav() {
    const pathname = usePathname()
    const { t } = useLanguage()
    const { data: session } = useSession()
    const [isSoftLogout, setIsSoftLogout] = useState(false)
    const [isVisible, setIsVisible] = useState(true)

    // 🔥 SESIÓN Y SOFT LOGOUT
    useEffect(() => {
        const hasCookie = document.cookie.includes('soft_logout=true')
        const hasStorage = localStorage.getItem('soft_logout') === 'true'
        const currentSoftLogout = hasCookie || hasStorage

        const protectedPaths = ['/profile', '/settings', '/messages', '/my-businesses', '/publish', '/admin', '/favorites', '/credits'];
        const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

        if (session && currentSoftLogout && isProtectedPath) {
            document.cookie = "soft_logout=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            localStorage.removeItem('soft_logout')
            setIsSoftLogout(false)
        } else {
            setIsSoftLogout(currentSoftLogout)
        }
    }, [pathname, session])

    // ⌨️ SMART KEYBOARD HIDE (Detección Ultra-Robusta)
    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                // Si la altura del viewport se reduce significativamente, es el teclado
                const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
                setIsVisible(!isKeyboardOpen);
            }
        };

        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                setIsVisible(false);
            }
        };

        const handleBlur = () => {
            // Pequeño delay para checar si el foco pasó a otro input o se cerró realmente
            setTimeout(handleResize, 100);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('focusout', handleBlur);
        };
    }, []);

    // 🔥 ESCUCHAR RESTAURACIÓN MANUAL
    useEffect(() => {
        const handleRestore = () => {
            setIsSoftLogout(false)
        }
        window.addEventListener('session-restored', handleRestore)
        return () => window.removeEventListener('session-restored', handleRestore)
    }, [])

    if (pathname?.startsWith('/admin')) {
        return null
    }

    const isActive = (path: string) => pathname === path

    const navItems = [
        { href: "/swipe", icon: Flame, label: t('nav.carmatch'), color: "text-orange-500" },
        { href: "/market", icon: Car, label: t('nav.marketcar'), color: "text-blue-500" },
        { href: "/map", icon: MapIcon, label: t('nav.mapstore'), color: "text-green-500" },
        {
            href: (session && !isSoftLogout) ? "/profile" : "/auth",
            icon: User,
            label: (session && !isSoftLogout) ? t('nav.profile') : t('common.login'),
            color: "text-purple-500"
        },
    ]

    return (
        <nav
            className={`md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-[#0f172a] border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] ${isVisible ? 'flex' : 'hidden'}`}
            style={{
                height: 'calc(64px + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)',
                // 🚀 ESTABILIDAD ULTRA: Forzar renderizado en capa independiente (GPU)
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                willChange: 'transform',
                contain: 'layout paint'
            }}
        >
            <div className="flex items-center justify-around h-16 px-2 w-full">
                {navItems.map((item, index) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.href || index}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full gap-0.5 transition-transform active:scale-90 ${active ? 'text-primary-500' : 'text-text-secondary'}`}
                        >
                            <div className="relative p-1">
                                <Icon className={`w-6 h-6 ${active ? item.color : 'opacity-70'}`} />
                                {active && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute inset-0 bg-primary-500/10 rounded-full blur-md"
                                    />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold truncate max-w-[64px] ${active ? 'text-white' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
