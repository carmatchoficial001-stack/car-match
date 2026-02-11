// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X, CreditCard } from 'lucide-react'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm?: () => void
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'info' | 'danger' | 'success' | 'credit'
    showCancel?: boolean
    isLoading?: boolean
    secondaryAction?: {
        label: string
        onClick: () => void
    }
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'info',
    showCancel = true,
    isLoading = false,
    secondaryAction
}: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen || !mounted) return null

    const variants = {
        info: {
            icon: <Info className="text-primary-400" size={32} />,
            button: 'bg-primary-700 hover:bg-primary-600',
            bg: 'bg-primary-500/10'
        },
        danger: {
            icon: <AlertCircle className="text-red-400" size={32} />,
            button: 'bg-red-600 hover:bg-red-500',
            bg: 'bg-red-500/10'
        },
        success: {
            icon: <CheckCircle2 className="text-green-400" size={32} />,
            button: 'bg-green-600 hover:bg-green-500',
            bg: 'bg-green-500/10'
        },
        credit: {
            icon: <CreditCard className="text-amber-400" size={32} />,
            button: 'bg-amber-600 hover:bg-amber-500',
            bg: 'bg-amber-500/10'
        }
    }

    const config = variants[variant]

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop con Blur */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative bg-surface border border-surface-highlight rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                {/* Header/Icon Area */}
                <div className={`pt-10 pb-6 flex flex-col items-center justify-center ${config.bg}`}>
                    <div className="p-4 bg-background/50 rounded-full mb-4 shadow-xl border border-white/5">
                        {config.icon}
                    </div>
                </div>

                <div className="p-8 text-center">
                    <h3 className="text-2xl font-black text-text-primary mb-3 leading-tight">
                        {title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        {onConfirm && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${config.button} disabled:opacity-50`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    confirmLabel
                                )}
                            </button>
                        )}

                        {secondaryAction && (
                            <button
                                onClick={secondaryAction.onClick}
                                className="w-full py-4 rounded-2xl bg-surface-highlight text-text-primary font-black uppercase tracking-widest text-sm transition-all hover:bg-surface-highlight/70"
                            >
                                {secondaryAction.label}
                            </button>
                        )}

                        {showCancel && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl text-text-secondary font-bold hover:text-text-primary transition-colors text-sm"
                            >
                                {cancelLabel}
                            </button>
                        )}
                    </div>
                </div>

                {/* Close X Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary transition-colors bg-background/20 rounded-full"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    )
}
