import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Endpoint simplificado SOLO para cambiar el status de un vehículo
 * (ACTIVE, INACTIVE, SOLD)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { id } = await params
        const body = await request.json()
        const { status } = body

        // Validar status
        if (!status || !['ACTIVE', 'INACTIVE', 'SOLD'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
        }

        // Verificar propiedad
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
        }

        if (vehicle.userId !== user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Actualizar SOLO el status
        let updateData: any = { status }

        // Si está ACTIVANDO y el vehículo aún tiene tiempo, extender gratis
        if (status === 'ACTIVE') {
            const fullVehicle = await prisma.vehicle.findUnique({
                where: { id },
                select: { expiresAt: true, isFreePublication: true }
            })

            const now = new Date()
            const isExpired = fullVehicle?.expiresAt && new Date(fullVehicle.expiresAt) < now
            const canActivateFree = fullVehicle?.isFreePublication && !isExpired

            // Si puede activar gratis (aún no expiró), no cambiar expiresAt
            // Si ya expiró, necesitaría usar crédito (eso lo maneja el PATCH principal)
        }

        const updated = await prisma.vehicle.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, vehicle: updated })

    } catch (error) {
        console.error('❌ Error cambiando status:', error)
        return NextResponse.json({
            error: 'Error interno',
            message: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 })
    }
}
