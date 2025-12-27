import { prisma } from '@/lib/db'

/**
 * Sistema de Engagement Boosting (Growth Hacking Inicial)
 * 
 * Genera notificaciones de favoritos simuladas para incentivar a vendedores
 * a mantener sus publicaciones activas.
 * 
 * LÓGICA VIRAL:
 * - NO se desactiva por número de favoritos reales.
 * - Muestra la SUMA de favoritos reales + simulados.
 * - El objetivo es que el vendedor sienta que su auto se está haciendo viral.
 */

const NOTIFICATION_INTERVAL_HOURS = 24 // Notificar máximo una vez al día

export async function generateEngagementNotifications() {
    try {
        // Obtener vehículos activos publicados en las últimas 7 días
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const activeVehicles = await prisma.vehicle.findMany({
            where: {
                status: 'ACTIVE',
                publishedAt: {
                    gte: sevenDaysAgo
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                favorites: true // Incluir favoritos reales para contar
            }
        })

        let notificationsCreated = 0

        for (const vehicle of activeVehicles) {
            // Obtener favoritos reales actuales
            const realFavoritesCount = vehicle.favorites.length

            // Verificar que no hayamos enviado una notificación reciente
            const lastNotification = await prisma.notification.findFirst({
                where: {
                    userId: vehicle.userId,
                    type: 'ENGAGEMENT_FAVORITES',
                    metadata: {
                        path: ['vehicleId'],
                        equals: vehicle.id
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            const now = new Date()
            if (lastNotification) {
                const hoursSinceLastNotif = (now.getTime() - lastNotification.createdAt.getTime()) / (1000 * 60 * 60)
                if (hoursSinceLastNotif < NOTIFICATION_INTERVAL_HOURS) {
                    continue // Ya enviamos una notificación reciente
                }
            }

            // Generar número aleatorio de favoritos simulados (variación realista)
            // El usuario quiere entre 25 y 85 simulados a lo largo del mes
            const baseSimulated = 25 + Math.floor(Math.random() * (85 - 25))

            // Añadir variación basada en el precio del vehículo
            const priceFloat = parseFloat(vehicle.price.toString())
            let simulatedCount = baseSimulated

            if (priceFloat < 50000) {
                simulatedCount += Math.floor(Math.random() * 15) // Más interés en carros económicos
            } else if (priceFloat > 200000) {
                simulatedCount = Math.floor(baseSimulated * 0.8) // Un poco menos en muy caros, pero sigue siendo alto
            }

            // TOTAL A MOSTRAR: Reales + Simulados (Efecto Viral)
            // Esto asegura que el número siempre sea impresionante y creciente
            const viralTotal = realFavoritesCount + simulatedCount

            // Crear notificación
            await prisma.notification.create({
                data: {
                    userId: vehicle.userId,
                    type: 'ENGAGEMENT_FAVORITES',
                    title: '🔥 ¡Tu vehículo se está haciendo viral!',
                    message: `${viralTotal} personas han guardado tu ${vehicle.brand} ${vehicle.model} en favoritos. ¡Hay muchos interesados, mantente atento a tus mensajes!`,
                    link: `/profile`,
                    metadata: {
                        vehicleId: vehicle.id,
                        simulatedFavorites: simulatedCount,
                        realFavorites: realFavoritesCount,
                        displayedTotal: viralTotal,
                        isEngagementBoost: true
                    }
                }
            })

            notificationsCreated++
        }

        console.log(`✅ Engagement boosting: ${notificationsCreated} notificaciones creadas`)
        return { success: true, notificationsCreated }

    } catch (error) {
        console.error('Error en engagement boosting:', error)
        return { success: false, error }
    }
}

// Función auxiliar para obtener favoritos REALES de un vehículo
export async function getRealFavoritesCount(vehicleId: string): Promise<number> {
    return await prisma.favorite.count({
        where: { vehicleId }
    })
}

/**
 * Genera notificaciones de "Visitas al Perfil" para dueños de negocios.
 * Objetivo: Retención y conversión a planes de pago.
 * 
 * LÓGICA:
 * - Suma visitas REALES + SIMULADAS (25-85 distribuidas en el mes)
 * - Notificaciones FRECUENTES (cada 4 días) para mantener engagement
 */
export async function generateBusinessEngagementNotifications() {
    try {
        // Obtener negocios activos
        const businesses = await prisma.business.findMany({
            where: { isActive: true },
            include: {
                user: true,
                views: true
            }
        })

        let notificationsCreated = 0
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        for (const business of businesses) {
            // Verificar frecuencia (cada 4 días para mantener al usuario emocionado)
            const lastNotification = await prisma.notification.findFirst({
                where: {
                    userId: business.userId,
                    type: 'BUSINESS_ENGAGEMENT',
                    metadata: {
                        path: ['businessId'],
                        equals: business.id
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            if (lastNotification) {
                const daysSince = (new Date().getTime() - lastNotification.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                if (daysSince < 4) continue // Esperar 4 días entre notificaciones
            }

            // Contar visitas REALES de la última semana
            const realViews = await prisma.businessView.count({
                where: {
                    businessId: business.id,
                    createdAt: { gte: sevenDaysAgo }
                }
            })

            // Simular visitas (entre 8-20 por notificación para que el total mensual sea 25-85)
            // 6-7 notificaciones al mes * 10-15 visitas = 60-105 aprox
            const baseSimulated = 8 + Math.floor(Math.random() * 12)

            // Pequeña variación basada en tipo de negocio
            let simulatedViews = baseSimulated
            if (business.category === 'CONCESIONARIO' || business.category === 'FINANCIAMIENTO') {
                simulatedViews += Math.floor(Math.random() * 5)
            }

            // TOTAL A MOSTRAR: Reales + Simulados de esta semana
            const totalViews = realViews + simulatedViews

            // Mensajes variados para no ser repetitivos
            const messages = [
                `${totalViews} personas visitaron "${business.name}" esta semana. ${realViews > 0 ? '¡Excelente actividad!' : '¡Tu negocio está recibiendo atención!'}`,
                `Tu negocio está creciendo: ${totalViews} visitas recientes en MapStore. ${realViews > 3 ? '¡Increíble!' : '¡Sigue así!'}`,
                `📍 ${totalViews} usuarios encontraron "${business.name}" en el mapa recientemente.`
            ]
            const randomMessage = messages[Math.floor(Math.random() * messages.length)]

            await prisma.notification.create({
                data: {
                    userId: business.userId,
                    type: 'BUSINESS_ENGAGEMENT',
                    title: `📊 Actividad en tu negocio`,
                    message: randomMessage,
                    link: `/my-businesses`,
                    metadata: {
                        businessId: business.id,
                        realViews,
                        simulatedViews,
                        totalViews,
                        isEngagementBoost: true
                    }
                }
            })
            notificationsCreated++
        }

        console.log(`✅ Business Engagement: ${notificationsCreated} notificaciones creadas`)
        return { success: true, notificationsCreated }

    } catch (error) {
        console.error('Error en business engagement:', error)
        return { success: false, error }
    }
}

// Cuando reactivamos un vehículo, notificar a usuarios interesados
export async function notifyInterestedBuyers(vehicleId: string) {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
                user: true,
                chats: {
                    include: {
                        buyer: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!vehicle) return

        // Notificar a todos los compradores que chatearon sobre este vehículo
        for (const chat of vehicle.chats) {
            await prisma.notification.create({
                data: {
                    userId: chat.buyerId,
                    type: 'VEHICLE_REACTIVATED',
                    title: '✅ Vehículo disponible nuevamente',
                    message: `El ${vehicle.brand} ${vehicle.model} ${vehicle.year} que te interesaba está disponible de nuevo. ¡Contáctalo antes que se venda!`,
                    link: `/swipe#${vehicleId}`,
                    metadata: {
                        vehicleId,
                        sellerId: vehicle.userId
                    }
                }
            })
        }

        console.log(`✅ ${vehicle.chats.length} compradores notificados sobre reactivación`)

    } catch (error) {
        console.error('Error al notificar reactivación:', error)
    }
}
