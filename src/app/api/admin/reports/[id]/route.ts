import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const isAdminMaster = session.user.email === process.env.ADMIN_EMAIL
        if (!isAdminMaster) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { isAdmin: true }
            })
            if (!user?.isAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const body = await request.json()
        const { action } = body // 'DISMISS' | 'RESOLVE'

        // Get the full report with vehicle/business info
        const report = await prisma.report.findUnique({
            where: { id },
            select: {
                id: true,
                vehicleId: true,
                businessId: true,
                status: true
            }
        })

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        if (action === 'RESOLVE') {
            // BORRAR: Eliminar silenciosamente la publicación sin notificar al usuario
            // Esto hace que el usuario pierda su slot de publicación gratuita

            if (report.vehicleId) {
                // Borrar el vehículo completo
                await prisma.vehicle.delete({
                    where: { id: report.vehicleId }
                })
            }

            if (report.businessId) {
                // Borrar el negocio completo
                await prisma.business.delete({
                    where: { id: report.businessId }
                })
            }

            // Actualizar el status del reporte
            const updatedReport = await prisma.report.update({
                where: { id },
                data: { status: 'ACTION_TAKEN' }
            })

            return NextResponse.json(updatedReport)
        } else {
            // DISMISS: Solo marcar el reporte como descartado, no tocar la publicación
            const updatedReport = await prisma.report.update({
                where: { id },
                data: { status: 'DISMISSED' }
            })

            return NextResponse.json(updatedReport)
        }
    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
