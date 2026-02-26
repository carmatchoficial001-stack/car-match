// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * REPORT SYSTEM: Reportar publicaciones ofensivas o fraudulentas.
 * 🛡️ REGLA DE SEGURIDAD: Solo usuarios registrados pueden reportar.
 * 🛡️ REGLA ANTI-SABOTAJE: El reporte NO oculta la publicación de inmediato 
 * para evitar que usuarios malintencionados borren la competencia. Solo el admin decide.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        // 🛡️ SECURITY FIX: Solo usuarios logueados pueden reportar para evitar spam anónimo masivo
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Debes iniciar sesión para reportar una publicación' }, { status: 401 })
        }

        const reporterId = session.user.id
        const body = await request.json()
        const { reason, description, imageUrl, vehicleId, businessId, targetUserId } = body

        if (!reason) {
            return NextResponse.json({ error: 'Faltan datos requeridos (motivo)' }, { status: 400 })
        }

        const report = await prisma.report.create({
            data: {
                reporterId: reporterId,
                reason,
                description,
                imageUrl: imageUrl || null,
                vehicleId: vehicleId || null,
                businessId: businessId || null,
                targetUserId: targetUserId || null,
                status: 'PENDING'
            }
        })

        // 🛡️ ANTI-SABOTAJE: Ya no ocultamos automáticamente (status: 'INACTIVE') de inmediato.
        // Se queda en manos del Admin revisar los reportes.

        return NextResponse.json(report)
    } catch (error) {
        console.error('Error creating report:', error)
        return NextResponse.json({ error: 'Error al enviar reporte' }, { status: 500 })
    }
}
