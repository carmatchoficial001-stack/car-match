// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        const { businessId } = await request.json()

        if (!businessId) {
            return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 })
        }

        // Registrar vista (puede ser anónima)
        await prisma.businessView.create({
            data: {
                businessId,
                userId: session?.user?.id || null
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error tracking business view:', error)
        return NextResponse.json({ error: 'Error al registrar vista' }, { status: 500 })
    }
}
