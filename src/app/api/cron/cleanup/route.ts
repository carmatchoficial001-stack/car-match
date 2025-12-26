import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * CRON JOB: Limpieza y Renovación Automática
 * Se ejecuta 1 vez al día.
 * 
 * Lógica:
 * 1. Buscar vehículos/negocios que vencieron Ayer (o antes y no se han procesado).
 * 2. Intentar renovar con créditos del usuario.
 * 3. Si no hay créditos -> Marcar como 'INACTIVE'.
 * 4. Generar notificaciones.
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar firma de Cron (Vercel Cron)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new Response('Unauthorized', { status: 401 }); }

        const log = []
        const today = new Date()

        // 1. VEHÍCULOS VENCIDOS
        const expiredVehicles = await prisma.vehicle.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lt: today }
            },
            include: { user: true }
        })

        for (const v of expiredVehicles) {
            if (v.user.credits > 0) {
                // AUTO-RENEW
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: v.userId },
                        data: { credits: { decrement: 1 } }
                    }),
                    prisma.vehicle.update({
                        where: { id: v.id },
                        data: {
                            expiresAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días
                        }
                    }),
                    prisma.creditTransaction.create({
                        data: {
                            userId: v.userId,
                            amount: -1,
                            description: `Renovación automática: ${v.brand} ${v.model}`,
                            details: { vehicleId: v.id }
                        }
                    })
                ])
                log.push(`[RENEWED] Vehicle ${v.id} for user ${v.user.email}`)
            } else {
                // EXPIRE
                await prisma.vehicle.update({
                    where: { id: v.id },
                    data: { status: 'INACTIVE' }
                })
                // TODO: Enviar notificación push/email "Tu anuncio ha caducado"
                log.push(`[EXPIRED] Vehicle ${v.id} - No credits`)
            }
        }

        // 2. NEGOCIOS VENCIDOS
        const expiredBusinesses = await prisma.business.findMany({
            where: {
                isActive: true,
                expiresAt: { lt: today }
            },
            include: { user: true }
        })

        for (const b of expiredBusinesses) {
            if (b.user.credits > 0) {
                // AUTO-RENEW
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: b.userId },
                        data: { credits: { decrement: 1 } }
                    }),
                    prisma.business.update({
                        where: { id: b.id },
                        data: {
                            expiresAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días
                        }
                    }),
                    prisma.creditTransaction.create({
                        data: {
                            userId: b.userId,
                            amount: -1,
                            description: `Renovación automática Negocio: ${b.name}`,
                            details: { businessId: b.id }
                        }
                    })
                ])
                log.push(`[RENEWED] Business ${b.id} for user ${b.user.email}`)
            } else {
                // EXPIRE
                await prisma.business.update({
                    where: { id: b.id },
                    data: { isActive: false }
                })
                log.push(`[EXPIRED] Business ${b.id} - No credits`)
            }
        }

        return NextResponse.json({ success: true, processed: log })

    } catch (error) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
