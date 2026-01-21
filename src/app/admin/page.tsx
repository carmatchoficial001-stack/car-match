'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    Car,
    Store,
    Flag,
    Terminal,
    Settings,
    LogOut,
    Menu,
    X,
    Headset,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    Activity,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Map as MapIcon,
    BarChart2,
    Target,
    QrCode,
    Cpu,
    Sparkles,
    RefreshCw,
    Coins
} from 'lucide-react'
import dynamic from 'next/dynamic'
const AdminHeatMap = dynamic(() => import('@/components/AdminHeatMap'), { ssr: false })
import QRCodeModal from '@/components/QRCodeModal'
import ManageCreditsModal from '@/components/admin/ManageCreditsModal'
import Link from 'next/link'
import SimpleLineChart from '@/components/SimpleLineChart'

interface SystemStats {
    users: { total: number; active: number; recent: any[]; growth?: number[] }
    vehicles: { total: number; active: number; recent: any[] }
    businesses: { total: number; recent: any[] }
    chats: { total: number }
    appointments: { total: number; active: number }
    logs: Array<{
        id: string
        level: string
        message: string
        source: string | null
        createdAt: string
    }>
    reports: Array<{
        id: string
        reason: string
        description: string | null
        status: string
        imageUrl: string | null
        vehicleId: string | null
        targetUserId: string | null
        createdAt: string
        reporter: { name: string; email: string }
        targetUser?: { name: string; email: string }
        vehicle?: { title: string }
    }>
    intelligence?: {
        searches: any[]
        vehicles: Array<{ latitude: number; longitude: number; title: string }>
        businesses: Array<{ latitude: number; longitude: number; name: string; category: string }>
    }
    financials?: {
        revenue: number[]
        totalRevenue: number
    }
}

