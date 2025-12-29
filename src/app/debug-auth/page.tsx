
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth.config"

export const dynamic = 'force-dynamic'

export default async function DebugAuthPage() {
    const results = {
        dbStatus: 'Testing...',
        dbMessage: '',
        googleIdLength: 0,
        googleSecretLength: 0,
        authSecretLength: 0,
        googleIdStart: '',
        hasSpaces: false
    }

    // 1. Test Database Connection
    try {
        const count = await prisma.user.count()
        results.dbStatus = '✅ Conectado'
        results.dbMessage = `Usuarios encontrados: ${count}`
    } catch (e: any) {
        results.dbStatus = '❌ Error de Conexión BD'
        results.dbMessage = e.message
    }

    // 2. Inspect Variables (Safe Mode)
    const gId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || ''
    const gSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || ''
    const aSecret = process.env.AUTH_SECRET || ''

    results.googleIdLength = gId.length
    results.googleSecretLength = gSecret.length
    results.authSecretLength = aSecret.length
    results.googleIdStart = gId.substring(0, 5) + '...'

    // Check for Spaces
    if (gId.trim() !== gId || gSecret.trim() !== gSecret || aSecret.trim() !== aSecret) {
        results.hasSpaces = true
    }

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-8">
            <h1 className="text-3xl font-bold mb-8 border-b border-gray-800 pb-4">Diagnóstico Profundo (Auth + DB)</h1>

            <div className="grid gap-6 max-w-3xl">
                {/* DATABASE SECTION */}
                <div className={`p-4 rounded border ${results.dbStatus.includes('Error') ? 'border-red-500 bg-red-900/10 text-red-400' : 'border-green-500 bg-green-900/10'}`}>
                    <h2 className="text-xl font-bold mb-2">1. Base de Datos</h2>
                    <div className="text-lg">{results.dbStatus}</div>
                    <div className="text-sm opacity-80">{results.dbMessage}</div>
                </div>

                {/* VARIABLES SECTION */}
                <div className="p-4 rounded border border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold mb-4 text-white">2. Inspección de Llaves</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-gray-800 pb-2">
                            <span className="text-gray-500 block text-xs">Google Client ID</span>
                            <span className="text-white">{results.googleIdLength > 0 ? results.googleIdStart : '❌ VACÍO'}</span>
                        </div>
                        <div className="border-b border-gray-800 pb-2">
                            <span className="text-gray-500 block text-xs">Longitud ID</span>
                            <span>{results.googleIdLength} caracteres</span>
                        </div>

                        <div className="border-b border-gray-800 pb-2">
                            <span className="text-gray-500 block text-xs">Google Client Secret</span>
                            <span className="text-white">{results.googleSecretLength > 0 ? '✅ Configurado' : '❌ VACÍO'}</span>
                        </div>
                        <div className="border-b border-gray-800 pb-2">
                            <span className="text-gray-500 block text-xs">Longitud Secret</span>
                            <span>{results.googleSecretLength} caracteres</span>
                        </div>

                        <div className="border-b border-gray-800 pb-2">
                            <span className="text-gray-500 block text-xs">AUTH_SECRET</span>
                            <span className="text-white">{results.authSecretLength > 0 ? '✅ Configurado' : '❌ VACÍO'}</span>
                        </div>
                    </div>

                    {/* SPACE DETECTION */}
                    {results.hasSpaces && (
                        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 text-yellow-500 rounded animate-pulse">
                            ⚠️ ¡ALERTA! Se detectaron <strong>espacios en blanco</strong> al inicio o final de tus llaves.
                            <br />
                            Esto suele causar el error de Configuración. Revisa Vercel y borra espacios sobrantes.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
