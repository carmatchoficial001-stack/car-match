"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
            } catch (err) {
                console.error("Error checking fingerprint:", err)
            } finally {
                setIsChecking(false)
            }

            // 2. Si ya está logueado, intentar vincular o verificar propiedad
            if (session?.user?.id) {
                try {
                    const saveRes = await fetch('/api/auth/fingerprint-save', {
                        method: 'POST',
                        body: JSON.stringify({
                            deviceHash: fingerprint.visitorId,
                            userAgent: window.navigator.userAgent
                        }),
                    })

                    if (!saveRes.ok) {
                        const errorData = await saveRes.json()
                        if (errorData.code === "DEVICE_ALREADY_LINKED") {
                            // 🚨 CONFLICTO: El usuario entró con otra cuenta en un dispositivo ajeno
                            // Forzar logout y mostrar error
                            await signOut({ redirect: false })
                            window.location.reload()
                        }
                    }
                } catch (err) {
                    console.error("Error saving fingerprint:", err)
                }
            }
        }

        handleFingerprint()
    }, [session])

    if (status === "loading" || isChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary animate-pulse">Cargando CarMatch...</p>
                </div>
            </div>
        )
    }

    if (session) return null

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
                        {isLinked
                            ? "Inicia sesión con tu cuenta vinculada para continuar."
                            : t('auth.login_subtitle')
                        }
                    </p>

                    {isLinked && (
                        <div className="mb-8 p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex flex-col items-center animate-fade-in">
                            <p className="text-xs text-primary-400 uppercase tracking-widest font-black mb-1">Cuenta de este dispositivo:</p>
                            <p className="text-white font-bold text-lg truncate w-full text-center">{linkedEmail}</p>
                        </div>
                    )}

                    <AuthButtons linkedEmail={linkedEmail} />

                    {isLinked && (
                        <p className="mt-6 text-center text-xs text-text-secondary leading-relaxed px-4">
                            Por seguridad, CarMatch solo permite una cuenta por dispositivo.
                            <br />
                            Si necesitas usar otra cuenta, contacta a soporte.
                        </p>
                    )}

                    {!isLinked && (
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
