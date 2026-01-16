import { prisma } from '@/lib/db'
import { generateDopamineMessage } from '@/lib/dopamineMessages'

export async function processBusinessDopamine(force: boolean = false) {
    const currentMonth = new Date().getMonth() + 1

    // 2. Obtener negocios activos
    const businesses = await prisma.business.findMany({
        where: { isActive: true },
        include: { analytics: true }
    })

    let generatedCount = 0

    for (const business of businesses) {
        // Asegurar que exista registro de analytics
        let analytics = business.analytics
        if (!analytics) {
            analytics = await prisma.businessAnalytics.create({
                data: { businessId: business.id, currentMonth }
            })
        }

        // 3. Reset mensual si cambió el mes
        if (analytics.currentMonth !== currentMonth) {
            analytics = await prisma.businessAnalytics.update({
                where: { id: analytics.id },
                data: { monthlyFakeCount: 0, currentMonth }
            })
        }

        // 4. Verificar límite (~150/mes)
        if (analytics.monthlyFakeCount >= 168 && !force) continue

        // 5. Probabilidad de generación
        if (!force && Math.random() > 0.7) continue

        // 6. Generar
        const count = force ? 1 : (Math.floor(Math.random() * 3) + 1)

        for (let i = 0; i < count; i++) {
            const message = generateDopamineMessage(business)

            // Crear notificación visible al usuario
            await prisma.notification.create({
                data: {
                    userId: business.userId,
                    type: 'BUSINESS_ACTIVITY',
                    title: '📊 Actividad en tu negocio',
                    message,
                    link: `/map-store?id=${business.id}`,
                    isFake: true,
                    businessId: business.id
                }
            })

            // Log de la notificación ficticia
            await prisma.businessNotificationLog.create({
                data: {
                    businessId: business.id,
                    type: 'FAKE',
                    message,
                    category: 'DOPAMINE'
                }
            })

            // Actualizar contadores
            await prisma.businessAnalytics.update({
                where: { businessId: business.id },
                data: {
                    monthlyFakeCount: { increment: 1 },
                    lastFakeNotification: new Date(),
                    fakeViews: { increment: 1 }
                }
            })

            generatedCount++
        }
    }

    return {
        success: true,
        generated: generatedCount
    }
}
