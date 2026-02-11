// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import MyBusinessesClient from "./MyBusinessesClient"

export default async function MyBusinessesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/auth")
    }

    return <MyBusinessesClient />
}