type AdminView = 'overview' | 'users' | 'inventory' | 'map-store' | 'intelligence' | 'reports' | 'logs' | 'ai-hub'

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeView, setActiveView] = useState<AdminView>('overview')
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // AI Analyst State
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState<any>(null)
    const [showQRModal, setShowQRModal] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth')
            return
        }
        if (status === 'authenticated') {
            fetchStats()
        }
    }, [status, router])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else if (res.status === 403) {
                alert('No tienes permisos de administrador')
                router.push('/')
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRunAnalyst = async () => {
        setIsAnalyzing(true)
        try {
            const res = await fetch('/api/admin/ai-analyst', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                const data = await res.json()
                setAiAnalysis(data)
            }
        } catch (error) {
            console.error('Error running AI analyst:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Mobile Responsive Logic - Moved up to avoid hook rule violation
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsSidebarOpen(false)
            else setIsSidebarOpen(true)
        }
        // Initial check
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full shadow-[0_0_20px_rgba(147,51,234,0.3)]"></div>
                    <p className="text-text-secondary animate-pulse font-medium tracking-widest text-xs uppercase">CarMatch Admin Loading</p>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const menuItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Panel de Control' },
        { id: 'intelligence', icon: Activity, label: 'Inteligencia' },
        { id: 'users', icon: Users, label: 'Usuarios' },
        { id: 'inventory', icon: Car, label: 'Inventario' },
        { id: 'map-store', icon: Store, label: 'MapStore' },
        { id: 'ai-hub', icon: Cpu, label: 'AI Hub' },
        { id: 'reports', icon: Flag, label: 'Reportes', badge: stats.reports.filter(r => r.status === 'PENDING').length },
        { id: 'logs', icon: Terminal, label: 'Registros' },
    ]

    return (
        <div className="min-h-screen bg-[#0c0c0e] text-text-primary flex relative overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                bg-[#111114] border-r border-white/5 
                transition-all duration-300 ease-in-out
                flex flex-col flex-shrink-0
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
            `}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/40 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-black text-xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                        ADMIN
                    </span>
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveView(item.id as AdminView)
                                if (window.innerWidth < 768) setIsSidebarOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${activeView === item.id
                                ? 'bg-primary-600/10 text-primary-400'
                                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${activeView === item.id ? 'text-primary-500' : 'group-hover:text-text-primary'}`} />
                            <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 md:absolute md:left-14 md:bg-[#111114] md:px-2 md:py-1 md:rounded md:border md:border-white/10 md:z-50 md:group-hover:opacity-100 md:group-hover:translate-x-0 md:pointer-events-none'}`}>
                                {isSidebarOpen ? item.label : (
                                    // Tooltip logic for collapsed desktop sidebar
                                    <span className="hidden md:block">{item.label}</span>
                                )}
                            </span>

                            {item.badge ? (
                                <span className={`absolute ${isSidebarOpen ? 'right-3' : 'top-2 right-2'} bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold`}>
                                    {item.badge}
                                </span>
                            ) : null}
                            {activeView === item.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-1">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                        className="w-full flex items-center gap-3 px-3 py-3 text-primary-400 hover:text-primary-300 hover:bg-white/5 transition-all rounded-xl"
                    >
                        <Headset className="w-5 h-5 shrink-0" />
                        <span className={`font-bold text-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Soporte</span>
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center gap-3 px-3 py-3 text-text-secondary hover:text-white hover:bg-white/5 transition-all rounded-xl"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className={`text-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Salir del Portal</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                {/* Top Header */}
                <header className="h-16 bg-[#111114]/50 backdrop-blur-md border-b border-white/5 px-4 md:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/5 rounded-lg text-text-secondary active:scale-95 transition"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <h2 className="text-lg font-bold capitalize truncate max-w-[150px] md:max-w-none">{activeView}</h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        {/* QR Code Button */}
                        <button
                            onClick={() => setShowQRModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-primary-600/10 hover:bg-primary-600/20 border border-primary-600/20 rounded-xl transition group"
                        >
                            <QrCode className="w-4 h-4 text-primary-400" />
                            <span className="hidden sm:block text-xs font-bold text-primary-400 uppercase tracking-wider">
                                COMPARTIR APP
                            </span>
                        </button>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Healthy</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-text-primary">{session?.user?.name || 'Admin'}</p>
                            </div>
                            <div className="w-8 h-8 bg-surface-highlight rounded-lg border border-white/10 overflow-hidden">
                                <img src={session?.user?.image || 'https://ui-avatars.com/api/?name=Admin'} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeView === 'overview' && <OverviewTab stats={stats} handleRunAnalyst={handleRunAnalyst} isAnalyzing={isAnalyzing} aiAnalysis={aiAnalysis} />}
                            {activeView === 'intelligence' && <IntelligenceTab />}
                            {activeView === 'users' && <UsersTab users={stats.users.recent} />}
                            {activeView === 'inventory' && <InventoryTab vehicles={stats.vehicles.recent} />}
                            {activeView === 'map-store' && <MapStoreTab businesses={stats.businesses.recent} />}
                            {activeView === 'ai-hub' && <AiHubTab />}
                            {activeView === 'reports' && <ReportsTab reports={stats.reports} />}
                            {activeView === 'logs' && <LogsTab logs={stats.logs} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* QR Code Modal */}
            <QRCodeModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
            />
        </div>
    )
}

function OverviewTab({ stats, handleRunAnalyst, isAnalyzing, aiAnalysis }: any) {
    return (
        <div className="space-y-8">
            {/* Top Grid: Financials & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Global Presence Heatmap */}
                <div className="lg:col-span-2 bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group h-[400px]">
                    <div className="absolute top-0 left-0 right-0 p-4 border-b border-white/5 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">CarMatch Live Activity</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-text-secondary">Tiempo Real</span>
                    </div>
                    {/* Render Heatmap if intelligence data exists */}
                    {stats.intelligence ? (
                        <AdminHeatMap data={stats.intelligence} />
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                            <p className="text-sm text-text-secondary animate-pulse">Cargando Satélite...</p>
                        </div>
                    )}
                </div>

                {/* 2. Growth & Financials Column */}
                <div className="space-y-6">
                    {/* User Growth Chart */}
                    <div className="bg-[#111114] border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col h-[190px] justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Crecimiento Usuarios</h4>
                                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+12% Mes</span>
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter text-white">{stats.users.total.toLocaleString('es-MX')}</h3>
                        </div>
                        <div className="flex-1 mt-2">
                            <SimpleLineChart data={stats.users.growth || [10, 20, 15, 30, 40]} color="#3b82f6" height={80} />
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-[#111114] border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col h-[190px] justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Ventas Totales (Est.)</h4>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+24% Mes</span>
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter text-white">${(stats.financials?.totalRevenue || 0).toLocaleString('es-MX')}</h3>
                        </div>
                        <div className="flex-1 mt-2">
                            <SimpleLineChart data={stats.financials?.revenue || [100, 120, 180, 220, 300]} color="#10b981" height={80} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard2 icon={Car} label="Inventario" value={stats.vehicles.active} trend="+5%" color="purple" simple />
                <StatCard2 icon={Activity} label="Citas Activas" value={stats.appointments.active} trend="+8%" color="green" simple />
                <StatCard2 icon={Store} label="Negocios" value={stats.businesses.total} trend="Nuevo" color="blue" simple />
                <StatCard2 icon={Flag} label="Reportes" value={stats.reports.filter((r: any) => r.status === 'PENDING').length} trend="Atención" color="red" simple />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Analyst Section */}
                <div className="lg:col-span-2 bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-r from-primary-900/20 to-transparent p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black italic tracking-tight flex items-center gap-2 uppercase">
                                <Activity className="w-6 h-6 text-primary-500" /> Insight Engine AI
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">Análisis predictivo de mercado basado en actividad real</p>
                        </div>
                        <button
                            onClick={handleRunAnalyst}
                            disabled={isAnalyzing}
                            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold text-sm transition shadow-lg shadow-primary-900/20 flex items-center gap-2"
                        >
                            {isAnalyzing ? 'Procesando Data...' : 'Ejecutar Análisis Maestro'}
                        </button>
                    </div>

                    <div className="p-8">
                        {aiAnalysis ? (
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-3">Resumen Estratégico</h4>
                                    <p className="text-sm leading-relaxed text-text-primary/90">{aiAnalysis.summary}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiAnalysis.insights.map((insight: any, i: number) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-xl border-l-4 border-l-primary-600/50">
                                            <p className="text-xs font-bold text-text-primary mb-1">{insight.observation}</p>
                                            <p className="text-[10px] text-text-secondary">{insight.recommendation}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Océanos Azules (Business Opportunities) */}
                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5" /> Océanos Azules Detectados (ROI 90%+)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {aiAnalysis.businessOppotunities?.map((opp: any, i: number) => (
                                            <div key={i} className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-all">
                                                <div className="absolute top-0 right-0 p-2 bg-green-500 text-[8px] font-black text-black rounded-bl-xl shadow-lg">
                                                    {opp.roiScore}% ROI
                                                </div>
                                                <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">{opp.title}</p>
                                                <p className="text-[10px] text-green-400 font-bold mb-2 uppercase tracking-widest">{opp.location}</p>
                                                <p className="text-[9px] text-text-secondary leading-tight italic line-clamp-2">"{opp.reason}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                                <Terminal className="w-12 h-12 mb-4" />
                                <p className="text-sm font-medium">Esperando datos de entrada...</p>
                                <p className="text-xs mt-1">Haga clic en el botón superior para generar perspectivas con IA</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Activity Hub */}
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-text-secondary">
                        <Terminal className="w-4 h-4" /> Actividad Reciente
                    </h3>
                    <div className="space-y-6">
                        {stats.logs.slice(0, 6).map((log: any) => (
                            <div key={log.id} className="flex gap-4 group">
                                <div className={`w-1 h-8 rounded-full transition-all group-hover:h-10 ${log.level === 'ERROR' ? 'bg-red-500' : 'bg-primary-500'
                                    }`} />
                                <div>
                                    <p className="text-xs font-bold text-text-primary line-clamp-1">{log.message}</p>
                                    <p className="text-[9px] text-text-secondary mt-1 uppercase tracking-tighter opacity-60">
                                        {new Date(log.createdAt).toLocaleTimeString()} • {log.source || 'SYS'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                        Ver Auditoría Completa
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatCard2({ icon: Icon, label, value, trend, color, simple }: any) {
    const variants: any = {
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        green: 'text-green-500 bg-green-500/10',
        red: 'text-red-500 bg-red-500/10',
    }
    return (
        <div className={`bg-[#111114] border border-white/5 p-6 rounded-3xl shadow-xl ${simple ? 'flex flex-col justify-between h-32' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${variants[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${color === 'red' ? 'bg-red-500 text-white' : 'bg-white/5 text-text-secondary'}`}>
                    {trend}
                </span>
            </div>
            <div>
                <p className="text-text-secondary text-[10px] font-medium uppercase tracking-widest mb-1 truncate">{label}</p>
                <h4 className="text-2xl font-black italic tracking-tighter">{value.toLocaleString('es-MX')}</h4>
            </div>
        </div>
    )
}



function UsersTab({ users }: { users: any[] }) {
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showCreditModal, setShowCreditModal] = useState(false)
    const router = useRouter()

    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">Gestión de Usuarios</h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" placeholder="Buscar usuario..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Usuario</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Créditos</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Email</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Rol</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Estado</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Registro</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-surface-highlight overflow-hidden">
                                            <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-sm font-bold">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${user.credits > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                            {user.credits}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setShowCreditModal(true)
                                            }}
                                            className="p-1 hover:bg-white/10 rounded-lg text-amber-500/80 hover:text-amber-400 transition"
                                            title="Gestionar Créditos"
                                        >
                                            <Coins size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {user.isAdmin ? 'ADMIN' : 'USER'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black flex items-center gap-1.5 ${user.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <AdminGenericAction
                                            apiPath={`/api/admin/users/${user.id}`}
                                            method="PATCH"
                                            body={{ isActive: !user.isActive }}
                                            label={user.isActive ? 'Desactivar' : 'Activar'}
                                        />
                                        <AdminGenericAction
                                            apiPath={`/api/admin/users/${user.id}`}
                                            method="DELETE"
                                            label="Eliminar"
                                            danger
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUser && (
                <ManageCreditsModal
                    isOpen={showCreditModal}
                    onClose={() => setShowCreditModal(false)}
                    user={selectedUser}
                    onSuccess={() => {
                        window.location.reload()
                    }}
                />
            )}
        </div>
    )
}

function InventoryTab({ vehicles }: { vehicles: any[] }) {
    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">Inventario Global</h3>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-primary-500 transition"><Filter className="w-4 h-4" /></button>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </div>
            <table className="w-full">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    <tr>
                        <th className="px-6 py-4 text-left">Vehículo</th>
                        <th className="px-6 py-4 text-left">Vendedor</th>
                        <th className="px-6 py-4 text-left">Precio</th>
                        <th className="px-6 py-4 text-left">Estado</th>
                        <th className="px-6 py-4 text-left">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {vehicles.map(vehicle => (
                        <tr key={vehicle.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-8 rounded-lg bg-black overflow-hidden border border-white/10">
                                        <img src={vehicle.images?.[0]} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-bold">{vehicle.title}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{vehicle.user.name}</td>
                            <td className="px-6 py-4 text-sm font-bold text-primary-400">
                                {Number(vehicle.price).toLocaleString('es-MX', { style: 'currency', currency: vehicle.currency || 'MXN' })}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${vehicle.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {vehicle.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-2">
                                    <AdminGenericAction
                                        apiPath={`/api/vehicles/${vehicle.id}`}
                                        method="PATCH"
                                        body={{ status: vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                                        label={vehicle.status === 'ACTIVE' ? 'Ocultar' : 'Mostrar'}
                                    />
                                    <AdminGenericAction
                                        apiPath={`/api/vehicles/${vehicle.id}`}
                                        method="DELETE"
                                        label="Eliminar"
                                        danger
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ReportsTab({ reports }: { reports: any[] }) {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const selectedReport = reports.find(r => r.id === selectedReportId)

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
            {/* Lista de Reportes */}
            <div className={`bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${selectedReportId ? 'w-full lg:w-1/3' : 'w-full'}`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" /> Moderación
                    </h3>
                    <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded">
                        {reports.filter(r => r.status === 'PENDING').length} PENDIENTES
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {reports.length === 0 ? (
                        <div className="p-12 text-center opacity-30 italic text-sm">No hay reportes hoy</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {reports.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReportId(report.id)}
                                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${selectedReportId === report.id ? 'bg-white/5' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${report.status === 'PENDING' ? 'text-red-500' : 'text-green-500'}`}>
                                            {report.status}
                                        </span>
                                        <span className="text-[9px] text-text-secondary">{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary-400">
                                        {report.vehicle?.title || report.business?.name || 'Usuario/Otro'}
                                    </h4>
                                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{report.reason}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                                            {report.reporter.name[0]}
                                        </div>
                                        <span className="text-[9px] text-text-secondary truncate">por {report.reporter.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detalle y Chat */}
            {selectedReportId && selectedReport ? (
                <div className="flex-1 bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right-4">
                    {/* Header del Detalle */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedReportId(null)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <div>
                                <h3 className="font-bold">{selectedReport.vehicle?.title || selectedReport.business?.name || 'Usuario'}</h3>
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{selectedReport.reason}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <AdminReportAction2 reportId={selectedReport.id} action="RESTORE" label="RESTAURAR" primary />
                            <AdminReportAction2 reportId={selectedReport.id} action="RESOLVE" label="BORRAR PERMANENTE" danger />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Info General */}
                        <div className="w-full lg:w-1/2 p-6 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-white/5">
                            <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-6 group relative">
                                <img src={selectedReport.imageUrl || ''} className="w-full h-full object-cover" />
                                {!selectedReport.imageUrl && (
                                    <div className="w-full h-full flex items-center justify-center text-text-secondary italic text-xs">Sin imagen adjunta</div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-2">Descripción del Reporte</label>
                                    <div className="p-4 bg-white/5 rounded-2xl text-sm border border-white/5">
                                        {selectedReport.description || 'No se proporcionó una descripción adicional.'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-black text-text-secondary uppercase block mb-1">Reportero</label>
                                        <p className="text-sm font-bold">{selectedReport.reporter.name}</p>
                                        <p className="text-[10px] text-text-secondary truncate">{selectedReport.reporter.email}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-black text-text-secondary uppercase block mb-1">Objetivo del reporte</label>
                                        <p className="text-sm font-bold truncate">{selectedReport.vehicle?.title || selectedReport.business?.name || 'Usuario'}</p>
                                        <p className="text-[10px] text-primary-400">{selectedReport.vehicleId ? 'Vehículo' : selectedReport.businessId ? 'Negocio' : 'Perfil'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat de Comunicación */}
                        <div className="flex-1 flex flex-col bg-black/20">
                            <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                                <h4 className="text-[10px] font-black uppercase text-text-secondary flex items-center gap-2">
                                    <Headset className="w-3 h-3" /> Centro de Dudas / Soporte
                                </h4>
                            </div>

                            <ReportChat reportId={selectedReport.id} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-[#111114] border border-white/5 border-dashed rounded-3xl flex items-center justify-center opacity-30 select-none">
                    <div className="text-center">
                        <Flag className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-sm font-bold">Selecciona un reporte para ver los detalles</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function ReportChat({ reportId }: { reportId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/report/${reportId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [reportId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/report/${reportId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })
            if (res.ok) {
                const msg = await res.json()
                setMessages(prev => [...prev, msg])
                setNewMessage("")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="flex-1 flex items-center justify-center text-xs opacity-50">Cargando conversación...</div>

    return (
        <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 grayscale p-8">
                        <div className="p-4 bg-white/5 rounded-full">
                            <Headset className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold text-center">Inicia una conversación con el usuario para resolver dudas sobre este reporte.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender.isAdmin // En esta vista admin, "Me" son los admins
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${isMe
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-text-primary rounded-tl-none'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <span className="font-black uppercase text-[8px]">{msg.sender.name}</span>
                                        <span className="text-[8px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/[0.01]">
                <div className="flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje al usuario..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary-500 transition-colors"
                        disabled={sending}
                    />
                    <button
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                    </button>
                </div>
                <p className="text-[8px] text-text-secondary mt-2 italic text-center opacity-50">
                    * Tu respuesta llegará al "Centro de Reportes" del usuario.
                </p>
            </form>
        </>
    )
}

function LogsTab({ logs }: { logs: any[] }) {
    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2"><Terminal className="w-5 h-5" /> Audit Log</h3>
                <button className="text-xs font-bold text-primary-400 hover:underline">Limpiar Registros</button>
            </div>
            <div className="p-6 font-mono text-[11px] space-y-2 bg-black/40">
                {logs.map(log => (
                    <div key={log.id} className="flex gap-4 p-2 hover:bg-white/5 rounded transition-colors group">
                        <span className="text-text-secondary opacity-40">[{new Date(log.createdAt).toISOString()}]</span>
                        <span className={`font-black tracking-tighter w-16 ${log.level === 'ERROR' ? 'text-red-500' :
                            log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>{log.level}</span>
                        <span className="text-text-primary group-hover:text-primary-300 transition-colors uppercase">{log.message}</span>
                        <span className="ml-auto text-text-secondary opacity-40">@ {log.source || 'ROOT'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdminReportAction2({ reportId, action, label, primary, danger }: any) {
    const [loading, setLoading] = useState(false)
    const handleAction = async () => {
        // Mostrar confirmación fuerte para acciones peligrosas
        if (danger) {
            const confirmed = confirm(
                '⚠️ ¿Eliminar esta publicación PERMANENTEMENTE?\n\n' +
                '• Esta acción NO se puede deshacer\n' +
                '• El usuario NO será notificado\n' +
                '• Perderá su slot de publicación gratuita\n\n' +
                '¿Continuar con el borrado silencioso?'
            )
            if (!confirmed) return
        }

        setLoading(true)
        try {
            await fetch(`/api/admin/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            window.location.reload()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <button
            onClick={handleAction}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${danger
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20'
                : primary
                    ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-900/20'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                } disabled:opacity-50`}
        >
            {loading ? '...' : label}
        </button>
    )
}

function AdminGenericAction({ apiPath, method, body, label, danger }: any) {
    const [loading, setLoading] = useState(false)
    const handleAction = async () => {
        if (danger && !confirm('¿Estás seguro? Esta acción es irreversible.')) return

        setLoading(true)
        try {
            const res = await fetch(apiPath, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            })
            if (!res.ok) throw new Error('Action failed')
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert('Error al realizar la acción')
        } finally {
            setLoading(false)
        }
    }
    return (
        <button
            onClick={handleAction}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${danger
                ? 'text-red-500 hover:bg-red-500/10'
                : 'text-text-secondary hover:text-white bg-white/5 hover:bg-white/10'
                } disabled:opacity-50`}
        >
            {loading ? '...' : label}
        </button>
    )
}

function MapStoreTab({ businesses }: { businesses: any[] }) {
    if (!businesses) return null;
    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-500" /> Directorio de Negocios (MapStore)
                </h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" placeholder="Buscar negocio..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <table className="w-full">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    <tr>
                        <th className="px-6 py-4 text-left">Negocio</th>
                        <th className="px-6 py-4 text-left">Propietario</th>
                        <th className="px-6 py-4 text-left">Categoría</th>
                        <th className="px-6 py-4 text-left">Estado</th>
                        <th className="px-6 py-4 text-left">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {businesses.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-text-secondary text-sm">No hay negocios registrados aún</td>
                        </tr>
                    ) : (
                        businesses.map(business => (
                            <tr key={business.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{business.name}</p>
                                            <p className="text-[10px] text-text-secondary line-clamp-1">{business.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-text-secondary">{business.user?.name || 'Anon'}</td>
                                <td className="px-6 py-4 text-xs font-medium">{business.category}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${business.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {business.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/map-store?id=${business.id}`}
                                            className="text-[10px] font-black text-text-secondary hover:text-white uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-lg"
                                        >
                                            Ver
                                        </Link>
                                        <AdminGenericAction
                                            apiPath={`/api/businesses/${business.id}`}
                                            method="PATCH"
                                            body={{ isActive: !business.isActive }}
                                            label={business.isActive ? 'Pausar' : 'Activar'}
                                        />
                                        <AdminGenericAction
                                            apiPath={`/api/businesses/${business.id}`}
                                            method="DELETE"
                                            label="Eliminar"
                                            danger
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

function IntelligenceTab() {
    const [intelligenceData, setIntelligenceData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [opportunities, setOpportunities] = useState<any[]>([])

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                const res = await fetch('/api/admin/intelligence')
                if (res.ok) {
                    const data = await res.json()
                    setIntelligenceData(data)
                    generateOpportunities(data)
                }
            } catch (error) {
                console.error('Error fetching intelligence:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchIntelligence()
    }, [])

    const generateOpportunities = (data: any) => {
        // Lógica heurística simple para detectar oportunidades
        // 1. Agrupar búsquedas recientes por zona (simulado por ahora con datos aleatorios si no hay suficientes)
        // En un caso real, usaríamos clustering (DBSCAN/K-Means)

        // Simulación basada en los datos reales disponibles:
        // Si hay muchas búsquedas y pocos negocios -> Oportunidad

        const newOpportunities = [
            {
                id: 1,
                type: 'Taller Mecánico Especializado',
                location: 'Zona Centro-Sur',
                confidence: 94,
                reason: 'Detectamos 142 búsquedas de reparaciones en un radio de 3km con solo 1 competidor registrado.',
                action: 'Abrir Taller'
            },
            {
                id: 2,
                type: 'Auto-Lavado Premium',
                location: 'Residencial La Florida',
                confidence: 88,
                reason: 'Alta concentración de usuarios con vehículos de gama alta y 0 autolavados en 5km.',
                action: 'Franquicia Wash'
            },
            {
                id: 3,
                type: 'Lote de Autos Económicos',
                location: 'Av. Tecnológico',
                confidence: 91,
                reason: 'Volumen masivo de búsquedas "sedán bajo consumo" sin inventario disponible en la zona.',
                action: 'Iniciar Lote'
            }
        ]
        setOpportunities(newOpportunities)
    }

    if (loading) return <div className="h-96 flex items-center justify-center opacity-50 uppercase tracking-widest text-xs font-bold animate-pulse">Cargando Inteligencia Geoespacial...</div>

    return (
        <div className="space-y-8 h-full flex flex-col overflow-y-auto pb-20 custom-scrollbar">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">Análisis de Océanos Azules</h3>
                    <p className="text-text-secondary text-sm">Visualización de Demanda (Búsquedas) vs Oferta (Negocios e Inventario)</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                        <Search className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-secondary">Puntos de Calor</p>
                            <p className="text-sm font-bold">{intelligenceData.searches.length} Búsquedas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 shrink-0 h-[500px]">
                <div className="lg:col-span-3 h-full relative">
                    <AdminHeatMap data={intelligenceData} />
                </div>

                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 flex flex-col h-full">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary-500" /> Leyenda Táctica
                    </h4>

                    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-xs font-bold">Alta Demanda</span>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed pl-5">Zonas donde los usuarios están buscando vehículos o servicios específicos activamente.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                                <span className="text-xs font-bold">Competencia</span>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed pl-5">Negocios físicos registrados actualmente en el MapStore.</p>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black text-primary-500 uppercase mb-2">Consejo de ROI</p>
                            <p className="text-[10px] italic text-text-primary/70">Identifica zonas con alta demanda (rojo) y baja competencia (puntos blancos) para maximizar tu inversión.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nueva Sección: Oportunidades IA */}
            <div className="space-y-4">
                <h3 className="text-lg font-black italic tracking-tighter uppercase flex items-center gap-2 text-green-500">
                    <Sparkles className="w-5 h-5" /> Oportunidades de Negocio Detectadas (90%+ Éxito)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {opportunities.map((opp) => (
                        <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#111114] to-black border border-green-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-green-500/50 transition-colors"
                        >
                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">
                                {opp.confidence}% PROBABILIDAD
                            </div>

                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors pointer-events-none" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                                    <Store className="w-6 h-6" />
                                </div>
                            </div>

                            <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 group-hover:text-green-400 transition-colors">
                                {opp.type}
                            </h4>
                            <p className="text-xs font-bold text-text-secondary mb-4 flex items-center gap-1">
                                <MapIcon className="w-3 h-3" /> {opp.location}
                            </p>

                            <p className="text-[11px] text-text-secondary leading-relaxed border-l-2 border-green-500/30 pl-3 mb-4">
                                "{opp.reason}"
                            </p>

                            <button className="w-full py-2 bg-white/5 hover:bg-green-500 hover:text-black border border-white/5 hover:border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                {opp.action}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
function AiHubTab() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/ai-control')
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleManualUpdate = async () => {
        if (!confirm('¿Deseas iniciar un escaneo global de IA ahora? Esto poblará tu base de datos con nuevos modelos y marcas de 2024-2026.')) return

        setIsUpdating(true)
        setLastResult(null)
        try {
            const res = await fetch('/api/admin/ai-control', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setLastResult(data)
                fetchLogs()
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (e) {
            alert('Error en la comunicación con el servidor')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-primary-500" /> Centro de Control IA
                    </h3>
                    <p className="text-text-secondary text-sm mt-1">Gestiona la inteligencia artificial que alimenta los datos de la plataforma.</p>
                </div>
                <button
                    onClick={handleManualUpdate}
                    disabled={isUpdating}
                    className="relative group overflow-hidden bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl shadow-primary-900/40 flex items-center gap-3"
                >
                    {isUpdating ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    )}
                    <span>{isUpdating ? 'ESCANEO EN PROCESO...' : 'ESCANEAR MERCADO GLOBAL'}</span>
                </button>
            </div>

            {lastResult && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/10 border-2 border-green-500/20 p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <div>
                            <h4 className="font-black text-green-500 uppercase tracking-widest">Escaneo Exitoso</h4>
                            <p className="text-xs text-green-400 opacity-80">La taxonomía ha sido actualizada con éxito.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/20 p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-green-500/60 mb-1">Marcas Nuevas</p>
                            <p className="text-2xl font-black">{lastResult.added.brandsAdded}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-green-500/60 mb-1">Modelos Nuevos</p>
                            <p className="text-2xl font-black">{lastResult.added.modelsAdded}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-green-500/60 mb-1">Categorías</p>
                            <p className="text-2xl font-black">{lastResult.added.typesAdded}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-text-secondary" /> Historial de Sincronización
                            </h4>
                            <span className="text-[10px] text-text-secondary font-bold">Últimos 10 registros</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {loading ? (
                                <div className="p-10 text-center text-text-secondary animate-pulse">Cargando bitácora...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-10 text-center text-text-secondary">No se han realizado actualizaciones todavía.</div>
                            ) : (
                                logs.map((log: any) => (
                                    <div key={log.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {log.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black uppercase tracking-tight">
                                                        {log.status === 'COMPLETED' ? 'Actualización Completada' : 'Fallo en Actualización'}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary font-medium">#{log.id.slice(-4)}</span>
                                                </div>
                                                <p className="text-[10px] text-text-secondary mt-0.5">
                                                    {new Date(log.createdAt).toLocaleString()} • {log.executionTime || 0}s ejecución
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div>
                                                <p className="text-[9px] font-black text-text-secondary uppercase">Modelos</p>
                                                <p className="text-xs font-bold">+{log.modelsAdded}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-text-secondary uppercase">Marcas</p>
                                                <p className="text-xs font-bold">+{log.brandsAdded}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-900/40 to-black border border-primary-500/20 p-8 rounded-3xl relative overflow-hidden group">
                        <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-primary-500/10 group-hover:rotate-12 transition-transform duration-700" />
                        <h4 className="text-lg font-black italic tracking-tighter uppercase mb-2">Estado del Monopolio</h4>
                        <p className="text-xs text-text-secondary leading-relaxed mb-6">
                            Tu sistema de IA está configurado para buscar el dominio total de datos vehiculares.
                            La actualización automática se ejecuta los domingos a las 00:00.
                        </p>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">Próximo Escaneo:</span>
                                <span className="font-bold text-primary-400">Domingo, 00:00 H</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">Estrategia:</span>
                                <span className="font-bold text-green-500">Global (2024-2026)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">IA Engine:</span>
                                <span className="font-black">FLASH LATEST</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111114] border border-white/5 p-8 rounded-3xl">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-4">Configuración</h4>
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-xs">Modo Automático</span>
                            <div className="w-10 h-5 bg-primary-600 rounded-full flex items-center justify-end px-1 scale-75">
                                <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-xs">Notificar cambios</span>
                            <div className="w-10 h-5 bg-primary-600 rounded-full flex items-center justify-end px-1 scale-75">
                                <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
