// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export default function RestoringSessionOverlay() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleRestoreStart = () => {
            setIsVisible(true)
            // El overlay se oculta automáticamente después de 2.5 segundos
            // Dando tiempo a que la animación de "carga" se aprecie
            setTimeout(() => {
                setIsVisible(false)
            }, 2500)
        }

        window.addEventListener('session-restore-start', handleRestoreStart)
        return () => window.removeEventListener('session-restore-start', handleRestoreStart)
    }, [])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.1, opacity: 0, y: -20 }}
                        className="bg-surface border border-primary-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full text-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-primary-500">
                                <ShieldCheck size={28} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">Restaurando sesión</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Sincronizando tu perfil de forma segura...
                            </p>
                        </div>

                        <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-1.5 h-1.5 bg-primary-500 rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
