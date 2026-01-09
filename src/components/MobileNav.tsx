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
        const isInputElement = (element: Element | null): boolean => {
            if (!element) return false
            const tagName = element.tagName.toLowerCase()
            return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
        }

        const handleFocusIn = () => {
            if (isInputElement(document.activeElement)) {
                setIsKeyboardOpen(true)
            }
        }

        const handleFocusOut = () => {
            setIsKeyboardOpen(false)
        }

        document.addEventListener('focusin', handleFocusIn)
        document.addEventListener('focusout', handleFocusOut)

        return () => {
            document.removeEventListener('focusin', handleFocusIn)
            document.removeEventListener('focusout', handleFocusOut)
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
