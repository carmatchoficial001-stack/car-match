import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// CRON: /api/cron/reminders
// Debería ejecutarse cada hora
export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación del CRON (opcional, por header secreto)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 horas en el futuro
        const targetTimeEnd = new Date(targetTime.getTime() + 60 * 60 * 1000) // Ventana de 1 hora

        // Buscar citas confirmadas en aprox 24 horas
        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                status: 'ACCEPTED',
                date: {
                    gte: targetTime,
                    lt: targetTimeEnd
                }
            },
            include: {
                chat: {
                    include: {
                        vehicle: true,
                        buyer: { select: { id: true, name: true } },
                        seller: { select: { id: true, name: true } }
                    }
                }
            }
        })

        const notificationsSent = []

        for (const appointment of upcomingAppointments) {
            const { chat } = appointment

            // Verificar si ya enviamos recordatorio (evitar duplicados)
            const alreadyNotified = await prisma.notification.findFirst({
                where: {
                    type: 'APPOINTMENT_REMINDER',
                    metadata: {
                        path: ['appointmentId'],
                        equals: appointment.id
                    }
                }
            })

            if (alreadyNotified) continue

            // Enviar a Comprador
            await prisma.notification.create({
                data: {
                    userId: chat.buyer.id,
                    type: 'APPOINTMENT_REMINDER',
                    title: '⏰ Recordatorio de Cita',
                    message: `Mañana tienes una cita para ver el ${chat.vehicle.title} a las ${appointment.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}.`,
                    link: `/messages/${chat.id}`,
                    metadata: { appointmentId: appointment.id }
                }
            })

            // Enviar a Vendedor
            await prisma.notification.create({
                data: {
                    userId: chat.seller.id,
                    type: 'APPOINTMENT_REMINDER',
                    title: '⏰ Recordatorio de Cita',
                    message: `Mañana tienes una cita con ${chat.buyer.name} para el ${chat.vehicle.title}.`,
                    link: `/messages/${chat.id}`,
                    metadata: { appointmentId: appointment.id }
                }
            })

            notificationsSent.push(appointment.id)
        }

        return NextResponse.json({
            success: true,
            processed: upcomingAppointments.length,
            sent: notificationsSent.length
        })

    } catch (error) {
        console.error('Error en CRON Reminders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
