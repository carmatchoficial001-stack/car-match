"use client"

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

interface SOSComponentProps {
    chatId: string
    activeAppointmentId?: string
    isEmergencyActive: boolean
    onActivateSOS: () => void
    trustedContact?: any
}

export default function SOSComponent({
    chatId,
    activeAppointmentId,
    isEmergencyActive,
    onActivateSOS,
    trustedContact
}: SOSComponentProps) {
    const { t } = useLanguage()
    const [showConfirm, setShowConfirm] = useState(false)
    const [countdown, setCountdown] = useState(5)
    const [sosMode, setSosMode] = useState<'IDLE' | 'COUNTDOWN' | 'ACTIVE'>('IDLE')

    useEffect(() => {
        if (isEmergencyActive) setSosMode('ACTIVE')
    }, [isEmergencyActive])

    const startSOS = () => {
        setSosMode('COUNTDOWN')
        setCountdown(5)
    }

    useEffect(() => {
        let timer: any
        if (sosMode === 'COUNTDOWN' && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        } else if (sosMode === 'COUNTDOWN' && countdown === 0) {
            triggerSOS()
        }
        return () => clearTimeout(timer)
    }, [sosMode, countdown])

    const triggerSOS = async () => {
        setSosMode('ACTIVE')
        onActivateSOS()

        // Simulación: Notificar al contacto de confianza y autoridades
        try {
            await fetch(`/api/chats/${chatId}/sos`, {
                method: 'POST',
                body: JSON.stringify({ appointmentId: activeAppointmentId })
            })
        } catch (err) {
            console.error('Error triggering SOS backend:', err)
        }

        // Llamada al 911 (Simulada para web, en mobile usaría tel:911)
        window.location.href = 'tel:911'
    }

    return (
        <div className="relative">
            {/* Modal de Emergencia Visual */}
            <AnimatePresence>
                {sosMode === 'ACTIVE' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[10001] bg-red-600/20 backdrop-blur-sm pointer-events-none"
                    >
                        <div className="absolute inset-0 animate-pulse bg-red-600/10"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
                            <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl border-4 border-white animate-bounce mb-4">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">ALERTA SOS ACTIVA</h2>
                                <p className="font-bold">Autoridades notificadas (Simulado)</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Banner de Monitoreo si hay cita activa */}
            {activeAppointmentId && sosMode === 'IDLE' && (
                <div className="bg-red-500/10 border-b border-red-500/20 p-2 flex items-center justify-between animate-pulse">
                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 uppercase tracking-widest">
                        🛡️ Monitoreo de Seguridad Activo
                    </span>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-black uppercase hover:bg-red-700 transition"
                    >
                        BOTÓN SOS
                    </button>
                </div>
            )}

            {/* Botón Flotante de SOS (siempre visible en Monitoreo) */}
            <AnimatePresence>
                {showConfirm && sosMode === 'IDLE' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <div className="bg-surface border border-red-500/30 rounded-3xl p-8 w-full max-w-sm text-center space-y-6">
                            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-600/40">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3zM12 9l-.01.01" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-text-primary uppercase mb-2">¿Activar Botón SOS?</h3>
                                <p className="text-sm text-text-secondary">
                                    Esto llamará a emergencias y enviará tu ubicación en tiempo real a: <br />
                                    <strong className="text-red-400">{trustedContact?.name || "Sin contacto de confianza"}</strong>
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={startSOS}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-red-600/20 active:scale-95 transition"
                                >
                                    SÍ, ACTIVAR AHORA
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-3 bg-surface-highlight text-text-secondary rounded-2xl font-bold hover:text-text-primary transition"
                                >
                                    No, fue un error
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cuenta atrás SOS */}
            <AnimatePresence>
                {sosMode === 'COUNTDOWN' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[10003] bg-red-600 flex flex-col items-center justify-center text-white p-8 text-center"
                    >
                        <h2 className="text-4xl font-black uppercase mb-4">Activando SOS en...</h2>
                        <div className="text-9xl font-black mb-8">{countdown}</div>
                        <button
                            onClick={() => setSosMode('IDLE')}
                            className="px-10 py-5 bg-white text-red-600 rounded-full font-black text-2xl hover:bg-white/90 transition shadow-2xl"
                        >
                            CANCELAR (FALSA ALARMA)
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
