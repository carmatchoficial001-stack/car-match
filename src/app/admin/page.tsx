'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatNumber, formatPrice } from '@/lib/vehicleTaxonomy'
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
    RefreshCw
} from 'lucide-react'
import dynamic from 'next/dynamic'
const AdminHeatMap = dynamic(() => import('@/components/AdminHeatMap'), { ssr: false })
import QRCodeModal from '@/components/QRCodeModal'
import Link from 'next/link'

interface SystemStats {
    users: { total: number; active: number; recent: any[] }
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
}

type AdminView = 'overview' | 'users' | 'inventory' | 'mapstore' | 'intelligence' | 'reports' | 'logs' | 'ai-hub'

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t, locale } = useLanguage()
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
    }, [status])

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
        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'intelligence', icon: Activity, label: 'Inteligencia' },
        { id: 'users', icon: Users, label: 'Usuarios' },
        { id: 'inventory', icon: Car, label: 'Inventario' },
        { id: 'mapstore', icon: Store, label: 'MapStore' },
        { id: 'ai-hub', icon: Cpu, label: 'AI Hub' },
        { id: 'reports', icon: Flag, label: 'Reportes', badge: stats.reports.filter(r => r.status === 'PENDING').length },
        { id: 'logs', icon: Terminal, label: 'Logs del Sistema' },
    ]

    return (
        <div className="min-h-screen bg-[#0c0c0e] text-text-primary flex">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#111114] border-r border-white/5 transition-all duration-300 flex flex-col z-50`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/40">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    {isSidebarOpen && <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic">ADMIN</span>}
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as AdminView)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${activeView === item.id
                                ? 'bg-primary-600/10 text-primary-400'
                                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-primary-500' : 'group-hover:text-text-primary'}`} />
                            {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
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
                        <Headset className="w-5 h-5" />
                        {isSidebarOpen && <span className="font-bold text-sm">Soporte CarMatch</span>}
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center gap-3 px-3 py-3 text-text-secondary hover:text-white hover:bg-white/5 transition-all rounded-xl"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="text-sm">Salir al Portal</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-[#111114]/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/5 rounded-lg text-text-secondary"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <h2 className="text-lg font-bold capitalize">{activeView}</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* QR Code Button */}
                        <button
                            onClick={() => setShowQRModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600/10 hover:bg-primary-600/20 border border-primary-600/20 rounded-xl transition group"
                            title="Compartir CarMatch con QR"
                        >
                            <QrCode className="w-4 h-4 text-primary-400 group-hover:text-primary-300" />
                            <span className="text-xs font-bold text-primary-400 group-hover:text-primary-300 uppercase tracking-wider hidden sm:block">
                                Compartir App
                            </span>
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Healthy</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-text-primary">{session?.user?.name || 'Admin User'}</p>
                                <p className="text-[10px] text-text-secondary">Root Privileges</p>
                            </div>
                            <div className="w-8 h-8 bg-surface-highlight rounded-lg border border-white/10 overflow-hidden">
                                <img src={session?.user?.image || 'https://ui-avatars.com/api/?name=Admin'} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
                            {activeView === 'mapstore' && <MapStoreTab businesses={stats.businesses.recent} />}
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard2 icon={Users} label="Usuarios Totales" value={stats.users.total} trend="+12%" color="blue" />
                <StatCard2 icon={Car} label="Vehículos Activos" value={stats.vehicles.active} trend="+5%" color="purple" />
                <StatCard2 icon={Activity} label="Citas Programadas" value={stats.appointments.total} trend="+8%" color="green" />
                <StatCard2 icon={AlertCircle} label="Reportes Pendientes" value={stats.reports.filter((r: any) => r.status === 'PENDING').length} trend="Urgente" color="red" />
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

function StatCard2({ icon: Icon, label, value, trend, color }: any) {
    const variants: any = {
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        green: 'text-green-500 bg-green-500/10',
        red: 'text-red-500 bg-red-500/10',
    }
    return (
        <div className="bg-[#111114] border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${variants[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${color === 'red' ? 'bg-red-500 text-white' : 'bg-white/5 text-text-secondary'}`}>
                    {trend}
                </span>
            </div>
            <p className="text-text-secondary text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-4xl font-black italic tracking-tighter">{formatNumber(value, 'es')}</h4>
        </div>
    )
}

function UsersTab({ users }: { users: any[] }) {
    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">Gestión de Usuarios</h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" placeholder="Buscar usuario..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <table className="w-full">
                <thead className="bg-white/5">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Usuario</th>
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
                            <td className="px-6 py-4 text-sm font-bold text-primary-400">{formatPrice(vehicle.price, vehicle.currency || 'MXN', 'es')}</td>
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
    return (
        <div className="bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" /> Centro de Moderación
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                        <div className="aspect-video relative bg-black">
                            <img src={report.imageUrl || ''} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                            <div className="absolute top-3 right-3">
                                <span className={`text-[9px] font-black px-2 py-1 rounded bg-black/80 backdrop-blur shadow-xl ${report.status === 'PENDING' ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    {report.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex-1">
                            <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> {report.reason}
                            </h4>
                            <p className="text-xs text-text-secondary mt-1">{report.description || 'Sin descripción adicional.'}</p>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                        {report.reporter.name[0]}
                                    </div>
                                    <span className="text-[10px] text-text-secondary">por {report.reporter.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <AdminReportAction2 reportId={report.id} action="DISMISS" label="Ignorar" />
                                    <AdminReportAction2 reportId={report.id} action="RESOLVE" label="Resolver" primary />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
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

function AdminReportAction2({ reportId, action, label, primary }: any) {
    const [loading, setLoading] = useState(false)
    const handleAction = async () => {
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
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${primary
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

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                const res = await fetch('/api/admin/intelligence')
                if (res.ok) {
                    const data = await res.json()
                    setIntelligenceData(data)
                }
            } catch (error) {
                console.error('Error fetching intelligence:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchIntelligence()
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center opacity-50 uppercase tracking-widest text-xs font-bold animate-pulse">Cargando Inteligencia Geoespacial...</div>

    return (
        <div className="space-y-8 h-[calc(100vh-180px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
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

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 h-full relative">
                    <AdminHeatMap data={intelligenceData} />
                </div>

                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary-500" /> Leyenda Táctica
                    </h4>

                    <div className="space-y-6 flex-1 overflow-y-auto">
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
                            <p className="text-[10px] italic text-text-primary/70">"Busque zonas con nubes rojas intensas donde no haya puntos blancos. Esos son sus Océanos Azules."</p>
                        </div>
                    </div>

                    <button className="mt-8 w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 transition shadow-xl shadow-primary-900/40">
                        Exportar Mapa de Calor
                    </button>
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
                        <Cpu className="w-8 h-8 text-primary-500" /> Centro de Mando IA
                    </h3>
                    <p className="text-text-secondary text-sm mt-1">Monitorea y dispara actualizaciones del monopolio de datos automotrices.</p>
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
