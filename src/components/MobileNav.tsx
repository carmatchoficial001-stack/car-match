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

    useEffect(() => {
        const visualViewport = window.visualViewport;
        const initialHeight = window.innerHeight;

        const detectKeyboard = () => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
                (activeElement as HTMLElement).isContentEditable
            );

            // Si el viewport visual se reduce significativamente respecto a la altura inicial
            const isViewportResized = visualViewport ? visualViewport.height < initialHeight * 0.85 : false;

            // También checar el innerHeight tradicional por si acaso
            const isWindowResized = window.innerHeight < initialHeight * 0.85;

            // Si hay foco en un input O alguna de las medidas bajó, ocultamos
            setIsVisible(!(isInputFocused || isViewportResized || isWindowResized));
        };

        if (visualViewport) {
            visualViewport.addEventListener('resize', detectKeyboard);
        }

        window.addEventListener('resize', detectKeyboard);
        document.addEventListener('focusin', detectKeyboard);
        document.addEventListener('focusout', () => setTimeout(detectKeyboard, 200));

        // Ejecutar una vez al inicio
        detectKeyboard();

        return () => {
            if (visualViewport) {
                visualViewport.removeEventListener('resize', detectKeyboard);
            }
            window.removeEventListener('resize', detectKeyboard);
            document.removeEventListener('focusin', detectKeyboard);
        };
    }, []);

    if (!session) return null

    const isActive = (path: string) => pathname === path

    const navItems = [
        { href: "/swipe", icon: Flame, label: t('nav.carmatch'), color: "text-orange-500" },
        { href: "/market", icon: Car, label: t('nav.marketcar'), color: "text-blue-500" },
        { href: "/map", icon: MapIcon, label: t('nav.mapstore'), color: "text-green-500" },
        { href: "/profile", icon: User, label: t('nav.profile'), color: "text-purple-500" },
    ]

    return (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect pb-safe transition-all duration-300 ${isVisible ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-full pointer-events-none'
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
