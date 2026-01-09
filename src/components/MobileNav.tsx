"use client"

import { useEffect, useState } from "react"
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
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

    if (!session) return null

    // 📱 Detectar cuando el teclado virtual está abierto
    useEffect(() => {
        // Safety check para SSR y entornos sin ventana
        if (typeof window === 'undefined' || !window.document) return

        const isInputElement = (element: Element | null): boolean => {
            try {
                if (!element || !element.tagName) return false
                const tagName = element.tagName.toLowerCase()
                const type = element.getAttribute('type')?.toLowerCase() || ''

                // Excluir checkboxes y radios que no abren teclado
                if (tagName === 'input' && (type === 'checkbox' || type === 'radio' || type === 'range' || type === 'color')) {
                    return false
                }

                return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
            } catch (e) {
                return false
            }
        }

        const handleFocusIn = () => {
            try {
                if (isInputElement(document.activeElement)) {
                    setIsKeyboardOpen(true)
                }
            } catch (e) {
                // Ignore DOM errors
            }
        }

        const handleFocusOut = () => {
            setIsKeyboardOpen(false)
        }

        try {
            document.addEventListener('focusin', handleFocusIn)
            document.addEventListener('focusout', handleFocusOut)
        } catch (e) {
            console.warn('Error adding focus listeners:', e)
        }

        return () => {
            try {
                document.removeEventListener('focusin', handleFocusIn)
                document.removeEventListener('focusout', handleFocusOut)
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }, [])

    const isActive = (path: string) => pathname === path

    const navItems = [
        { href: "/swipe", icon: Flame, label: t('nav.carmatch'), color: "text-orange-500" },
        { href: "/market", icon: Car, label: t('nav.marketcar'), color: "text-blue-500" },
        { href: "/map", icon: MapIcon, label: t('nav.mapstore'), color: "text-green-500" },
        { href: "/profile", icon: User, label: t('nav.profile'), color: "text-purple-500" },
    ]

    return (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect pb-safe transition-transform duration-300 ease-in-out ${isKeyboardOpen ? 'translate-y-full' : 'translate-y-0'
            }`}>
            <div className="flex items-center justify-around h-16 px-2">
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
