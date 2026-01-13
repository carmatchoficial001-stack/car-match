"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Logo } from "@/components/Logo"
import { useLanguage } from "@/contexts/LanguageContext"
import AuthButtons from "./AuthButtons"
import { getWeightedHomePath } from "@/lib/navigation"

export default function AuthPageContent() {
    const { t } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()

    // 🔥 BLINDAJE DE HISTORIAL: Si el usuario ya está autenticado y cae aquí,
    // usamos REPLACE para que esta página sea reemplazada por el Feed en el historial.
    useEffect(() => {
        if (status === "authenticated") {
            router.replace(getWeightedHomePath())
        }
    }, [status, router])

    if (status === "loading") {
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
                        {t('auth.welcome')}
                    </h1>
                    <p className="text-center text-text-secondary mb-8">
                        {t('auth.login_subtitle')}
                    </p>

                    <AuthButtons />

                    <p className="mt-8 text-center text-xs text-text-secondary">
                        {t('auth.agree_terms')}{" "}
                        <Link href="/terms" className="text-primary-700 hover:text-primary-600 font-medium transition">
                            {t('auth.terms')}
                        </Link>{" "}
                        {t('auth.and')}{" "}
                        <Link href="/privacy" className="text-primary-700 hover:text-primary-600 font-medium transition">
                            {t('auth.privacy')}
                        </Link>
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-text-secondary hover:text-text-primary transition flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('auth.back_home')}
                    </Link>
                </div>
            </div>
        </div>
    )
}
