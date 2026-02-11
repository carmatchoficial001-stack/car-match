// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage() {
    const session = await auth()

    if (!session || !session.user) {
        redirect('/auth')
    }

    // Lógica de Usuario Regular (70/30 split)
    const randomValue = Math.random()
    const destination = randomValue < 0.7 ? "/swipe" : "/market"

    redirect(destination)
}
