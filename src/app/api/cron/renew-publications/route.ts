import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * CRON JOB: Renovación Mensual de Publicaciones
 * Ejecutar DIARIAMENTE (ej: cada día a las 2 AM)
 * 
 * Lógica:
 * 1. Buscar vehículos/negocios que expiran HOY
 * 2. Si el usuario tiene créditos:
 *    - Descuenta 1 crédito
 *    - Extiende la publicación 30 días más
 * 3. Si NO tiene créditos:
 *    - Marca la publicación como INACTIVA
 */
export async function GET(request: NextRequest) {
    try {
        const today = new Date()
        today.setHours(23, 59, 59, 999) // Fin del día

        // ═══ RENOVAR VEHÍCULOS ═══
        const expiringVehicles = await prisma.vehicle.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lte: today // Expira hoy o antes
                }
            },
            include: {
                user: {
                    select: { credits: true, id: true }
                }
            }
        })

        let vehiclesRenewed = 0
        let vehiclesDeactivated = 0

        for (const vehicle of expiringVehicles) {
            if (vehicle.user.credits >= 1) {
                // ✅ RENOVAR: Descontar crédito y extender 30 días
                const newExpiresAt = new Date()
                newExpiresAt.setDate(newExpiresAt.getDate() + 30)

                await prisma.$transaction([
                    prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: { expiresAt: newExpiresAt }
                    }),
                    prisma.user.update({
                        where: { id: vehicle.user.id },
                        data: { credits: { decrement: 1 } }
                    }),
                    prisma.creditTransaction.create({
                        data: {
                            userId: vehicle.user.id,
                            amount: -1,
                            description: `Renovación mensual: ${vehicle.brand} ${vehicle.model}`,
                            relatedId: vehicle.id,
                            details: { type: 'vehicle_renewal' }
                        }
                    })
                ])
                vehiclesRenewed++
            } else {
                // ❌ DESACTIVAR: Sin créditos
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { status: 'INACTIVE' }
                })
                vehiclesDeactivated++

                // TODO: Enviar notificación al usuario
                // "Tu publicación '{title}' necesita créditos. Compra para reactivarla."
            }
        }

        // ═══ RENOVAR NEGOCIOS ═══
        const expiringBusinesses = await prisma.business.findMany({
            where: {
                isActive: true,
                expiresAt: {
                    lte: today
                }
            },
            include: {
                user: {
                    select: { credits: true, id: true }
                }
            }
        })

        let businessesRenewed = 0
        let businessesDeactivated = 0

        for (const business of expiringBusinesses) {
            if (business.user.credits >= 1) {
                // ✅ RENOVAR
                const newExpiresAt = new Date()
                newExpiresAt.setDate(newExpiresAt.getDate() + 30)

                await prisma.$transaction([
                    prisma.business.update({
                        where: { id: business.id },
                        data: { expiresAt: newExpiresAt }
                    }),
                    prisma.user.update({
                        where: { id: business.user.id },
                        data: { credits: { decrement: 1 } }
                    }),
                    prisma.creditTransaction.create({
                        data: {
                            userId: business.user.id,
                            amount: -1,
                            description: `Renovación mensual: ${business.name}`,
                            relatedId: business.id,
                            details: { type: 'business_renewal' }
                        }
                    })
                ])
                businessesRenewed++
            } else {
                // ❌ DESACTIVAR
                await prisma.business.update({
                    where: { id: business.id },
                    data: { isActive: false }
                })
                businessesDeactivated++
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                vehicles: {
                    renewed: vehiclesRenewed,
                    deactivated: vehiclesDeactivated
                },
                businesses: {
                    renewed: businessesRenewed,
                    deactivated: businessesDeactivated
                }
            }
        })

    } catch (error) {
        console.error('Error in renewal cron:', error)
        return NextResponse.json({ error: 'Cron error' }, { status: 500 })
    }
}
