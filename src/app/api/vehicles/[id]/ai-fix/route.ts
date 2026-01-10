import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { fixAndApproveVehicle } from '@/lib/ai-moderation'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { id } = await params

        // Verificar propiedad del vehículo
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
        }

        if (vehicle.userId !== user.id) {
            return NextResponse.json({ error: 'No tienes permiso para corregir este vehículo' }, { status: 403 })
        }

        const result = await fixAndApproveVehicle(id)

        if (result.success) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

    } catch (error) {
        console.error('Error en API Assesor Real:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
