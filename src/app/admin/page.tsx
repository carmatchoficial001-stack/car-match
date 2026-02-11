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
    Coins,
    Megaphone
} from 'lucide-react'
import dynamic from 'next/dynamic'
// ... imports
import dynamic from 'next/dynamic'
const AdminHeatMap = dynamic(() => import('@/components/AdminHeatMap'), { ssr: false })
const PublicityTab = dynamic(() => import('@/components/admin/PublicityTab'), { ssr: false })
const AdminMobileNav = dynamic(() => import('@/components/admin/AdminMobileNav'), { ssr: false })
import QRCodeModal from '@/components/QRCodeModal'
// ... (rest of imports)

// ... inside AdminView type definition
type AdminView = 'overview' | 'users' | 'inventory' | 'map-store' | 'intelligence' | 'reports' | 'logs' | 'ai-hub' | 'publicity'

// ... inside AdminDashboard component
const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Panel de Control' },
    { id: 'publicity', icon: Megaphone, label: 'Publicidad' }, // New Item
    { id: 'intelligence', icon: Activity, label: 'Inteligencia' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'inventory', icon: Car, label: 'Inventario' },
    { id: 'map-store', icon: Store, label: 'MapStore' },
    { id: 'ai-hub', icon: Cpu, label: 'AI Hub' },
    { id: 'reports', icon: Flag, label: 'Reportes', badge: stats.reports?.filter(r => r.status === 'PENDING').length || 0 },
    { id: 'logs', icon: Terminal, label: 'Registros' },
]

