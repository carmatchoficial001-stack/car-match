// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { prisma } from '@/lib/db'

export async function processAppointmentReminders() {
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

    return {
        processed: upcomingAppointments.length,
        sent: notificationsSent.length
    }
}
