// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useState } from 'react'
import { Coins, X, Loader2, CheckCircle2 } from 'lucide-react'
import ConfirmationModal from '@/components/ConfirmationModal'

interface ManageCreditsModalProps {
    isOpen: boolean
    onClose: () => void
    user: {
        id: string
        name: string
        credits: number
    }
    onSuccess: () => void
}

export default function ManageCreditsModal({ isOpen, onClose, user, onSuccess }: ManageCreditsModalProps) {
    const [amount, setAmount] = useState<string>('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setShowConfirm(true)
    }

    const executeAdjustment = async () => {
        setLoading(true)
        try {
            const finalAmount = parseInt(amount)

            if (isNaN(finalAmount)) {
                alert('Por favor, ingresa una cantidad válida')
                setLoading(false)
                setShowConfirm(false)
                return
            }

            console.log('🚀 Enviando ajuste de créditos:', {
                userId: user.id,
                amount: finalAmount,
                reason: reason || 'Ajuste manual'
            })

            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creditsModification: {
                        amount: finalAmount,
                        reason: reason || 'Ajuste manual de administrador'
                    }
                })
            })

            console.log('📡 Respuesta del servidor:', res.status)

            if (res.ok) {
                onSuccess()
                onClose()
                setAmount('')
                setReason('')
            } else {
                const errorData = await res.json().catch(() => ({}))
                alert(`Error: ${errorData.error || 'No se pudo actualizar los créditos'}`)
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión')
        } finally {
            setLoading(false)
            setShowConfirm(false)
        }
    }

    const amountNum = parseInt(amount) || 0
    const isNegative = amountNum < 0
    const newBalance = (user.credits || 0) + amountNum

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Coins size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Gestionar Créditos</h3>
                                <p className="text-xs text-gray-400">Usuario: {user.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Saldo Actual</p>
                                <p className="text-2xl font-bold text-white">{user.credits}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Nuevo Saldo</p>
                                <p className={`text-2xl font-bold ${newBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {newBalance}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Cantidad a Ajustar</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Ej: 10 o -5"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                * Usa números positivos para agregar y negativos para quitar.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Razón del Ajuste</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej: Bono de bienvenida, Corrección..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!amount || loading}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                            Aplicar Ajuste
                        </button>
                    </form>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={executeAdjustment}
                title="¿Confirmar Ajuste?"
                message={`Estás a punto de ${isNegative ? 'QUITAR' : 'AGREGAR'} ${Math.abs(amountNum)} créditos a ${user.name}. ¿Continuar?`}
                variant="info"
                confirmLabel="Sí, Aplicar"
            />
        </div>
    )
}
