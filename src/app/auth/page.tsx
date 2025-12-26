"use client"

import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Logo } from "@/components/Logo"

import { useLanguage } from "@/contexts/LanguageContext"
import { getWeightedHomePath } from "@/lib/navigation"

export default function AuthPage() {
    const { t } = useLanguage()
    const { data: session, status } = useSession()
    const router = useRouter()

    // Redirect to weighted path if authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.replace(getWeightedHomePath())
        }
    }, [status, router])

    const handleSignOut = () => {
        signOut({ callbackUrl: '/auth' })
    }

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/auth/callback" })
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Logo className="w-20 h-20 animate-pulse" />
                </div>
            </div>
        )
    }

    if (status === 'authenticated') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Logo className="w-20 h-20 animate-pulse" />
                    <p className="text-text-secondary">Redirigiendo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <Link href="/" className="flex justify-center mb-8">
                    <Logo
                        className="w-40 h-40"
                        showText={true}
                        textClassName="text-6xl font-bold text-white"
                    />
                </Link>

                {/* Card */}
                <div className="bg-surface rounded-2xl shadow-2xl p-8 border border-surface-highlight">
                    <h1 className="text-3xl font-bold text-center mb-2 text-text-primary">
                        {t('auth.welcome')}
                    </h1>
                    <p className="text-center text-text-secondary mb-8">
                        {t('auth.login_subtitle')}
                    </p>

                    {/* Google Sign In Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-surface-highlight hover:bg-surface transition-all rounded-xl shadow-lg hover:shadow-xl group border border-surface-highlight mb-4"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-text-primary font-bold text-lg group-hover:text-text-primary">
                            {t('auth.continue_with')} Google
                        </span>
                    </button>

                    {/* Facebook Sign In Button */}
                    <button
                        type="button"
                        onClick={() => signIn("facebook")}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] hover:bg-[#166fe5] transition-all rounded-xl shadow-lg hover:shadow-xl group mb-4"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="text-white font-bold text-lg">
                            {t('auth.continue_with')} Facebook
                        </span>
                    </button>

                    {/* X (Twitter) Sign In Button */}
                    <button
                        type="button"
                        onClick={() => signIn("twitter")}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black hover:bg-gray-900 transition-all rounded-xl shadow-lg hover:shadow-xl group border border-gray-800 mb-4"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-white font-bold text-lg">
                            {t('auth.continue_with')} X
                        </span>
                    </button>

                    {/* Apple Sign In Button (Coming Soon) */}
                    <div className="relative group opacity-70 cursor-not-allowed">
                        <button
                            type="button"
                            disabled
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl shadow-lg border border-gray-800 opacity-50 cursor-not-allowed"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.39-.74 2.17.16 3.93 1.31 4.54 2.63l-.04.05c-1.74.83-2.6 3.01-1.28 4.96.64 1.12 1.62 1.76 2.06 1.94-.97 2.09-2.3 4.21-3.75 3.39zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span className="font-bold text-lg">
                                {t('auth.continue_with')} Apple
                            </span>
                        </button>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full shadow-md z-10">
                            {t('auth.coming_soon')}
                        </div>
                    </div>

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
