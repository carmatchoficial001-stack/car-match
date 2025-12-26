import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
        const { status } = body

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

        // Actualizar estado
        if (status) {
            const updatedVehicle = await prisma.vehicle.update({
                where: { id },
                data: { status }
            })

            // 🔔 NOTIFICACIÓN: Si cambia a ACTIVO desde un estado inactivo
            if (status === 'ACTIVE' && vehicle.status !== 'ACTIVE') {
                // Enviar notificaciones en segundo plano
                notifyFavoriters(id, vehicle.title, vehicle.brand, vehicle.model)
            }

            return NextResponse.json({ success: true, vehicle: updatedVehicle })
        }

        return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

    } catch (error) {
        console.error('Error actualizando vehículo:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
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
