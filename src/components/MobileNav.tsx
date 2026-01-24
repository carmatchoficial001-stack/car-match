"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
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

    useEffect(() => {
        const hasCookie = document.cookie.includes('soft_logout=true')
        const hasStorage = localStorage.getItem('soft_logout') === 'true'
        const currentSoftLogout = hasCookie || hasStorage

        // 🔥 AUTO-UNLOCK
        const protectedPaths = ['/profile', '/settings', '/messages', '/my-businesses', '/publish', '/admin', '/favorites', '/credits'];
        const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

        if (session && currentSoftLogout && isProtectedPath) {
            document.cookie = "soft_logout=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            localStorage.removeItem('soft_logout')
            setIsSoftLogout(false)
        } else {
            setIsSoftLogout(currentSoftLogout)
        }

        // ⌨️ SMART HIDE (Only for Keyboard/Input)
        // No escuchamos resize general para evitar el rebote del scroll
        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                setIsVisible(false);
            }
        };
        const handleBlur = () => {
            setIsVisible(true);
        };

        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);

        return () => {
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('focusout', handleBlur);
        };
    }, [pathname, session]);

    // 🔥 ESCUCHAR RESTAURACIÓN MANUAL
    useEffect(() => {
        const handleRestore = () => {
            setIsSoftLogout(false)
        }
        window.addEventListener('session-restored', handleRestore)
        return () => window.removeEventListener('session-restored', handleRestore)
    }, [])


    // if (!session || isSoftLogout) return null // ❌ REMOVIDO: Ahora se muestra siempre

    // Ocultar en admin
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
            className={`md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-[#0f172a]/95 border-t border-white/5 backdrop-blur-sm ${isVisible ? 'flex' : 'hidden'}`}
            style={{
                height: 'calc(64px + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)',
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                perspective: '1000px',
                contain: 'layout paint',
                transformStyle: 'preserve-3d',
                position: 'fixed'
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
                            className={`flex flex-col items-center justify-center w-full gap-1 transition-transform ${active ? 'text-primary-500 scale-105' : 'text-text-secondary'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${active ? item.color : ''}`} />
                            <span className="text-[10px] font-medium truncate max-w-[60px]">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
