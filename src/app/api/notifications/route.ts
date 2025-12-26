import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Auto-eliminar notificaciones leídas de más de 24 horas
        await cleanupOldNotifications(user.id)

        // Lógica de Notificaciones Simuladas (Engagement)
        await generateSimulatedNotifications(user.id)

        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly && { isRead: false })
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Últimas 50 notificaciones
        })

        return NextResponse.json(notifications)

    } catch (error) {
        console.error('Error al obtener notificaciones:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

// Función helper para generar notificaciones simuladas
async function generateSimulatedNotifications(userId: string) {
    try {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // 1. Buscar vehículos creados hace más de 1 hora pero menos de 24 horas
        const recentVehicles = await prisma.vehicle.findMany({
            where: {
                userId,
                createdAt: {
                    lt: oneHourAgo,
                    gt: twentyFourHoursAgo
                }
            }
        })

        for (const vehicle of recentVehicles) {
            const simulationId = `sim_fav_1h_${vehicle.id}`

            // Verificar si ya existe la notificación simulada para este vehículo (usando búsqueda bruta en JS para evitar complejidad de JSON filter si no está configurado)
            // Nota: Para optimizar en producción, usar índices JSONB. Aquí, como son pocas notificaciones recientes, un findFirst simple por link o type ayuda.
            const existing = await prisma.notification.findFirst({
                where: {
                    userId,
                    type: 'FAVORITE',
                    message: { contains: vehicle.title } // Heurística simple
                }
            })

            // Si queremos ser más precisos con metadata, necesitamos asegurarnos que Prisma Client lo soporte tipado. 
            // Por seguridad en este prototipo, usamos una verificación más genérica: 
            // Si ya tiene una notificación de FAVORITO sobre este auto hoy, no mandamos otra "simulada" de 1h.

            if (!existing) {
                // Crear notificación simulada
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'FAVORITE',
                        title: '¡A alguien le gustó tu vehículo!',
                        message: `1 persona guardó tu publicación "${vehicle.title}" en sus favoritos.`,
                        link: `/market`,
                        isRead: false,
                        metadata: {
                            vehicleId: vehicle.id,
                            simulationId,
                            isSimulated: true
                        }
                    }
                })
                console.log(`[SIMULATION] Notificación creada para vehículo ${vehicle.id}`)
            }
        }
    } catch (error) {
        console.error('Error generando notificaciones simuladas:', error)
        // No fallamos el request principal si esto falla
    }
}

// PATCH /api/notifications - Marcar notificaciones como leídas
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const { notificationIds, markAllAsRead } = body

        if (markAllAsRead) {
            // Marcar todas como leídas
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: { isRead: true }
            })
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Marcar específicas como leídas
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: user.id // Seguridad: solo las notificaciones del usuario
                },
                data: { isRead: true }
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error al actualizar notificaciones:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

// Función para limpiar notificaciones viejas (leídas hace más de 24 horas)
async function cleanupOldNotifications(userId: string) {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const deleted = await prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true,
                createdAt: {
                    lt: twentyFourHoursAgo
                }
            }
        })

        if (deleted.count > 0) {
            console.log(`[CLEANUP] ${deleted.count} notificaciones eliminadas para usuario ${userId}`)
        }
    } catch (error) {
        console.error('Error limpiando notificaciones:', error)
        // No fallar el request principal si esto falla
    }
}
