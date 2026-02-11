// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDopamineMessage } from '@/lib/dopamineMessages'

// Forzar dinámico para que no se cachee
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // 1. Verificar autorización (CRON_SECRET)
    const authHeader = request.headers.get('authorization')
    // Nota: Vercel Cron envía el header "Authorization: Bearer <CRON_SECRET>"
    // Si estás probando localmente o no has configurado la variable, puedes omitir o ajustar esto
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentMonth = new Date().getMonth() + 1

    // 2. Obtener negocios activos
    // Incluir user para obtener el ID del usuario al cual notificar
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
        if (analytics.monthlyFakeCount >= 150) continue

        // 5. Probabilidad de generación
        // Ejecución cada 6h = 4 veces / día
        // Queremos ~4.4 notifs / día promedio
        // Probabilidad alta (60-70%) de generar al menos una en cada ejecución
        if (Math.random() > 0.7) continue

        // 6. Generar 1-3 notificaciones
        const count = Math.floor(Math.random() * 3) + 1 // 1 a 3

        for (let i = 0; i < count; i++) {
            const message = generateDopamineMessage(business)

            // Crear notificación visible al usuario
            await prisma.notification.create({
                data: {
                    userId: business.userId,
                    type: 'BUSINESS_ACTIVITY', // Asegurarse que este tipo exista o usar uno genérico
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
                    fakeViews: { increment: 1 } // Simulamos views también para consistencia
                }
            })

            generatedCount++
        }
    }

    return NextResponse.json({
        success: true,
        generated: generatedCount,
        timestamp: new Date().toISOString()
    })
}
