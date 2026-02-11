// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWeightedHomePath } from "@/lib/navigation"

export default async function LandingPage() {
    const session = await auth()

    // 🚀 Redirección para usuarios autenticados a su home ponderado
    if (session) {
        redirect(getWeightedHomePath())
    }

    // 🚀 Visitantes van directo al MarketCar (no necesitan cuenta para ver)
    redirect('/market')
}
