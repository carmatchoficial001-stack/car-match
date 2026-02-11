// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic' // Ensure it always runs fresh

/**
 * CRON JOB: Auto-Renovación de Suscripciones
 * Se ejecuta periódicamente (ej. cada noche)
 * 1. Busca vehículos ACTIVOS que ya expiraron (expiresAt < NOW).
 * 2. Verifica si el dueño tiene Creditos.
 * 3. Si tiene créditos -> Descuenta 1, Extiende 30 días, Registra pago.
 * 4. Si NO tiene créditos -> Pasa a INACTIVO.
 */
export async function GET(request: Request) {
    // 🔐 Seguridad básica: Validar token de cron (en producción usar headers como Authorization)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const now = new Date()

        // 1. Buscar vehículos expirados que todavía están marcados como ACTIVOS
        const expiredVehicles = await prisma.vehicle.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lt: now // Ya pasó la fecha
                }
            },
            include: {
                user: true // Necesitamos saber los créditos del usuario
            },
            take: 100 // Procesar en lotes para no saturar memoria
        })

        if (expiredVehicles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay vehículos expirados pendientes de procesar.'
            })
        }

        const results = {
            renewed: 0,
            deactivated: 0
        }

        // 2. Procesar cada vehículo
        for (const vehicle of expiredVehicles) {
            const user = vehicle.user

            // Caso A: Usuario tiene créditos suficientes (>= 1)
            if (user.credits >= 1) {
                // Transacción atómica: Restar crédito + Renovar fecha + Crear log
                await prisma.$transaction([
                    // 1. Actualizar Usuario
                    prisma.user.update({
                        where: { id: user.id },
                        data: { credits: { decrement: 1 } }
                    }),
                    // 2. Actualizar Vehículo (Extender 30 días)
                    prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: {
                            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 días
                            updatedAt: now
                        }
                    }),
                    // 3. Registrar Transacción
                    prisma.creditTransaction.create({
                        data: {
                            userId: user.id,
                            amount: -1, // Gasto
                            description: `Renovación mensual: ${vehicle.brand} ${vehicle.model}`,
                            relatedId: vehicle.id,
                            details: { type: 'AUTO_RENEWAL', vehicleTitle: vehicle.title }
                        }
                    })
                ])
                results.renewed++
            }
            // Caso B: Sin fondos -> Desactivar
            else {
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        status: 'INACTIVE',
                        // No borramos expiresAt, solo cambiamos estado.
                        // Cuando pague, reactivará desde el momento del pago.
                    }
                })

                // Opcional: Notificar al usuario "Tu vehículo ha sido pausado por falta de créditos"
                // await sendNotification(user.id, ...)

                results.deactivated++
            }
        }

        return NextResponse.json({
            success: true,
            processed: expiredVehicles.length,
            details: results
        })

    } catch (error) {
        console.error('Error en Cron de Renovación:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
