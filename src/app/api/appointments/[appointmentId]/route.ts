import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/chats/[chatId]/appointments/[appointmentId] - Editar cita existente
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string, appointmentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { appointmentId } = await params
        const body = await request.json()
        const { date, location, address, latitude, longitude } = body

        // Verificar propiedad de la cita a través del chat
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { chat: true }
        })

        if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

        if (appointment.chat.buyerId !== session.user.id && appointment.chat.sellerId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                date: date ? new Date(date) : undefined,
                location: location || undefined,
                address: address || undefined,
                latitude: latitude !== undefined ? latitude : undefined,
                longitude: longitude !== undefined ? longitude : undefined,
            }
        })

        // Notificar al sistema de mensajes sobre la actualización (opcional)
        // Podríamos crear un mensaje de sistema aquí

        return NextResponse.json(updatedAppointment)

    } catch (error) {
        console.error('Error actualizando cita:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
