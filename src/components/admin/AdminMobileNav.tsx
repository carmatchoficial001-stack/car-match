// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import {
    LayoutDashboard,
    Megaphone,
    Activity,
    Users,
    Car,
    Store,
    Cpu,
    Menu
} from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminMobileNavProps {
    activeView: string
    setActiveView: (view: any) => void
    menuItems: any[]
}

export default function AdminMobileNav({ activeView, setActiveView, menuItems }: AdminMobileNavProps) {
    // Only show primary items in the bottom bar to avoid clutter
    const primaryItems = ['overview', 'publicity', 'intelligence', 'inventory', 'menu']

    // Helper to find icon for "More" menu or specific items
    const getIcon = (id: string) => {
        const item = menuItems.find(i => i.id === id)
        return item ? item.icon : Menu
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#09090b] border-t border-white/10 px-6 py-2 pb-5 z-50 md:hidden flex justify-between items-center backdrop-blur-lg safe-area-bottom">
            {primaryItems.map((id) => {
                const isMenu = id === 'menu'
                const item = menuItems.find(i => i.id === id)
                const Icon = isMenu ? Menu : (item?.icon || LayoutDashboard)
                const isActive = activeView === id

                return (
                    <button
                        key={id}
                        onClick={() => setActiveView(isMenu ? 'more' : id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${isActive ? 'text-primary-400' : 'text-white/40 hover:text-white'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute -top-2 w-8 h-1 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            />
                        )}
                        <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        {/* <span className="text-[9px] font-medium">{isMenu ? 'Menú' : item?.label}</span> */}
                    </button>
                )
            })}
        </div>
    )
}
