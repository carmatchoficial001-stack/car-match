// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: "Email es requerido" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })

        return NextResponse.json({ exists: !!user })
    } catch (error) {
        console.error("Error checking user:", error)
        return NextResponse.json(
            { error: "Error al verificar usuario" },
            { status: 500 }
        )
    }
}
