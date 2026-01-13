import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: { user: { select: { name: true, image: true, id: true } } }
        })

        if (!vehicle) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
        }

        return NextResponse.json({ vehicle })
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { id } = await params
        const body = await request.json()
        const { status, ...updateData } = body

        // Verificar propiedad del vehículo
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: { userId: true, status: true, title: true, brand: true, model: true }
        })

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
        }

        if (vehicle.userId !== user.id) {
            return NextResponse.json({ error: 'No tienes permiso para editar este vehículo' }, { status: 403 })
        }

        // Validar que el status sea un valor válido del enum
        if (status && !['ACTIVE', 'INACTIVE', 'SOLD'].includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
        }

        // Si se está editando, reseteamos la moderación si cambian datos clave
        const keyFieldsChanged = updateData.brand || updateData.model || updateData.year || updateData.images
        const finalUpdateData: any = { ...updateData }

        let creditDeducted = false

        // 💳 LÓGICA DE CRÉDITOS PARA ACTIVACIÓN
        if (body.useCredit === true && (status === 'ACTIVE' || vehicle.status !== 'ACTIVE')) {
            const userWithCredits = await prisma.user.findUnique({
                where: { id: user.id },
                select: { credits: true }
            })

            if ((userWithCredits?.credits || 0) < 1) {
                return NextResponse.json({ error: 'Saldo de créditos insuficiente' }, { status: 402 })
            }

            // Deducción de crédito y actualización de vencimiento
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: { credits: { decrement: 1 } }
                }),
                prisma.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -1,
                        description: `Activación de anuncio: ${vehicle.title}`,
                        relatedId: id,
                        details: { action: 'ACTIVATE_VEHICLE', vehicleId: id }
                    }
                })
            ])

            // Extender vencimiento 30 días
            const newExpiry = new Date()
            newExpiry.setDate(newExpiry.getDate() + 30)
            finalUpdateData.expiresAt = newExpiry
            finalUpdateData.status = 'ACTIVE'
            finalUpdateData.moderationStatus = 'APPROVED' // Forzamos aprobación si pagó
            creditDeducted = true
        }

        if (updateData.operatingHours !== undefined) finalUpdateData.operatingHours = updateData.operatingHours ? parseInt(updateData.operatingHours.toString()) : null

        // Nuevos campos técnicos para la Autoridad de Datos CarMatch
        if (updateData.hp !== undefined) finalUpdateData.hp = updateData.hp ? parseInt(updateData.hp.toString()) : null
        if (updateData.torque !== undefined) finalUpdateData.torque = updateData.torque || null
        if (updateData.aspiration !== undefined) finalUpdateData.aspiration = updateData.aspiration || null
        if (updateData.cylinders !== undefined) finalUpdateData.cylinders = updateData.cylinders ? parseInt(updateData.cylinders.toString()) : null
        if (updateData.batteryCapacity !== undefined) finalUpdateData.batteryCapacity = updateData.batteryCapacity ? parseFloat(updateData.batteryCapacity.toString()) : null
        if (updateData.range !== undefined) finalUpdateData.range = updateData.range ? parseInt(updateData.range.toString()) : null
        if (updateData.weight !== undefined) finalUpdateData.weight = updateData.weight ? parseInt(updateData.weight.toString()) : null
        if (updateData.axles !== undefined) finalUpdateData.axles = updateData.axles ? parseInt(updateData.axles.toString()) : null

        if (status) {
            finalUpdateData.status = status
        }

        // 🔄 SINCRONIZAR TÍTULO: Si cambió marca, modelo o año, O si se está aprobando, actualizar el título
        if (updateData.brand || updateData.model || updateData.year || finalUpdateData.moderationStatus === 'APPROVED') {
            const nextBrand = updateData.brand || vehicle.brand
            const nextModel = updateData.model || vehicle.model
            const nextYear = updateData.year !== undefined ? updateData.year : (vehicle as any).year
            finalUpdateData.title = `${nextBrand} ${nextModel} ${nextYear}`
        }

        if (keyFieldsChanged) {
            finalUpdateData.moderationStatus = 'PENDING_AI'
            // Podríamos disparar la moderación de nuevo aquí, o dejar que el cron lo haga
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: finalUpdateData
        })

        // 🔔 NOTIFICACIÓN: Si cambia a ACTIVO desde un estado inactivo
        if (updatedVehicle.status === 'ACTIVE' && vehicle.status !== 'ACTIVE') {
            try {
                await notifyFavoriters(id, vehicle.title, vehicle.brand, vehicle.model)
            } catch (notificationError) {
                console.error('Error enviando notificaciones (non-blocking):', notificationError)
                // No bloqueamos la respuesta si falla el envío de notificaciones
            }
        }

        return NextResponse.json({
            success: true,
            vehicle: updatedVehicle,
            creditDeducted
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined

        console.error('❌ Error actualizando vehículo:', {
            error: errorMessage,
            stack: errorStack,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({
            error: 'Error interno',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, { status: 500 })
    }
}

async function notifyFavoriters(vehicleId: string, title: string, brand: string, model: string) {
    try {
        const importWebPush = await import('web-push')
        const webPush = importWebPush.default // Handle CJS/ESM interop if needed

        // 1. Obtener usuarios que dieron favorito (y sus suscripciones push si existen)
        const favorites = await prisma.favorite.findMany({
            where: { vehicleId },
            include: {
                user: {
                    include: {
                        pushSubscriptions: true
                    }
                }
            }
        })

        if (favorites.length === 0) return

        // 2. Preparar payload
        const notificationPayload = {
            title: '¡Vehículo Disponible!',
            body: `El ${brand} ${model} que te gustó está disponible de nuevo.`,
            url: `/vehicle/${vehicleId}`,
            icon: '/icon-192x192.png'
        }

        // 3. Enviar notificaciones
        // (Nota: Esto asume que tienes configurado web-push en lib/push o similar,
        //  aquí estoy usando la lógica cruda para asegurar que funcione, pero idealmente reutilizaría lib/push)

        // REVISANDO: El proyecto tiene `src/lib/push.ts`? Probablemente.
        // Vamos a intentar usar un import dinámico de una función helper si existe, o usar lo que vi en `api/vehicles/route.ts`

        // Viendo `api/vehicles/route.ts` step 83:
        // import('@/lib/push').then(async (push) => { ... })

        // Replicamos ese patrón para consistencia
        const pushLib = await import('@/lib/push')

        for (const fav of favorites) {
            for (const sub of fav.user.pushSubscriptions) {
                try {
                    await pushLib.sendPushNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, notificationPayload)
                } catch (err) {
                    console.error('Failed to send push to sub:', sub.id, err)
                    // Opcional: eliminar suscripción si es 410 Gone
                }
            }
        }

    } catch (error) {
        console.error('Error en notifyFavoriters:', error)
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

        const { id } = await params
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!vehicle) return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
        if (vehicle.userId !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

        await prisma.vehicle.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error eliminando vehículo:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
