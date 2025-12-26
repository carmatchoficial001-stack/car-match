'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatNumber } from '@/lib/vehicleTaxonomy'

interface SystemStats {
    users: { total: number; active: number }
    vehicles: { total: number; active: number }
    businesses: { total: number }
    chats: { total: number }
    appointments: { total: number; active: number }
    logs: Array<{
        id: string
        level: string
        message: string
        source: string | null
        createdAt: string
    }>
}

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t, locale } = useLanguage()
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState<any>(null)

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

    const getSystemHealth = () => {
        if (!stats) return 'unknown'
        const errorLogs = stats.logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length
        if (errorLogs > 10) return 'critical'
        if (errorLogs > 5) return 'degraded'
        return 'healthy'
    }

    const healthStatus = getSystemHealth()
    const healthColors = {
        healthy: 'bg-green-100 text-green-800 border-green-300',
        degraded: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        critical: 'bg-red-100 text-red-800 border-red-300',
        unknown: 'bg-gray-100 text-gray-800 border-gray-300'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-text-secondary">Error al cargar estadísticas</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="bg-surface border-b border-surface-highlight">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">🎛️ Panel de Control</h1>
                            <p className="text-text-secondary mt-1">Monitoreo y Estadísticas del Sistema</p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* System Health */}
                <div className={`p-6 rounded-2xl border-2 ${healthColors[healthStatus]}`}>
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">
                            {healthStatus === 'healthy' && '✅'}
                            {healthStatus === 'degraded' && '⚠️'}
                            {healthStatus === 'critical' && '🚨'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Estado del Sistema</h2>
                            <p className="text-sm opacity-80 capitalize">{healthStatus === 'healthy' ? 'Saludable' : healthStatus === 'degraded' ? 'Degradado' : 'Crítico'}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon="👥"
                        title="Usuarios"
                        value={stats.users.total}
                        subtitle={`${stats.users.active} activos`}
                        color="blue"
                        locale={locale}
                    />
                    <StatCard
                        icon="🚗"
                        title="Vehículos"
                        value={stats.vehicles.total}
                        subtitle={`${stats.vehicles.active} en venta`}
                        color="green"
                        locale={locale}
                    />
                    <StatCard
                        icon="🏢"
                        title="Negocios"
                        value={stats.businesses.total}
                        subtitle="MapStore"
                        color="purple"
                        locale={locale}
                    />
                    <StatCard
                        icon="💬"
                        title="Chats / Citas"
                        value={stats.chats.total}
                        subtitle={`${stats.appointments.active} citas activas`}
                        color="orange"
                        locale={locale}
                    />
                </div>

                {/* 🧠 SUPER ANALISTA IA DE NEGOCIOS */}
                <div className="bg-surface rounded-2xl border border-primary-600/30 overflow-hidden shadow-xl shadow-primary-900/10">
                    <div className="p-6 border-b border-surface-highlight flex items-center justify-between bg-primary-900/5">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="text-2xl">🧠</span> Super Analista de Negocios (IA)
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">Análisis profundo de oferta y demanda vehicular</p>
                        </div>
                        <button
                            onClick={handleRunAnalyst}
                            disabled={isAnalyzing}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Analizando...</span>
                                </>
                            ) : (
                                'Ejecutar Análisis Maestro'
                            )}
                        </button>
                    </div>

                    {aiAnalysis ? (
                        <div className="p-6 space-y-6 animate-fade-in">
                            <div className="p-4 bg-background/50 rounded-xl border border-surface-highlight">
                                <h3 className="font-bold text-primary-400 mb-2 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <span>📊</span> Resumen Ejecutivo
                                </h3>
                                <p className="text-text-primary text-sm leading-relaxed">{aiAnalysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {aiAnalysis.insights.map((insight: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${insight.priority === 'HIGH' ? 'bg-red-900/10 border-red-900/20' :
                                            insight.priority === 'MEDIUM' ? 'bg-yellow-900/10 border-yellow-900/20' :
                                                'bg-blue-900/10 border-blue-900/20'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${insight.priority === 'HIGH' ? 'bg-red-500 text-white' :
                                                    insight.priority === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                                                        'bg-blue-500 text-white'
                                                }`}>
                                                {insight.priority}
                                            </span>
                                            <span className="text-xs text-text-secondary">Observación #{idx + 1}</span>
                                        </div>
                                        <p className="text-text-primary text-sm font-bold mb-2">{insight.observation}</p>
                                        <p className="text-text-secondary text-xs">{insight.recommendation}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-green-900/5 rounded-xl border border-green-500/20">
                                <h3 className="font-bold text-green-500 mb-3 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <span>💡</span> Oportunidades de Reclutamiento
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {aiAnalysis.businessOppotunities.map((opp: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-background border border-green-500/30 text-green-400 rounded-full text-xs font-medium">
                                            + {opp}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-surface-highlight">
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-2 bg-background rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500"
                                            style={{ width: `${aiAnalysis.effectivenessScore}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-text-secondary font-bold uppercase">Efectividad: {aiAnalysis.effectivenessScore}%</span>
                                </div>
                                <span className="text-[10px] text-text-secondary italic">Análisis certificado por Gemini 1.5 Flash</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-4 opacity-20">📊</div>
                            <h3 className="text-text-secondary font-medium">No se ha ejecutado el análisis todavía.</h3>
                            <p className="text-text-secondary/60 text-sm mt-1">Pulsa el botón para que el analista maestro revise tu base de datos.</p>
                        </div>
                    )}
                </div>

                {/* Error Logs */}
                <div className="bg-surface rounded-2xl border border-surface-highlight overflow-hidden">
                    <div className="p-6 border-b border-surface-highlight">
                        <h2 className="text-xl font-bold text-text-primary">📋 Registros del Sistema</h2>
                        <p className="text-sm text-text-secondary mt-1">Últimos 50 eventos</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase">Nivel</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase">Mensaje</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase">Origen</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-highlight">
                                {stats.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                            No hay registros aún
                                        </td>
                                    </tr>
                                ) : (
                                    stats.logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-background/50 transition">
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                    log.level === 'ERROR' ? 'bg-orange-100 text-orange-700' :
                                                        log.level === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-primary max-w-md truncate">
                                                {log.message}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">
                                                {log.source || 'Sistema'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary" suppressHydrationWarning>
                                                {new Date(log.createdAt).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, title, value, subtitle, color, locale }: {
    icon: string
    title: string
    value: number
    subtitle: string
    color: 'blue' | 'green' | 'purple' | 'orange'
    locale: string
}) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600'
    }

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-2xl text-white shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{icon}</div>
                <h3 className="font-bold opacity-90">{title}</h3>
            </div>
            <div className="text-4xl font-bold mb-1" suppressHydrationWarning>{formatNumber(value, locale)}</div>
            <div className="text-sm opacity-80">{subtitle}</div>
        </div>
    )
}
