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
        const hour = new Date().getHours()
        const isMorning = hour >= 6 && hour < 12

        const title = isMorning ? '¡Buenos días! 🚗✨' : '¡Noche de CarMatch! 🌙'
        const body = isMorning
            ? 'Mira los nuevos vehículos publicados hoy en tu zona.'
            : 'Checa si tienes nuevos mensajes o actualizaciones de tus citas.'

        // Por ahora lo enviamos a todos los usuarios que tengan suscripciones
        const activeSubscriptions = await prisma.pushSubscription.findMany({
            distinct: ['userId'],
            select: { userId: true }
        })

        const promises = activeSubscriptions.map(sub =>
            sendPushToUser(sub.userId, {
                title,
                body,
                url: '/market'
            })
        )

        await Promise.all(promises)

        return NextResponse.json({
            success: true,
            notifiedCount: activeSubscriptions.length,
            type: isMorning ? 'morning' : 'night'
        })
    } catch (error) {
        console.error('Error in daily push cron:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
