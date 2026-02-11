// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/pushService'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { chatId, date, location, address, latitude, longitude, monitoringActive } = data

        if (!chatId || !date || !location) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
        }

        // Verificar que el vehículo esté activo
        const chatCheck = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { vehicle: true }
        })

        if (!chatCheck || chatCheck.vehicle.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'No se pueden proponer citas para un vehículo inactivo.' }, { status: 410 })
        }

        const appointment = await prisma.appointment.create({
            data: {
                chatId,
                proposerId: session.user.id,
                date: new Date(date),
                location,
                address: address || null,
                latitude: latitude || 0,
                longitude: longitude || 0,
                status: 'PENDING',
                monitoringActive: !!monitoringActive
            },
            include: {
                chat: {
                    include: {
                        vehicle: true
                    }
                }
            }
        })

        // 1. Notificación Interna
        const receiverId = appointment.chat.buyerId === session.user.id
            ? appointment.chat.sellerId
            : appointment.chat.buyerId

        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'APPOINTMENT_REQUEST',
                title: 'Nueva propuesta de cita',
                message: `${session.user.name} ha propuesto una reunión para ver el vehículo ${appointment.chat.vehicle.title}`,
                link: `/messages/${chatId}`,
                metadata: {
                    appointmentId: appointment.id,
                    chatId
                }
            }
        })

        // 2. Notificación Push
        await sendPushToUser(receiverId, {
            title: '📅 Nueva propuesta de reunión',
            body: `${session.user.name} propuso: ${location} el ${new Date(date).toLocaleDateString()}`,
            url: `/messages/${chatId}`,
            tag: `appointment-${appointment.id}`
        })

        // Notificar en el chat (mensaje de sistema opcional o dejar que la UI lo maneje)
        // Por ahora solo creamos la cita

        // 2. Notificar al otro usuario vía Push
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: { buyerId: true, sellerId: true }
        })

        if (chat) {
            const receiverId = chat.buyerId === session.user.id ? chat.sellerId : chat.buyerId
            await sendPushToUser(receiverId, {
                title: '📅 Nueva cita propuesta',
                body: `${session.user.name} ha propuesto una reunión en ${location}`,
                url: `/messages/${chatId}`
            })
        }

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error creating appointment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
