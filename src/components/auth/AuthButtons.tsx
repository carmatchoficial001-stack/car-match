import { signIn } from "next-auth/react"
import { useLanguage } from "@/contexts/LanguageContext"
import { getWeightedHomePath } from "@/lib/navigation"

export default function AuthButtons({
    linkedEmail,
    forceOnlyLinked = false
}: {
    linkedEmail?: string | null,
    forceOnlyLinked?: boolean
}) {
    const { t } = useLanguage()

    const handleSignIn = async (provider: string) => {
        try {
            const options: any = { callbackUrl: "/" }

            if (linkedEmail && provider === 'google') {
                // login_hint ayuda a pre-seleccionar la cuenta sin romper el flujo
                options.login_hint = linkedEmail
            }

            await signIn(provider, options)
        } catch (error) {
            console.error("Error signing in:", error)
            // Fallback manual en caso de que falle la librería
            window.location.href = `/api/auth/signin/${provider}?callbackUrl=/`
        }
    }

    return (
        <div className="space-y-4">
            {/* Google */}
            <button
                type="button"
                onClick={() => handleSignIn("google")}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 transition-all rounded-xl shadow-lg border group ${forceOnlyLinked
                    ? "bg-white text-black border-white hover:bg-gray-100 scale-105 shadow-2xl ring-4 ring-primary-500/20"
                    : "bg-surface-highlight text-text-primary border-surface-highlight hover:bg-surface"
                    }`}
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-bold text-lg">
                    {forceOnlyLinked
                        ? `Continuar como ${linkedEmail?.split('@')[0]}`
                        : `${t('auth.continue_with')} Google`
                    }
                </span>
            </button>

            {!forceOnlyLinked && (
                <>
                    {/* Facebook */}
                    <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] cursor-not-allowed transition-all rounded-xl shadow-lg"
                    >
                        <div className="bg-white rounded-full p-0.5 w-6 h-6 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#1877F2] translate-y-[1px]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-lg">
                            Facebook (Próximamente)
                        </span>
                    </button>

                    {/* X */}
                    <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black cursor-not-allowed transition-all rounded-xl shadow-lg border border-gray-800"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-white font-bold text-lg">
                            X (Próximamente)
                        </span>
                    </button>
                </>
            )}
        </div>
    )
}
