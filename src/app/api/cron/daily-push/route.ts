// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/pushService'

/**
 * Endpoint para disparar las notificaciones diarias (Mañana y Noche)
 * En producción esto sería llamado por un Cron Job
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    // Seguridad básica para evitar que cualquiera lo dispare
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const now = new Date()
        const hour = now.getHours()
        const isMorning = hour >= 6 && hour < 12

        const title = isMorning ? '¡Buenos días! 🚗✨' : '¡Noche de CarMatch! 🌙'
        const body = isMorning
            ? 'Mira los nuevos vehículos publicados hoy en tu zona.'
            : 'Checa si tienes nuevos mensajes o actualizaciones de tus citas.'

        // 1. Notificaciones de Engagement General
        const activeSubscriptions = await prisma.pushSubscription.findMany({
            distinct: ['userId'],
            select: { userId: true }
        })

        const engagementPromises = activeSubscriptions.map(sub =>
            sendPushToUser(sub.userId, {
                title,
                body,
                url: '/market'
            })
        )

        // 2. Recordatorios de Citas (Appointments) para hoy
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        const todaysAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: 'ACCEPTED'
            },
            include: {
                chat: {
                    select: {
                        buyerId: true,
                        sellerId: true,
                        vehicle: { select: { title: true } }
                    }
                }
            }
        })

        const appointmentPromises = todaysAppointments.flatMap(app => {
            const reminderPayload = {
                title: '📅 Recordatorio de Cita',
                body: `Hoy tienes una reunión para ver: ${app.chat.vehicle.title} en ${app.location}.`,
                url: `/messages/${app.chatId}`
            }
            return [
                sendPushToUser(app.chat.buyerId, reminderPayload),
                sendPushToUser(app.chat.sellerId, reminderPayload)
            ]
        })

        await Promise.all([...engagementPromises, ...appointmentPromises])

        return NextResponse.json({
            success: true,
            notifiedEngagement: activeSubscriptions.length,
            notifiedAppointments: todaysAppointments.length,
            type: isMorning ? 'morning' : 'night'
        })
    } catch (error) {
        console.error('Error in daily push cron:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
