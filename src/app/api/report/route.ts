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

        if (!reason) {
            return NextResponse.json({ error: 'Faltan datos requeridos (motivo)' }, { status: 400 })
        }

        // Transaction to ensure both report creation and hiding happen together
        const report = await prisma.$transaction(async (tx) => {
            const newReport = await tx.report.create({
                data: {
                    reporterId: session.user.id,
                    reason,
                    description,
                    imageUrl: imageUrl || null,
                    vehicleId: vehicleId || null,
                    businessId: businessId || null,
                    targetUserId: targetUserId || null,
                    status: 'PENDING'
                }
            })

            // 🛡️ ACCIÓN INMEDIATA: Ocultar publicación hasta que el admin decida
            if (vehicleId) {
                await tx.vehicle.update({
                    where: { id: vehicleId },
                    data: { status: 'INACTIVE' }
                })
            }

            if (businessId) {
                await tx.business.update({
                    where: { id: businessId },
                    data: { isActive: false }
                })
            }

            return newReport
        })

        return NextResponse.json(report)
    } catch (error) {
        console.error('Error creating report:', error)
        return NextResponse.json({ error: 'Error al enviar reporte' }, { status: 500 })
    }
}
