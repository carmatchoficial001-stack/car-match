import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/appointments/[id] - Actualizar estado de la cita
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { id } = await params
        const { status } = await request.json()

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error actualizando estado de cita:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

// PATCH /api/appointments/[id] - Editar detalles de la cita
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { date, location, address, latitude, longitude } = body

        // Verificar propiedad de la cita a través del chat
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { chat: true }
        })

        if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

        if (appointment.chat.buyerId !== session.user.id && appointment.chat.sellerId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                location: location || undefined,
                address: address || undefined,
                latitude: latitude !== undefined ? latitude : undefined,
                longitude: longitude !== undefined ? longitude : undefined,
            }
        })

        return NextResponse.json(updatedAppointment)

    } catch (error) {
        console.error('Error actualizando detalles de cita:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
