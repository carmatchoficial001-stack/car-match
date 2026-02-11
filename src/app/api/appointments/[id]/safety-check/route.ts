// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/appointments/[id]/safety-check
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { id } = await params
        const { action } = await request.json()

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { chat: true }
        })

        if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

        if (action === 'STILL') {
            await prisma.appointment.update({
                where: { id },
                data: {
                    lastSafetyCheck: new Date(),
                    missedResponseCount: 0 // Resetear contador al responder
                }
            })
        } else if (action === 'FINISH') {
            await prisma.appointment.update({
                where: { id },
                data: {
                    status: 'FINISHED',
                    monitoringActive: false
                }
            })
        } else if (action === 'SOS') {
            // Activar protocolo SOS inmediatamente
            // Redirigimos la lógica al endpoint de SOS o la ejecutamos aquí
            await prisma.appointment.update({
                where: { id },
                data: {
                    status: 'EMERGENCY',
                    monitoringActive: false
                }
            })
            // Nota: El Service Worker disparará el trigger de SOS en la UI o llamará al endpoint de SOS
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in safety check response:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
