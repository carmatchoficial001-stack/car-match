import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushNotification } from '@/lib/push'
import { generateRandomFakeNotifications } from '@/lib/fakeNotifications'

export const dynamic = 'force-dynamic'

/**
 * CRON de Engagement y Dopamina 🎣
 * 
 * Ejecuta DIARIAMENTE para:
 * 1. Generar notificaciones falsas (63-123 por mes distribuidas)
 * 2. Enviar push notifications para traer usuarios de vuelta
 * 3. Mezclar con notificaciones reales de usuarios
 * 
 * Estrategia: Mantener usuarios enganchados con actividad constante
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('🎣 Iniciando CRON de Engagement y Dopamina...')

        // 1. Obtener usuarios con vehículos/negocios activos
        const activeUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { vehicles: { some: { status: 'ACTIVE' } } },
                    { businesses: { some: { isActive: true } } }
                ]
            },
            include: {
                vehicles: {
                    where: { status: 'ACTIVE' },
                    take: 5
                },
                businesses: {
                    where: { isActive: true },
                    take: 5
                },
                pushSubscriptions: true
            },
            take: 100 // Procesar lote de 100 usuarios por ejecución
        })

        let fakeNotificationsCreated = 0
        let pushNotificationsSent = 0

        for (const user of activeUsers) {
            try {
                // ===========================
                // PASO 1: Generar Notificaciones Falsas (Dopamina)
                // ===========================
                const result = await generateRandomFakeNotifications(user.id)
                fakeNotificationsCreated += result.generated

                // ===========================
                // PASO 2: Enviar Push Notification (30% probabilidad)
                // ===========================
                if (Math.random() > 0.7 && user.pushSubscriptions.length > 0) {
                    let message

                    const hasVehicles = user.vehicles.length > 0
                    const hasBusinesses = user.businesses.length > 0

                    if (hasVehicles && hasBusinesses) {
                        // Si tiene ambos, elegir uno al azar
                        if (Math.random() > 0.5) {
                            const vehicle = user.vehicles[0]
                            const views = Math.floor(Math.random() * 12) + 5
                            message = {
                                title: `🔥 Tu ${vehicle.brand} ${vehicle.model} está popular`,
                                body: `${views} personas lo vieron hoy. ¡Revisa tu panel!`,
                                url: `/profile`,
                                icon: vehicle.images[0] || '/icon-512x512.png'
                            }
                        } else {
                            const business = user.businesses[0]
                            const searches = Math.floor(Math.random() * 8) + 3
                            message = {
                                title: `⭐ ${business.name} está siendo buscado`,
                                body: `${searches} personas buscaron negocios como el tuyo`,
                                url: `/map`,
                                icon: business.images[0] || '/icon-512x512.png'
                            }
                        }
                    } else if (hasVehicles) {
                        const vehicle = user.vehicles[0]
                        const views = Math.floor(Math.random() * 12) + 5
                        message = {
                            title: `🔥 Tu ${vehicle.brand} ${vehicle.model} está popular`,
                            body: `${views} personas lo vieron hoy. ¡Revisa tu panel!`,
                            url: `/profile`,
                            icon: vehicle.images[0] || '/icon-512x512.png'
                        }
                    } else if (hasBusinesses) {
                        const business = user.businesses[0]
                        const searches = Math.floor(Math.random() * 8) + 3
                        message = {
                            title: `⭐ ${business.name} está siendo buscado`,
                            body: `${searches} personas buscaron negocios como el tuyo`,
                            url: `/map`,
                            icon: business.images[0] || '/icon-512x512.png'
                        }
                    }

                    if (message) {
                        // Enviar a todas las suscripciones del usuario
                        for (const sub of user.pushSubscriptions) {
                            try {
                                const subscription = {
                                    endpoint: sub.endpoint,
                                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                                }
                                await sendPushNotification(subscription, message)
                                pushNotificationsSent++
                            } catch (pushError) {
                                // Si falla, eliminar suscripción inválida
                                await prisma.pushSubscription.delete({
                                    where: { id: sub.id }
                                }).catch(() => { })
                            }
                        }
                    }
                }
            } catch (userError) {
                console.error(`Error procesando usuario ${user.id}:`, userError)
            }
        }

        const summary = {
            success: true,
            usersProcessed: activeUsers.length,
            fakeNotificationsCreated,
            pushNotificationsSent,
            timestamp: new Date().toISOString()
        }

        console.log('✅ CRON Engagement completado:', summary)

        return NextResponse.json(summary)

    } catch (error) {
        console.error('❌ Error en CRON Engagement:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
