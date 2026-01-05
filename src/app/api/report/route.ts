import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Debes iniciar sesión para reportar' }, { status: 401 })
        }

        const body = await request.json()
        const { reason, description, imageUrl, vehicleId, businessId, targetUserId } = body

        if (!reason || !imageUrl) {
            return NextResponse.json({ error: 'Faltan datos requeridos (motivo o imagen)' }, { status: 400 })
        }

        const report = await prisma.report.create({
            data: {
                reporterId: session.user.id,
                reason,
                description,
                imageUrl,
                vehicleId: vehicleId || null,
                businessId: businessId || null,
                targetUserId: targetUserId || null,
            }
        })

        return NextResponse.json(report)
    } catch (error) {
        console.error('Error creating report:', error)
        return NextResponse.json({ error: 'Error al enviar reporte' }, { status: 500 })
    }
}
