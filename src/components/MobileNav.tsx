"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
import {
    Home,
    Flame,
    Car,
    Map as MapIcon,
    User,
    PlusCircle,
    Headset
} from "lucide-react"

export default function MobileNav() {
    const pathname = usePathname()
    const { t } = useLanguage()
    const { data: session } = useSession()

    if (!session) return null

    const isActive = (path: string) => pathname === path

    const navItems = [
        { href: "/swipe", icon: Flame, label: t('nav.carmatch'), color: "text-orange-500" },
        { href: "/market", icon: Car, label: t('nav.marketcar'), color: "text-blue-500" },
        { href: "/map", icon: MapIcon, label: t('nav.mapstore'), color: "text-green-500" },
        { href: "/profile", icon: User, label: t('nav.profile'), color: "text-purple-500" },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item, index) => {
                    const Icon = item.icon
                    const active = item.href ? isActive(item.href) : false
                    const content = (
                        <>
                            <Icon className={`w-6 h-6 ${active ? item.color : ''}`} />
                            <span className="text-[10px] font-medium truncate max-w-[60px]">
                                {item.label}
                            </span>
                        </>
                    )

                    if (item.onClick) {
                        return (
                            <button
                                key={`nav-btn-${index}`}
                                onClick={item.onClick}
                                className="flex flex-col items-center justify-center w-full gap-1 transition text-text-secondary hover:text-primary-500"
                            >
                                {content}
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={item.href || index}
                            href={item.href!}
                            className={`flex flex-col items-center justify-center w-full gap-1 transition ${active ? 'text-primary-500 scale-110' : 'text-text-secondary'
                                }`}
                        >
                            {content}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
