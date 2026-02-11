// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import CreditsClient from "./CreditsClient"

export default async function CreditsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/auth")
    }

    try {
        // Obtener usuario con saldo y transacciones
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
        })

        if (!user) {
            redirect("/auth")
        }

        // Consultar transacciones por separado para asegurar orden
        const transactions = await prisma.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return (
            <CreditsClient
                user={user}
                transactions={transactions}
            />
        )
    } catch (error) {
        console.error("Error en CreditsPage:", error)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="text-5xl mb-4">🔌</div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Conexión Inestable</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        No pudimos conectar con la base de datos. Pero no te preocupes, esto es un problema temporal de red. Tus créditos e información están seguros.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Reintentar ahora
                    </button>
                    <p className="mt-4 text-xs text-gray-400">
                        Si el error persiste, verifica tu conexión a internet o intenta en unos minutos.
                    </p>
                </div>
            </div>
        )
    }
}
