"use client"

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle, X } from 'lucide-react'

interface ReportBusinessModalProps {
    businessId: string
    businessName: string
    onClose: () => void
    onSuccess: () => void
}

export default function ReportBusinessModal({ businessId, businessName, onClose, onSuccess }: ReportBusinessModalProps) {
    const { t } = useLanguage()
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reasons = [
        { id: 'wrong_category', label: 'map_store.report.wrong_category' },
        { id: 'fake_business', label: 'map_store.report.fake_business' },
        { id: 'incorrect_info', label: 'map_store.report.incorrect_info' },
        { id: 'duplicate', label: 'map_store.report.duplicate' },
        { id: 'offensive', label: 'map_store.report.offensive' },
        { id: 'other', label: 'map_store.report.other' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    reason,
                    description,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al enviar reporte')
            }

            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-surface-highlight rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scale-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-white transition"
                    disabled={loading}
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">Reportar Negocio</h3>
                        <p className="text-xs text-text-secondary">{businessName}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-secondary">
                            Motivo del Reporte
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {reasons.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setReason(r.id)}
                                    className={`
                                        w-full text-left px-4 py-3 rounded-xl border text-sm transition-all
                                        ${reason === r.id
                                            ? 'bg-red-500/10 border-red-500/50 text-red-400 font-bold'
                                            : 'bg-surface-highlight/20 border-surface-highlight/50 text-text-secondary hover:border-surface-highlight hover:text-text-primary'
                                        }
                                    `}
                                >
                                    {t(r.label) || r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-secondary">
                            Descripción Adicional
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Proporciona más detalles para ayudarnos a revisar..."
                            className="w-full bg-surface-highlight/20 border border-surface-highlight/50 rounded-xl p-3 text-sm text-text-primary focus:border-red-500 outline-none h-24 resize-none transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <p className="text-[10px] text-text-secondary italic mb-4 text-center">
                            * El negocio será ocultado inmediatamente mientras el administrador revisa tu reporte.
                        </p>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className={`
                                w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-xl
                                ${loading || !reason
                                    ? 'bg-surface-highlight text-text-secondary border border-surface-highlight cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20 active:scale-95'
                                }
                            `}
                        >
                            {loading ? 'Enviando...' : 'Enviar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
