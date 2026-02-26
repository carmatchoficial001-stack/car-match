// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'

/**
 * CRON JOB: Limpieza y Renovación Automática
 * Se ejecuta 1 vez al día.
 */
export async function GET(request: NextRequest) {
    try {
        // 🔐 Verificar firma de Cron (Vercel Cron)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

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

        // 💰 3. AUTO-DELETE IMÁGENES ANTIGUAS
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const oldVehicles = await prisma.vehicle.findMany({
            where: {
                OR: [
                    { status: 'SOLD', updatedAt: { lt: thirtyDaysAgo } },
                    { status: 'INACTIVE', updatedAt: { lt: thirtyDaysAgo } }
                ],
                images: { isEmpty: false }
            },
            select: { id: true, images: true, brand: true, model: true }
        })

        let deletedImagesCount = 0
        for (const vehicle of oldVehicles) {
            for (const imageUrl of vehicle.images) {
                try {
                    await deleteFromCloudinary(imageUrl)
                    deletedImagesCount++
                } catch (error) {
                    console.error(`Failed to delete image ${imageUrl}:`, error)
                }
            }

            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { images: [] }
            })

            log.push(`[CLEANED] Vehicle ${vehicle.id} (${vehicle.brand} ${vehicle.model}) - Deleted ${vehicle.images.length} images`)
        }

        return NextResponse.json({
            success: true,
            processed: log,
            stats: {
                vehiclesProcessed: expiredVehicles.length,
                businessesProcessed: expiredBusinesses.length,
                imagesDeleted: deletedImagesCount,
                vehiclesCleaned: oldVehicles.length
            }
        })

    } catch (error) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
