"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportImageButtonProps {
    imageUrl: string
    vehicleId?: string
    businessId?: string
    targetUserId?: string
    className?: string
}

const REPORT_REASONS = [
    "Contenido Sexual / Desnudos",
    "Violencia / Sangre",
    "Acoso / Odio",
    "Spam / Estafa",
    "No es un vehículo / negocio real",
    "Otro"
]

export default function ReportImageButton({
    imageUrl,
    vehicleId,
    businessId,
    targetUserId,
    className = "absolute top-2 right-2"
}: ReportImageButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState(REPORT_REASONS[0])
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    description,
                    imageUrl,
                    vehicleId,
                    businessId,
                    targetUserId
                })
            })

            if (res.ok) {
                setSuccess(true)
                setTimeout(() => {
                    setIsOpen(false)
                    setSuccess(false)
                    setDescription("")
                }, 2000)
            } else {
                alert("Error al enviar reporte. Por favor intenta de nuevo.")
            }
        } catch (error) {
            console.error(error)
            alert("Error de conexión.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(true)
                }}
                className={`p-1.5 bg-black/20 hover:bg-red-600/80 text-white rounded-full backdrop-blur-sm transition ${className}`}
                title="Reportar imagen"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(false)
                    }}
                >
                    <div
                        className="bg-surface border border-surface-highlight rounded-xl w-full max-w-md p-6 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!success ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Reportar Contenido
                                </h3>

                                <p className="text-sm text-text-secondary">
                                    Ayuda a mantener segura la comunidad de CarMatch Social. Tu reporte es anónimo.
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Motivo</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-background border border-surface-highlight rounded-lg px-3 py-2 text-text-primary"
                                    >
                                        {REPORT_REASONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Detalles adicionales (opcional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-background border border-surface-highlight rounded-lg px-3 py-2 text-text-primary h-24 resize-none"
                                        placeholder="Describe el problema..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-text-secondary hover:text-text-primary"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg disabled:opacity-50"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar Reporte'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">¡Reporte Enviado!</h3>
                                <p className="text-text-secondary">Gracias por ayudar a mantener la comunidad segura.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
