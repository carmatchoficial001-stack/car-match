
import { authConfig } from "@/lib/auth.config"

export const dynamic = 'force-dynamic'

export default function DebugEnvPage() {
    const vars = {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        AUTH_SECRET: process.env.AUTH_SECRET ? '✅ Presente' : '❌ FALTANTE',
        GOOGLE_ID: (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID) ? '✅ Presente' : '❌ FALTANTE',
        GOOGLE_SECRET: (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET) ? '✅ Presente' : '❌ FALTANTE',
        FACEBOOK_ID: (process.env.FACEBOOK_CLIENT_ID || process.env.AUTH_FACEBOOK_ID) ? '✅ Presente' : '❌ FALTANTE',
        FACEBOOK_SECRET: (process.env.FACEBOOK_CLIENT_SECRET || process.env.AUTH_FACEBOOK_SECRET) ? '✅ Presente' : '❌ FALTANTE',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
    }

    // Check basic structural validity
    const urlCheck = vars.NEXTAUTH_URL?.startsWith('https://')
        ? '✅ Correcto (https://)'
        : `⚠️ Cuidado: ${vars.NEXTAUTH_URL} (Debería ser https://...)`

    return (
        <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono p-8">
            <h1 className="text-2xl font-bold mb-6 text-white">Diagnóstico de Variables de Entorno (Servidor)</h1>

            <div className="space-y-4 max-w-2xl border border-slate-800 p-6 rounded-xl bg-slate-900/50">
                <div className="grid grid-cols-[200px_1fr] gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">NEXTAUTH_URL</span>
                    <span>{vars.NEXTAUTH_URL || '❌ INDEFINIDO'}</span>
                </div>
                <div className="text-xs text-yellow-400 pl-[208px] mb-4">{urlCheck}</div>

                <div className="grid grid-cols-[200px_1fr] gap-2">
                    <span className="text-slate-400">AUTH_SECRET</span>
                    <span>{vars.AUTH_SECRET}</span>
                </div>

                <div className="border-t border-slate-800 my-4 pt-4">
                    <h2 className="text-white font-bold mb-2">Google Provider</h2>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="text-slate-400">Client ID</span>
                        <span>{vars.GOOGLE_ID}</span>
                    </div>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="text-slate-400">Client Secret</span>
                        <span>{vars.GOOGLE_SECRET}</span>
                    </div>
                </div>

                <div className="border-t border-slate-800 my-4 pt-4">
                    <h2 className="text-white font-bold mb-2">Facebook Provider</h2>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="text-slate-400">App ID</span>
                        <span>{vars.FACEBOOK_ID}</span>
                    </div>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="text-slate-400">App Secret</span>
                        <span>{vars.FACEBOOK_SECRET}</span>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-slate-500 text-sm">
                Nota: Esta página lee las variables directamente del servidor de Vercel en tiempo real.
                Si ves "❌ FALTANTE", es que Vercel no tiene la variable, aunque tú la tengas en tu lista local.
            </p>
        </div>
    )
}
