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
    const [isVisible, setIsVisible] = useState(true)
    const [isSoftLogout, setIsSoftLogout] = useState(false)

    useEffect(() => {
        const hasCookie = document.cookie.includes('soft_logout=true')
        const hasStorage = localStorage.getItem('soft_logout') === 'true'
        const currentSoftLogout = hasCookie || hasStorage

        // 🔥 AUTO-UNLOCK: Solo restauramos la sesión automáticamente si el usuario 
        // intenta entrar a secciones privadas (perfil, mensajes, publicar, etc.)
        const protectedPaths = ['/profile', '/settings', '/messages', '/my-businesses', '/publish', '/admin', '/favorites', '/credits'];
        const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

        if (session && currentSoftLogout && isProtectedPath) {
            document.cookie = "soft_logout=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            localStorage.removeItem('soft_logout')
            setIsSoftLogout(false)
        } else {
            setIsSoftLogout(currentSoftLogout)
        }


        // Función simplificada y robusta para detectar teclado
        const handleResize = () => {
            // Si el viewport es mucho más chico que la pantalla, es probable que esté el teclado
            // Usamos window.screen.height como referencia absoluta que no cambia (usualmente)
            const isKeyboardOpen = window.visualViewport
                ? window.visualViewport.height < window.screen.height * 0.6 // 60% de la pantalla
                : window.innerHeight < window.screen.height * 0.75;

            // Verificación adicional por foco (la más confiable para inputs)
            const activeTag = document.activeElement?.tagName;
            const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

            if (isKeyboardOpen || isInputFocused) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        };

        // Listeners
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
        window.addEventListener('resize', handleResize);

        // Focus listeners con capture para asegurar que los atrapamos
        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                setIsVisible(false);
            }
        };
        const handleBlur = () => {
            // Pequeño delay para verificar si el foco pasó a otro input o se cerró el teclado
            setTimeout(handleResize, 100);
        };

        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);

        // Chequeo inicial
        handleResize();

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            window.removeEventListener('resize', handleResize);
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
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[9999] glass-effect pb-safe transition-all duration-300 ${isVisible ? 'flex opacity-100 translate-y-0' : 'flex opacity-0 translate-y-full pointer-events-none'
            }`}>
            <div className="flex items-center justify-around h-16 px-2 w-full">
                {navItems.map((item, index) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.href || index}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full gap-1 transition ${active ? 'text-primary-500 scale-110' : 'text-text-secondary'
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
