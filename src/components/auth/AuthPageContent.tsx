"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut, signIn } from "next-auth/react"

import { Logo } from "@/components/Logo"
import { useLanguage } from "@/contexts/LanguageContext"
import AuthButtons from "./AuthButtons"
import { getWeightedHomePath } from "@/lib/navigation"
import { generateDeviceFingerprint } from "@/lib/fingerprint"
import { useState } from "react"
import { AlertTriangle, LogIn } from "lucide-react"

export default function AuthPageContent() {
    const { t } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const [isLinked, setIsLinked] = useState<boolean | null>(null)
    const [linkedEmail, setLinkedEmail] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const handleFingerprint = async () => {
            const fingerprint = await generateDeviceFingerprint()
            if (!fingerprint) {
                setIsChecking(false)
                return
            }

            // 1. Verificar si el dispositivo ya está vinculado
            try {
                const res = await fetch('/api/auth/fingerprint-check', {
                    method: 'POST',
                    body: JSON.stringify({ deviceHash: fingerprint.visitorId }),
                })
                const data = await res.json()

                if (data.isLinked) {
                    setIsLinked(true)
                    setLinkedEmail(data.email)
                } else {
                    setIsLinked(false)
                }
            } finally {
                setIsChecking(false)
            }
        }

        handleFingerprint()
    }, [session])

    // 🔥 AUTO-LOGIN LOGIC: Si está vinculado, intentamos entrar directamente
    useEffect(() => {
        if (isLinked && linkedEmail && !error) {
            // Un pequeño delay para que el usuario vea qué pasa (o que no parpadee)
            const timer = setTimeout(() => {
                const options: any = { callbackUrl: getWeightedHomePath(), login_hint: linkedEmail };
                signIn('google', options);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isLinked, linkedEmail, error, router])


    if (status === "loading" || isChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary animate-pulse">Cargando CarMatch Social...</p>
                </div>
            </div>
        )
    }

    // Si hay sesión, no redirigimos automáticamente a los feeds aquí,
    // permitimos que se muestre la interfaz de "Regreso" si el dispositivo está vinculado
    // o si el usuario simplemente entró de nuevo.
    // if (session) return null 

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <Link href="/" className="flex justify-center mb-4">
                    <Logo
                        className="w-20 h-20 md:w-32 md:h-32"
                        showText={false}
                        textClassName="text-3xl md:text-5xl font-bold text-white"
                    />
                </Link>

                {/* Card */}
                <div className="bg-surface rounded-2xl shadow-2xl p-6 sm:p-8 border border-surface-highlight">
                    <h1 className="text-3xl font-bold text-center mb-2 text-text-primary">
                        {isLinked ? "Bienvenido de nuevo" : t('auth.welcome')}
                    </h1>
                    <p className="text-center text-text-secondary mb-8">
                        {isLinked ? "Este dispositivo está vinculado a una cuenta protegida." : t('auth.login_subtitle')}
                    </p>

                    {error === "AccessDenied" && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col items-center text-center animate-shake">
                            <AlertTriangle className="text-red-400 mb-2" size={24} />
                            <p className="text-red-400 font-bold text-sm">Seguridad: Acceso Denegado</p>
                            <p className="text-gray-300 text-xs mt-1">
                                No puedes crear una cuenta nueva en este dispositivo.
                                Por favor regresa a la cuenta que ya tienes vinculada.
                            </p>
                        </div>
                    )}

                    {(error === "login_required" || error === "interaction_required") && (
                        <div className="mb-6 bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                            <AlertTriangle className="text-primary-400 mb-2" size={24} />
                            <p className="text-primary-400 font-bold text-sm">Acción Requerida</p>
                            <p className="text-gray-300 text-xs mt-1">
                                Google requiere que confirmes tu identidad manualmente por seguridad.
                            </p>
                        </div>
                    )}

                    {isLinked ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="flex flex-col items-center py-10">
                                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-primary-400 font-bold uppercase tracking-widest text-sm">
                                    Iniciando sesión segura...
                                </p>
                                <p className="text-text-secondary text-xs mt-2">
                                    {linkedEmail}
                                </p>
                            </div>
                        </div>
                    ) : (

                        <>
                            <AuthButtons />
                            <p className="mt-8 text-center text-xs text-text-secondary font-sans leading-relaxed">
                                {t('auth.agree_terms')}{" "}
                                <Link href="/terms" className="text-primary-700 hover:text-primary-600 font-medium transition">
                                    {t('auth.terms')}
                                </Link>{" "}
                                {t('auth.and')}{" "}
                                <Link href="/privacy" className="text-primary-700 hover:text-primary-600 font-medium transition">
                                    {t('auth.privacy')}
                                </Link>
                            </p>
                        </>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-text-secondary hover:text-text-primary transition flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('auth.back_home')}
                    </Link>
                </div>
            </div >
        </div >
    )
}
