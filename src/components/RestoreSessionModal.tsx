// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useRestoreSessionModal } from '@/hooks/useRestoreSessionModal'
import { ThumbsUp, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RestoreSessionModal() {
    const { isOpen, message, confirm, closeModal } = useRestoreSessionModal()
    const router = useRouter()

    if (!isOpen) return null

    const handleConfirm = async () => {
        // 🎬 FEEDBACK VISUAL: Mostramos el overlay
        window.dispatchEvent(new Event('session-restore-start'))

        // Esperar un poco para la animación
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Restaurar sesión
        document.cookie = "soft_logout=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        localStorage.removeItem('soft_logout')
        window.dispatchEvent(new Event('session-restored'))

        // Ejecutar callback
        confirm()
    }

    const handleCancel = () => {
        closeModal()
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-primary-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
                {/* Botón cerrar */}
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition"
                    aria-label="Cerrar"
                >
                    <X size={20} />
                </button>

                {/* Icono */}
                <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-8 h-8 text-primary-500" />
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold text-text-primary text-center mb-2">
                    ¿Volver a iniciar sesión?
                </h3>

                {/* Descripción dinámica */}
                <p className="text-text-secondary text-center mb-6">
                    {message}
                </p>

                {/* Botones */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 bg-surface-highlight hover:bg-surface-hover text-text-secondary font-medium rounded-lg transition"
                    >
                        No, cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition shadow-lg shadow-primary-500/20"
                    >
                        Sí, reactivar
                    </button>
                </div>
            </div>
        </div>
    )
}