// ... inside render return
{ activeView === 'overview' && <OverviewTab stats={stats} handleRunAnalyst={handleRunAnalyst} isAnalyzing={isAnalyzing} aiAnalysis={aiAnalysis} /> }
{ activeView === 'publicity' && <PublicityTab /> }
{ activeView === 'intelligence' && <IntelligenceTab /> }
{ activeView === 'users' && <UsersTab users={stats.users.recent} /> }
{ activeView === 'inventory' && <InventoryTab vehicles={stats.vehicles.recent} /> }
{ activeView === 'map-store' && <MapStoreTab businesses={stats.businesses.recent} /> }
{ activeView === 'ai-hub' && <AiHubTab /> }
{ activeView === 'reports' && <ReportsTab reports={stats.reports} /> }
{ activeView === 'logs' && <LogsTab logs={stats.logs} /> }
return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary-500/30">
        {/* Desktop Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#09090b] border-r border-white/10 p-6 hidden md:flex flex-col z-50">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-900/40">
                    <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tighter italic">CarMatch <span className="text-primary-500">OS</span></h1>
                    <p className="text-[10px] text-text-secondary font-mono tracking-widest uppercase">Admin Neural Interface</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as AdminView)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${activeView === item.id
                            ? 'bg-white/10 text-white shadow-lg border border-white/5'
                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-primary-400' : 'group-hover:text-primary-400 transition-colors'}`} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                        </div>
                        {item.badge && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-900/40 animate-pulse">
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                <button onClick={() => setShowQRModal(true)} className="w-full flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-all">
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm font-bold">Descargar App</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-bold">Configuración</span>
                </button>
                <div className="p-4 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 mt-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="font-black text-indigo-400">R</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Ruben Admin</p>
                            <p className="text-[10px] text-text-secondary">Super User</p>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-secondary rounded-lg text-xs font-bold transition flex items-center justify-center gap-2">
                        <LogOut className="w-3 h-3" /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:pl-72 min-h-screen bg-[#000000] relative pb-24 md:pb-0">

            {/* Mobile Header */}
            <div className="md:hidden p-6 pb-2 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-40 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary-500" />
                    <h1 className="font-black text-lg tracking-tighter italic">CarMatch OS</h1>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-highlight overflow-hidden">
                    <img src={session?.user?.image || "https://ui-avatars.com/api/?name=Admin"} alt="Profile" />
                </div>
            </div>

            <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeView === 'overview' && <OverviewTab stats={stats} handleRunAnalyst={handleRunAnalyst} isAnalyzing={isAnalyzing} aiAnalysis={aiAnalysis} />}
                        {activeView === 'publicity' && <PublicityTab />}
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

        <AdminMobileNav activeView={activeView} setActiveView={setActiveView} menuItems={menuItems} />

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
                <StatCard2 icon={Users} label="Usuarios Registrados" value={stats.registrations?.total || stats.users.total} trend="Total" color="purple" simple />
                <StatCard2 icon={TrendingUp} label="Registros Este Mes" value={stats.registrations?.thisMonth || 0} trend="+12%" color="green" simple />
                <StatCard2 icon={Car} label="Inventario" value={stats.vehicles.active} trend="+5%" color="blue" simple />
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
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                {users.map(user => (
                    <div key={user.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-highlight overflow-hidden">
                                    <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">{user.name}</h4>
                                    <p className="text-xs text-text-secondary">{user.email}</p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded ${user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {user.isAdmin ? 'ADMIN' : 'USER'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-text-secondary">Créditos</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${user.credits > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                        {user.credits}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSelectedUser(user)
                                            setShowCreditModal(true)
                                        }}
                                        className="p-1 bg-white/10 rounded-lg text-amber-500/80 hover:text-amber-400"
                                    >
                                        <Coins size={12} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-text-secondary">Estado</span>
                                <span className={`text-[10px] font-black flex items-center gap-1.5 ${user.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                    {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-[10px] text-text-secondary">
                                Reg: {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                                <AdminGenericAction
                                    apiPath={`/api/admin/users/${user.id}`}
                                    method="PATCH"
                                    body={{ isActive: !user.isActive }}
                                    label={user.isActive ? 'Bloquear' : 'Activar'}
                                />
                                <AdminGenericAction
                                    apiPath={`/api/admin/users/${user.id}`}
                                    method="DELETE"
                                    label="Eliminar"
                                    danger
                                />
                            </div>
                        </div>
                    </div>
                ))}
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                        {/* Header: Image & Title */}
                        <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded-lg bg-black overflow-hidden border border-white/10 shrink-0">
                                <img src={vehicle.images?.[0]} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-white line-clamp-1">{vehicle.title}</h4>
                                <p className="text-xs text-text-secondary truncate">{vehicle.user.name}</p>
                                <p className="text-sm font-black text-primary-400 mt-1">
                                    {Number(vehicle.price).toLocaleString('es-MX', { style: 'currency', currency: vehicle.currency || 'MXN' })}
                                </p>
                            </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${vehicle.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {vehicle.status}
                            </span>
                            <span className="text-[9px] text-text-secondary uppercase tracking-widest">
                                {vehicle.city || 'Ubicación n/a'}
                            </span>
                        </div>

                        {/* Actions Footer */}
                    </div>
                        </div>
        </div>
    ))
}
            </div >
        </div >
    )
}

function ReportsTab({ reports }: { reports: any[] }) {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const selectedReport = reports.find(r => r.id === selectedReportId)

    useEffect(() => {
        if (selectedReportId) window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [selectedReportId])

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
            {/* Lista de Reportes */}
            <div className={`bg-[#111114] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${selectedReportId ? 'hidden lg:flex lg:w-1/3' : 'w-full h-full'}`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" /> Moderación
                    </h3>
                    <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded">
                        {reports?.filter(r => r.status === 'PENDING').length || 0} PENDIENTES
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {!reports || reports.length === 0 ? (
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
                                            {report.reporter?.name?.[0] || 'I'}
                                        </div>
                                        <span className="text-[9px] text-text-secondary truncate">por {report.reporter?.name || 'Invitado'}</span>
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
                        <div className="flex flex-wrap gap-2">
                            {/* Link to Publication */}
                            {(selectedReport.vehicleId || selectedReport.vehicle?.id || selectedReport.businessId || selectedReport.business?.id) && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const id = selectedReport.vehicleId || selectedReport.vehicle?.id;
                                        const bizId = selectedReport.businessId || selectedReport.business?.id;
                                        const url = id ? `/vehicle/${id}` : `/map-store?id=${bizId}`;
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-primary-500 hover:text-white transition-all shadow-xl active:scale-95 z-50 pointer-events-auto"
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    Ver Publicación
                                </button>
                            )}
                            <AdminReportAction2 reportId={selectedReport.id} action="RESTORE" label="APROBAR" primary />
                            <AdminReportAction2 reportId={selectedReport.id} action="RESOLVE" label="ELIMINAR" danger />
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
                                        <p className="text-sm font-bold">{selectedReport.reporter?.name || 'Invitado'}</p>
                                        <p className="text-[10px] text-text-secondary truncate">{selectedReport.reporter?.email || 'Sin correo'}</p>
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
                        const isMe = msg.sender?.isAdmin // En esta vista admin, "Me" son los admins
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${isMe
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-text-primary rounded-tl-none'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <span className="font-black uppercase text-[8px]">{msg.sender?.name || 'Invitado'}</span>
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
        <div className="space-y-12 h-full flex flex-col overflow-y-auto pb-20 custom-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-6">
                <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary-500" /> CarMatch Intelligence 360°
                    </h3>
                    <p className="text-text-secondary text-sm font-medium">Análisis de Océanos Azules: Visualizando la brecha entre Demanda vs Oferta</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Demanda (Búsquedas)</p>
                            <p className="text-xl font-black italic tracking-tighter">{intelligenceData.searches?.length || 0}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                            <Car className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Oferta (Inventario)</p>
                            <p className="text-xl font-black italic tracking-tighter">{intelligenceData.vehicles?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Radar de Demanda Profunda */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Top Marcas Buscadas */}
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Target className="w-32 h-32 text-primary-500" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-primary-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Marcas con Mayor Deseo
                    </h4>
                    <div className="space-y-6">
                        {intelligenceData.stats?.topBrands.length > 0 ? (
                            intelligenceData.stats.topBrands.map(([brand, count]: any, i: number) => (
                                <div key={brand} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-black tracking-tight group-hover:text-primary-400 transition-colors">
                                            {i + 1}. {brand}
                                        </span>
                                        <span className="text-xs font-bold text-text-secondary italic">{count} búsquedas</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / intelligenceData.stats.topBrands[0][1]) * 100}%` }}
                                            className="h-full bg-primary-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs italic opacity-40">No hay datos suficientes hoy</p>
                        )}
                    </div>
                </div>

                {/* 2. Top Modelos Específicos */}
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl lg:col-span-2">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-emerald-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Modelos con Mayor Tracción (IA)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {intelligenceData.stats?.topModels.length > 0 ? (
                            intelligenceData.stats.topModels.map(([model, count]: any, i: number) => (
                                <div key={model} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black italic">
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black tracking-tight uppercase group-hover:text-emerald-400">{model}</p>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{count} Interesados</p>
                                    </div>
                                    <div className="text-xs font-black text-emerald-500">
                                        {Math.round((count / intelligenceData.searches.length) * 100)}%
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs italic opacity-40">Analizando modelos deseados...</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 shrink-0 min-h-[500px]">
                <div className="lg:col-span-3 h-full relative bg-[#111114] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl group">
                    <div className="absolute top-6 left-8 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Live Search Map</span>
                    </div>
                    <AdminHeatMap data={intelligenceData} />
                </div>

                <div className="bg-[#111114] border border-white/5 rounded-[40px] p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Target className="w-40 h-40" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-primary-500">
                        <Target className="w-4 h-4 text-primary-500" /> Legenda Táctica
                    </h4>

                    <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                        <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                <span className="text-xs font-black uppercase">Alta Demanda</span>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">Búsquedas activas detectadas por la IA en esta coordenada.</p>
                        </div>

                        <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white border border-black shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                                <span className="text-xs font-black uppercase">Competencia</span>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">Negocios de CarMatch registrados actualmente.</p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Insight de ROI Maestro</p>
                            <p className="text-[10px] italic text-text-primary/70 border-l-2 border-primary-500 pl-4 py-2 leading-relaxed">
                                "La zona con el punto rojo más intenso y menos puntos blancos representa el **Océano Azul** donde un negocio nuevo tendrá éxito inmediato."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Radar de Preferencias Técnicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Transmisión', key: 'transmissions', icon: Settings, color: 'text-blue-400' },
                    { label: 'Combustible', key: 'fuels', icon: Coins, color: 'text-amber-400' },
                    { label: 'Colores Populares', key: 'colors', icon: Sparkles, color: 'text-pink-400' }
                ].map((trend) => (
                    <div key={trend.key} className="bg-[#111114] border border-white/5 p-8 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <trend.icon className={`w-5 h-5 ${trend.color}`} />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{trend.label}</h4>
                        </div>
                        <div className="space-y-4">
                            {intelligenceData.stats?.techTrends?.[trend.key]?.map(([val, count]: any) => (
                                <div key={val} className="flex justify-between items-center bg-white/[0.02] px-4 py-2.5 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold">{val}</span>
                                    <span className="text-[10px] font-black text-text-secondary">{count}</span>
                                </div>
                            ))}
                            {(!intelligenceData.stats?.techTrends?.[trend.key] || intelligenceData.stats.techTrends[trend.key].length === 0) && (
                                <p className="text-xs italic opacity-30 text-center py-4">Recopilando datos...</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Nueva Sección: Oportunidades IA Reforzada */}
            <div className="space-y-8">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-green-500">
                    <Sparkles className="w-7 h-7" /> Océanos Azules para Socios Estratégicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {opportunities.map((opp) => (
                        <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-[#121215] to-black border border-green-500/10 p-8 rounded-[32px] relative overflow-hidden group hover:border-green-400/40 transition-all hover:shadow-[0_20px_50px_rgba(34,197,94,0.1)]"
                        >
                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl z-10 shadow-xl">
                                {opp.confidence}% ÉXITO
                            </div>

                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-green-500/10 rounded-2xl text-green-400 group-hover:scale-110 transition-all shadow-inner">
                                    <Store className="w-7 h-7" />
                                </div>
                            </div>

                            <h4 className="text-base font-black uppercase tracking-tight text-white mb-2 group-hover:text-green-400 transition-colors">
                                {opp.type}
                            </h4>
                            <p className="text-xs font-bold text-text-secondary mb-6 flex items-center gap-2 uppercase tracking-widest opacity-80">
                                <MapIcon className="w-3.5 h-3.5 text-green-500" /> {opp.location}
                            </p>

                            <p className="text-xs text-text-secondary leading-relaxed border-l-2 border-green-500/20 pl-4 mb-8 italic">
                                "{opp.reason}"
                            </p>

                            <button className="w-full py-4 bg-white/[0.03] hover:bg-green-500 hover:text-black border border-white/10 hover:border-transparent rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl">
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


